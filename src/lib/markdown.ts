import React from 'react';

/**
 * Simple markdown parser for CV content
 * Handles basic markdown syntax like **bold** and *italic*
 */

export function parseMarkdown(text: string): React.ReactNode {
  if (!text) return text;

  // Split by markdown patterns and process each part
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  
  return parts.map((part, index) => {
    // Bold text: **text**
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      return React.createElement('strong', { key: index, className: 'font-semibold' }, content);
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
