/**
 * Preload card images to prevent flickering/missing images during gameplay
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
 * Preload all card images
 * Returns a promise that resolves when all images are loaded
 */
export function preloadCardImages(): Promise<void[]> {
  const imagePromises = CARD_IMAGES.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        logger.warn(`Failed to preload image: ${src}`);
        resolve(); // Resolve anyway to not block the app
      };
      img.src = src;
    });
  });

  return Promise.all(imagePromises);
}
