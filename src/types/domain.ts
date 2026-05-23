export type DiagramFormat = 'mermaid' | 'plantuml' | 'graphviz' | 'ascii';

export type QueueStatus =
  | 'pending'
  | 'validating'
  | 'fetching'
  | 'converting'
  | 'completed'
  | 'failed';

export type MLProvider = 'lm-studio' | 'openai' | 'anthropic';

export interface MLApiConfig {
  provider: MLProvider;
  endpointUrl: string;
  model: string;
  apiKey?: string;
}

export interface ImagePayload {
  url: string;
  mediaType: string;
  base64: string;
  sizeBytes: number;
  textContent?: string;
}

export interface Diagram {
  id: string;
  sourceUrl: string;
  title: string;
  format: DiagramFormat;
  code: string;
  createdAt: string;
}

export interface QueueItem {
  id: string;
  url: string;
  format: DiagramFormat;
  status: QueueStatus;
  progress: number;
  message: string;
  error?: string;
  diagram?: Diagram;
  createdAt: string;
  updatedAt: string;
}

export interface MarkdownDocument {
  title: string;
  diagrams: Diagram[];
  content: string;
}

export interface ProcessImageRequest {
  url: string;
  format: DiagramFormat;
  config: MLApiConfig;
}

export interface FileResult {
  canceled: boolean;
  filePath?: string;
  content?: string;
}
