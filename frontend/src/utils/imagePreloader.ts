/**
 * Preload card images to prevent flickering/missing images during gameplay
 */

const CARD_IMAGES = [
  // Emblems for regular cards
  '/cards/red_emblem.jpg',
  '/cards/blue_emblem.jpg',
  '/cards/green_emblem.jpg',
  '/cards/brown_emblem.jpg',

  // Special bon cards
  '/cards/red_bon.jpg',
  '/cards/brown_bon.jpg',
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
        console.warn(`Failed to preload image: ${src}`);
        resolve(); // Resolve anyway to not block the app
      };
      img.src = src;
    });
  });

  return Promise.all(imagePromises);
}
