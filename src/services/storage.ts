import { dialog } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import type { FileResult } from '../types/domain.js';

export async function saveMarkdownFile(content: string): Promise<FileResult> {
  const result = await dialog.showSaveDialog({
    title: 'Save diagram Markdown',
    defaultPath: 'image-diagrams.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  await writeFile(result.filePath, content, 'utf8');
  return { canceled: false, filePath: result.filePath };
}

export async function openMarkdownFile(): Promise<FileResult> {
  const result = await dialog.showOpenDialog({
    title: 'Open diagram Markdown',
    properties: ['openFile'],
    filters: [{ name: 'Markdown', extensions: ['md'] }]
  });

  if (result.canceled || !result.filePaths[0]) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const content = await readFile(filePath, 'utf8');
  return { canceled: false, filePath, content };
}
