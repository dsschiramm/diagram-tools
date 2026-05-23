import type { Diagram, MarkdownDocument } from '../types/domain.js';

const fenceByFormat = {
  mermaid: 'mermaid',
  plantuml: 'plantuml',
  graphviz: 'dot',
  ascii: 'text'
} as const;

export function createMarkdownDocument(diagrams: Diagram[]): MarkdownDocument {
  const title = 'Image to Diagram Export';
  const sections = diagrams.map((diagram, index) => {
    const fence = fenceByFormat[diagram.format];
    return [
      `## ${index + 1}. ${diagram.title}`,
      '',
      `- Source URL: ${diagram.sourceUrl}`,
      `- Format: ${diagram.format}`,
      `- Generated: ${diagram.createdAt}`,
      '',
      `\`\`\`${fence}`,
      diagram.code,
      '```'
    ].join('\n');
  });

  return {
    title,
    diagrams,
    content: [`# ${title}`, '', ...sections].join('\n\n')
  };
}
