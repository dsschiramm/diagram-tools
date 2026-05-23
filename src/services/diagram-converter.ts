import { randomUUID } from 'node:crypto';
import type { Diagram, ProcessImageRequest } from '../types/domain.js';
import { fetchImage } from './http-client.js';
import { generateDiagram } from './ml-api.js';

export async function convertImageToDiagram(request: ProcessImageRequest): Promise<Diagram> {
  const image = await fetchImage(request.url);
  const generated = await generateDiagram(request.config, image, request.format);

  return {
    id: randomUUID(),
    sourceUrl: image.url,
    title: generated.title,
    format: request.format,
    code: generated.code,
    createdAt: new Date().toISOString()
  };
}
