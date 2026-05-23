import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';
import type { MLApiConfig } from '../types/domain.js';

const configSchema = z.object({
  provider: z.enum(['lm-studio', 'openai', 'anthropic']).default('lm-studio'),
  endpointUrl: z.string().url().default('http://localhost:1234/v1/chat/completions'),
  model: z.string().min(1).default('local-vision-model'),
  apiKey: z.string().optional()
});

const configDir = join(homedir(), '.image-diagram');
const configPath = join(configDir, 'config.json');

export function defaultConfig(): MLApiConfig {
  return {
    provider: 'lm-studio',
    endpointUrl: 'http://localhost:1234/v1/chat/completions',
    model: 'local-vision-model'
  };
}

export async function loadConfig(): Promise<MLApiConfig> {
  try {
    const raw = await readFile(configPath, 'utf8');
    return configSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (isMissingFile(error)) {
      return defaultConfig();
    }
    throw error;
  }
}

export async function saveConfig(config: MLApiConfig): Promise<MLApiConfig> {
  const parsed = configSchema.parse(config);
  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  return parsed;
}

function isMissingFile(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}
