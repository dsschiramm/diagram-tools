import { contextBridge, ipcRenderer } from 'electron';
import type { Diagram, FileResult, MLApiConfig, ProcessImageRequest } from '../types/domain.js';

type ApiResponse<T> = Promise<{ ok: true; data: T } | { ok: false; error: string; data?: T }>;

const api = {
  loadConfig: (): ApiResponse<MLApiConfig> => ipcRenderer.invoke('config:load'),
  saveConfig: (config: MLApiConfig): ApiResponse<MLApiConfig> =>
    ipcRenderer.invoke('config:save', config),
  convertDiagram: (request: ProcessImageRequest): ApiResponse<Diagram> =>
    ipcRenderer.invoke('diagram:convert', request),
  createMarkdown: (diagrams: Diagram[]): ApiResponse<string> =>
    ipcRenderer.invoke('markdown:create', diagrams),
  saveMarkdown: (content: string): ApiResponse<FileResult> => ipcRenderer.invoke('file:save', content),
  openMarkdown: (): ApiResponse<FileResult> => ipcRenderer.invoke('file:open')
};

contextBridge.exposeInMainWorld('imageDiagram', api);

export type ImageDiagramApi = typeof api;
