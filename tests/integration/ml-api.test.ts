import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDiagram } from '../../src/services/ml-api';
import type { ImagePayload, MLApiConfig } from '../../src/types/domain';

const config: MLApiConfig = {
  provider: 'openai',
  endpointUrl: 'https://api.example.test/v1/chat/completions',
  model: 'vision-model',
  apiKey: 'test-key'
};

const image: ImagePayload = {
  url: 'https://example.com/diagram.png',
  mediaType: 'image/png',
  base64: 'aW1hZ2U=',
  sizeBytes: 5
};

describe('generateDiagram', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses fenced diagram code from compatible chat completion responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: '# Login Flow\n```mermaid\nflowchart LR\n  Login --> App\n```'
              }
            }
          ]
        })
      }))
    );

    await expect(generateDiagram(config, image, 'mermaid')).resolves.toEqual({
      title: 'Login Flow',
      code: 'flowchart LR\n  Login --> App'
    });
  });
});
