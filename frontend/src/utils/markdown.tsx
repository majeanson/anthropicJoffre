/**
 * Markdown Parser Utility
 *
 * Parses basic markdown syntax and returns React elements.
 * Supports: **bold**, *italic*, `code`, ~~strikethrough~~, > blockquotes
 *
 * Note: This is intentionally simple and does NOT support nested formatting
 * to keep the implementation secure and predictable.
 */

import React from 'react';

interface ParsedSegment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'strikethrough' | 'quote';
  content: string;
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Parse markdown text into segments
 */
function parseMarkdown(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let lastIndex = 0;

  // Combined regex to find any markdown pattern
  const combinedPattern = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(~~(.+?)~~)|(`(.+?)`)/g;

  let match;
  while ((match = combinedPattern.exec(text)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        segments.push({ type: 'text', content: textBefore });
      }
    }

    // Determine which pattern matched
    if (match[1]) {
      // Bold: **text**
      segments.push({ type: 'bold', content: match[2] });
    } else if (match[3]) {
      // Italic: *text*
      segments.push({ type: 'italic', content: match[4] });
    } else if (match[5]) {
      // Strikethrough: ~~text~~
      segments.push({ type: 'strikethrough', content: match[6] });
    } else if (match[7]) {
      // Code: `text`
      segments.push({ type: 'code', content: match[8] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add any remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  // If no matches, return the whole text as a single segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content: text });
  }

  return segments;
}

/**
 * Render a segment as a React element
 */
function renderSegment(segment: ParsedSegment, index: number): React.ReactNode {
  const escapedContent = escapeHtml(segment.content);

  switch (segment.type) {
    case 'bold':
      return (
        <strong key={index} className="font-bold">
          {escapedContent}
        </strong>
      );
    case 'italic':
      return (
        <em key={index} className="italic">
          {escapedContent}
        </em>
      );
    case 'code':
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 bg-skin-tertiary rounded text-sm font-mono text-pink-400"
        >
          {escapedContent}
        </code>
      );
    case 'strikethrough':
      return (
        <del key={index} className="line-through text-skin-muted">
          {escapedContent}
        </del>
      );
    case 'quote':
      return (
        <blockquote
          key={index}
          className="pl-2 border-l-2 border-skin-accent text-skin-muted italic"
        >
          {escapedContent}
        </blockquote>
      );
    default:
      return <span key={index}>{escapedContent}</span>;
  }
}

/**
 * Parse and render markdown text as React elements
 */
export function renderMarkdown(text: string): React.ReactNode {
  // Handle blockquotes (lines starting with >)
  const lines = text.split('\n');
  const processedLines: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (line.startsWith('> ')) {
      // Blockquote
      const quoteContent = line.slice(2);
      const segments = parseMarkdown(quoteContent);
      processedLines.push(
        <blockquote
          key={`line-${lineIndex}`}
          className="pl-2 border-l-2 border-skin-accent text-skin-muted italic my-1"
        >
          {segments.map((seg, i) => renderSegment(seg, i))}
        </blockquote>
      );
    } else {
      // Regular line with markdown
      const segments = parseMarkdown(line);
      processedLines.push(
        <span key={`line-${lineIndex}`}>
          {segments.map((seg, i) => renderSegment(seg, i))}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      );
    }
  });

  return <>{processedLines}</>;
}

/**
 * Check if text contains any markdown formatting
 */
export function hasMarkdown(text: string): boolean {
  return /(\*\*.+?\*\*)|(\*.+?\*)|(~~.+?~~)|(`[^`]+`)|(^> )/.test(text);
}

/**
 * Strip markdown formatting from text (for previews)
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^> /gm, '');
}

export default renderMarkdown;
