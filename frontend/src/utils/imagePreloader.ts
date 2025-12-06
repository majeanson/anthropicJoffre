/**
 * Preload card images to prevent flickering/missing images during gameplay
 * Uses requestIdleCallback to defer loading and not block initial render
 */

import logger from './logger';

const CARD_IMAGES = [
  // Emblems for regular cards (production: <95KB each, 37% smaller)
  '/cards/production/red_emblem.jpg',
  '/cards/production/blue_emblem.jpg',
  '/cards/production/green_emblem.jpg',
  '/cards/production/brown_emblem.jpg',

  // Special bon cards (production: <95KB each, 37% smaller)
  '/cards/production/red_bon.jpg',
  '/cards/production/brown_bon.jpg',
];

/**
 * Load a single image
 */
function loadImage(src: string): Promise<void> {
  return new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => {
      logger.warn(`Failed to preload image: ${src}`);
      resolve(); // Resolve anyway to not block the app
    };
    img.src = src;
  });
}

/**
 * Preload all card images
 * Defers loading to after initial render using requestIdleCallback
 * Falls back to setTimeout for browsers without requestIdleCallback support
 */
export function preloadCardImages(): Promise<void[]> {
  return new Promise((resolve) => {
    const doPreload = () => {
      Promise.all(CARD_IMAGES.map(loadImage)).then(resolve);
    };

    // Use requestIdleCallback to load images during browser idle time
    // This prevents blocking the initial page render
    if ('requestIdleCallback' in window) {
      (
        window as Window & {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void;
        }
      ).requestIdleCallback(doPreload, { timeout: 3000 });
    } else {
      // Fallback: defer by 1 second for older browsers
      setTimeout(doPreload, 1000);
    }
  });
}
