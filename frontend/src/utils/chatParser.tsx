/**
 * Chat Message Parser
 * Sprint 3 Phase 3.4
 *
 * Parses chat messages for @mentions, URLs, and returns JSX with proper highlighting
 */

import React from 'react';

interface ParsedMessageSegment {
  type: 'text' | 'mention' | 'url';
  content: string;
  href?: string;
}

/**
 * Parse a message into segments (text, mentions, URLs)
 */
export function parseMessage(message: string): ParsedMessageSegment[] {
  const segments: ParsedMessageSegment[] = [];

  // Regex patterns
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const mentionPattern = /@[\w-]+/g;

  let lastIndex = 0;
  const allMatches: Array<{
    index: number;
    length: number;
    type: 'url' | 'mention';
    content: string;
    href?: string;
  }> = [];

  // Find all URLs
  let urlMatch;
  while ((urlMatch = urlPattern.exec(message)) !== null) {
    allMatches.push({
      index: urlMatch.index,
      length: urlMatch[0].length,
      type: 'url',
      content: urlMatch[0],
      href: urlMatch[0],
    });
  }

  // Find all mentions
  let mentionMatch;
  while ((mentionMatch = mentionPattern.exec(message)) !== null) {
    allMatches.push({
      index: mentionMatch.index,
      length: mentionMatch[0].length,
      type: 'mention',
      content: mentionMatch[0],
    });
  }

  // Sort matches by index
  allMatches.sort((a, b) => a.index - b.index);

  // Build segments
  for (const match of allMatches) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: message.substring(lastIndex, match.index),
      });
    }

    // Add the match
    segments.push({
      type: match.type,
      content: match.content,
      href: match.href,
    });

    lastIndex = match.index + match.length;
  }

  // Add remaining text
  if (lastIndex < message.length) {
    segments.push({
      type: 'text',
      content: message.substring(lastIndex),
    });
  }

  // If no matches found, return the whole message as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content: message });
  }

  return segments;
}

/**
 * Render parsed message segments as JSX
 */
export function renderParsedMessage(
  segments: ParsedMessageSegment[],
  currentPlayerName: string,
  isOwnMessage: boolean
): React.ReactNode {
  return segments.map((segment, index) => {
    switch (segment.type) {
      case 'mention':
        // Check if this mention is for the current player
        const mentionedName = segment.content.substring(1); // Remove @
        const isMentioningCurrentPlayer =
          mentionedName.toLowerCase() === currentPlayerName.toLowerCase();

        return (
          <span
            key={index}
            className={`font-bold ${
              isMentioningCurrentPlayer
                ? 'bg-yellow-300 dark:bg-yellow-600 px-1 rounded'
                : isOwnMessage
                  ? 'text-blue-200'
                  : 'text-blue-600 dark:text-blue-400'
            }`}
          >
            {segment.content}
          </span>
        );

      case 'url':
        return (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline hover:no-underline ${
              isOwnMessage
                ? 'text-blue-100 hover:text-white'
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {segment.content}
          </a>
        );

      case 'text':
      default:
        return <span key={index}>{segment.content}</span>;
    }
  });
}

/**
 * Get all mentions from a message
 */
export function extractMentions(message: string): string[] {
  const mentionPattern = /@([\w-]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionPattern.exec(message)) !== null) {
    mentions.push(match[1]); // Just the username without @
  }

  return mentions;
}

/**
 * Check if a message mentions a specific player
 */
export function messageHasMention(message: string, playerName: string): boolean {
  const mentions = extractMentions(message);
  return mentions.some((mention) => mention.toLowerCase() === playerName.toLowerCase());
}
