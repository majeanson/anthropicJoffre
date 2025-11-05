/**
 * CardPreview Component
 * Sprint 1 Phase 1: Advanced Card Hover Effects
 *
 * Shows an enlarged preview of a card when hovering over it
 * Appears after a 500ms delay to avoid flickering
 */

import { Card as CardType } from '../types/game';
import { Card } from './Card';
import { useEffect, useRef } from 'react';

interface CardPreviewProps {
  card: CardType;
  mouseX: number;
  mouseY: number;
}

export function CardPreview({ card, mouseX, mouseY }: CardPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  // Position the preview near the cursor
  useEffect(() => {
    if (!previewRef.current) return;

    const preview = previewRef.current;
    const padding = 20;
    const previewWidth = 140; // large card width
    const previewHeight = 200; // large card height

    // Calculate position (prefer right/bottom, but flip if too close to edge)
    let left = mouseX + padding;
    let top = mouseY + padding;

    // Check if preview would go off-screen horizontally
    if (left + previewWidth > window.innerWidth) {
      left = mouseX - previewWidth - padding;
    }

    // Check if preview would go off-screen vertically
    if (top + previewHeight > window.innerHeight) {
      top = mouseY - previewHeight - padding;
    }

    // Ensure preview doesn't go off the left or top edge
    left = Math.max(padding, left);
    top = Math.max(padding, top);

    preview.style.left = `${left}px`;
    preview.style.top = `${top}px`;
  }, [mouseX, mouseY]);

  return (
    <div
      ref={previewRef}
      className="fixed z-[9999] pointer-events-none motion-safe:animate-card-preview-zoom motion-reduce:opacity-100"
      style={{
        filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.3))',
      }}
    >
      <Card card={card} size="large" />
    </div>
  );
}
