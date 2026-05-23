import type { DiagramFormat, ImagePayload, MLApiConfig } from '../types/domain.js';
import { AppError } from '../utils/errors.js';
import { retryWithBackoff } from '../utils/retry.js';

interface ChatMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

export async function generateDiagram(
  config: MLApiConfig,
  image: ImagePayload,
  format: DiagramFormat
): Promise<{ title: string; code: string }> {
  return retryWithBackoff(() => callProvider(config, image, format), isRetryableMlError);
}

async function callProvider(
  config: MLApiConfig,
  image: ImagePayload,
  format: DiagramFormat
): Promise<{ title: string; code: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  const body = providerRequestBody(config, image, format);

  try {
    const response = await fetch(config.endpointUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}),
        ...(config.provider === 'anthropic' ? { 'anthropic-version': '2023-06-01' } : {})
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => '');
      throw new AppError(
        `ML API failed with ${response.status}${responseText ? `: ${responseText}` : ''}`,
        mlStatusMessage(response.status, responseText),
        response.status === 408 ||
          response.status === 409 ||
          response.status === 429 ||
          response.status >= 500
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const content = extractContent(data);
    if (!content) {
      throw new AppError(
        'Empty ML response',
        'The ML API returned an empty response. Check the selected model and try again.',
        false
      );
    }

    return parseDiagramResponse(content, format);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(
        'ML API timeout',
        'The ML API call timed out after 60 seconds. Try a smaller image or a faster model.',
        true
      );
    }
    throw new AppError(
      'ML API network error',
      'The ML API could not be reached. Check the endpoint URL and credentials.',
      true
    );
  } finally {
    clearTimeout(timeout);
  }
}

function providerRequestBody(
  config: MLApiConfig,
  image: ImagePayload,
  format: DiagramFormat
): unknown {
  const prompt = [
    `Analyze this image and convert it into an editable ${format} diagram.`,
    'Return a short title and only the diagram code.',
    'Preserve relationships, components, labels, and flow direction as accurately as possible.'
  ].join(' ');

  if (image.mediaType === 'image/svg+xml' && image.textContent) {
    return textOnlyRequestBody(
      config,
      [
        `Analyze this SVG source from ${image.url} and convert it into an editable ${format} diagram.`,
        'Return a short title and only the diagram code.',
        'Preserve node labels, components, group labels, arrows, and relationships.',
        '',
        'SVG source:',
        truncateSvg(image.textContent)
      ].join('\n')
    );
  }

  if (config.provider === 'anthropic') {
    return {
      model: config.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.base64
              }
            }
          ]
        }
      ]
    };
  }

  const content: ChatMessageContent[] = [
    { type: 'text', text: prompt },
    {
      type: 'image_url',
      image_url: {
        url:
          config.provider === 'lm-studio'
            ? image.base64
            : `data:${image.mediaType};base64,${image.base64}`
      }
    }
  ];

  return {
    model: config.model,
    messages: [{ role: 'user', content }],
    temperature: 0.1,
    max_tokens: 2000
  };
}

function textOnlyRequestBody(config: MLApiConfig, text: string): unknown {
  if (config.provider === 'anthropic') {
    return {
      model: config.model,
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text }]
        }
      ]
    };
  }

  return {
    model: config.model,
    messages: [{ role: 'user', content: text }],
    temperature: 0.1,
    max_tokens: 2000
  };
}

function extractContent(data: ChatCompletionResponse): string {
  const chatContent = data.choices?.[0]?.message?.content;
  if (chatContent) {
    return chatContent;
  }

  return (
    data.content
      ?.map((part) => part.text ?? '')
      .join('\n')
      .trim() ?? ''
  );
}

function parseDiagramResponse(
  content: string,
  format: DiagramFormat
): { title: string; code: string } {
  const titleMatch = content.match(/^#\s+(.+)$/m) ?? content.match(/^title:\s*(.+)$/im);
  const title = titleMatch?.[1]?.trim() || 'Generated Diagram';
  const fence = content.match(/```(?:mermaid|plantuml|dot|graphviz|ascii)?\s*([\s\S]*?)```/i);
  const code = (fence?.[1] ?? content)
    .replace(/^title:\s*.+$/im, '')
    .replace(/^#\s+.+$/m, '')
    .trim();

  if (!code) {
    throw new AppError(
      'No diagram code in ML response',
      `The ML API did not return usable ${format} diagram code.`,
      false
    );
  }

  return { title, code };
}

function mlStatusMessage(status: number, responseText = ''): string {
  const detail = extractProviderDetail(responseText);
  if (status === 401 || status === 403) {
    return 'The ML API rejected the credentials. Check the API key and provider settings.';
  }
  if (status === 429) {
    return 'The ML API rate limit was reached. The app retried automatically; try again later.';
  }
  return detail
    ? `The ML API returned ${status}: ${detail}`
    : `The ML API returned ${status}. Check the endpoint, model, and provider settings.`;
}

function isRetryableMlError(error: unknown): boolean {
  return error instanceof AppError ? error.retryable : true;
}

function truncateSvg(svg: string): string {
  const maxChars = 48_000;
  return svg.length > maxChars
    ? `${svg.slice(0, maxChars)}\n<!-- SVG truncated to fit model context -->`
    : svg;
}

function extractProviderDetail(responseText: string): string {
  if (!responseText) {
    return '';
  }

  try {
    const parsed = JSON.parse(responseText) as {
      error?: { message?: string } | string;
      message?: string;
    };
    if (typeof parsed.error === 'string') {
      return parsed.error;
    }
    return parsed.error?.message ?? parsed.message ?? responseText.slice(0, 240);
  } catch {
    return responseText.slice(0, 240);
  }
}
