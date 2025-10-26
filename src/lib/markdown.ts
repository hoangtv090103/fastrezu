import React from 'react';

/**
 * Enhanced markdown parser for CV content
 * Handles basic markdown syntax like **bold**, *italic*, bullet points, and line breaks
 */

export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return text;

  // Handle line breaks first
  const lines = text.split('\n');
  
  // Group consecutive bullet points and numbered lists
  const processedLines: React.ReactNode[] = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i];
    
    if (line.trim() === '') {
      processedLines.push(React.createElement('br', { key: i }));
      i++;
      continue;
    }

    // Handle horizontal rule
    if (line.trim().startsWith('---')) {
      processedLines.push(React.createElement('hr', { key: i, className: 'my-4 border-gray-300' }));
      i++;
      continue;
    }

    // Handle bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletItems: React.ReactNode[] = [];
      
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const content = lines[i].trim().substring(2);
        bulletItems.push(
          React.createElement('li', { key: i, className: 'mb-1' },
            React.createElement('span', { className: 'text-gray-700' }, parseInlineMarkdown(content))
          )
        );
        i++;
      }
      
      processedLines.push(
        React.createElement('ul', { key: `bullets-${i}`, className: 'list-disc list-inside ml-4 mb-2 space-y-1' }, bulletItems)
      );
      continue;
    }

    // Handle numbered lists
    const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      const numberedItems: React.ReactNode[] = [];
      
      while (i < lines.length) {
        const currentLine = lines[i];
        const match = currentLine.trim().match(/^(\d+)\.\s+(.+)$/);
        if (match) {
          const [, number, content] = match;
          numberedItems.push(
            React.createElement('li', { key: i, className: 'mb-1' },
              React.createElement('span', { className: 'text-gray-700' }, parseInlineMarkdown(content))
            )
          );
          i++;
        } else {
          break;
        }
      }
      
      processedLines.push(
        React.createElement('ol', { key: `numbered-${i}`, className: 'list-decimal list-inside ml-4 mb-2 space-y-1' }, numberedItems)
      );
      continue;
    }

    // Regular paragraph
    processedLines.push(
      React.createElement('div', { key: i, className: 'mb-2' }, parseInlineMarkdown(line))
    );
    i++;
  }

  return processedLines;
}

/**
 * Parse inline markdown (bold, italic) within a line
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  if (!text) return text;

  // Split by markdown patterns and process each part
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  return parts.map((part, index) => {
    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return React.createElement('strong', { key: index, className: 'font-semibold text-gray-900' }, content);
    }
    
    // Italic text: *text*
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      const content = part.slice(1, -1);
      return React.createElement('em', { key: index, className: 'italic' }, content);
    }
    
    // Regular text
    return part;
  });
}

/**
 * Parse markdown and return as string (for non-React contexts)
 */
export function parseMarkdownToString(text: string): string {
  if (!text) return text;

  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
