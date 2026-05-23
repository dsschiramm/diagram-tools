import type { ImageDiagramApi } from '../preload/index';

declare global {
  interface Window {
    imageDiagram: ImageDiagramApi;
  }
}

export {};
