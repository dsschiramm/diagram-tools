import { describe, expect, it } from 'vitest';
import { createMarkdownDocument } from '../../src/services/markdown';
import type { Diagram } from '../../src/types/domain';

describe('createMarkdownDocument', () => {
  it('exports diagram sections with source URL and fenced code', () => {
    const diagram: Diagram = {
      id: 'diagram-1',
      sourceUrl: 'https://example.com/diagram.png',
      title: 'System Flow',
      format: 'mermaid',
      code: 'flowchart TD\n  A --> B',
      createdAt: '2026-05-23T00:00:00.000Z'
    };

    const document = createMarkdownDocument([diagram]);

    expect(document.content).toContain('# Image to Diagram Export');
    expect(document.content).toContain('## 1. System Flow');
    expect(document.content).toContain('- Source URL: https://example.com/diagram.png');
    expect(document.content).toContain('```mermaid\nflowchart TD\n  A --> B\n```');
  });
});
