import { Buffer } from 'node:buffer';
import type { ImagePayload } from '../types/domain.js';
import { AppError } from '../utils/errors.js';
import { retryWithBackoff } from '../utils/retry.js';
import { assertImageSize, assertSupportedMediaType, validateImageUrl } from '../utils/validation.js';

const IMAGE_FETCH_TIMEOUT_MS = 30_000;

export async function fetchImage(urlInput: string): Promise<ImagePayload> {
  const url = validateImageUrl(urlInput);
  return retryWithBackoff(() => fetchImageOnce(url), isRetryableImageFetchError);
}

async function fetchImageOnce(url: URL): Promise<ImagePayload> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ImageToDiagram/0.1'
      }
    });

    if (!response.ok) {
      throw new AppError(
        `Image fetch failed with ${response.status}`,
        `The image could not be loaded (${response.status}). Check that the URL is public.`,
        response.status >= 500 || response.status === 429
      );
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      assertImageSize(Number(contentLength));
    }

    const mediaType = response.headers.get('content-type') ?? '';
    assertSupportedMediaType(mediaType);

    const arrayBuffer = await response.arrayBuffer();
    assertImageSize(arrayBuffer.byteLength);

    return {
      url: url.toString(),
      mediaType: mediaType.split(';')[0],
      base64: Buffer.from(arrayBuffer).toString('base64'),
      sizeBytes: arrayBuffer.byteLength,
      textContent:
        mediaType.split(';')[0].trim().toLowerCase() === 'image/svg+xml'
          ? Buffer.from(arrayBuffer).toString('utf8')
          : undefined
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(
        'Image fetch timeout',
        'The image fetch timed out after 30 seconds. Try another URL or check the network.',
        true
      );
    }
    throw new AppError(
      'Image fetch network error',
      `The image could not be loaded. ${networkErrorDetail(error)} Check the network connection and URL.`,
      true
    );
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableImageFetchError(error: unknown): boolean {
  return error instanceof AppError ? error.retryable : true;
}

function networkErrorDetail(error: unknown): string {
  if (error instanceof Error && error.message) {
    return `Network error: ${error.message}.`;
  }
  return '';
}
