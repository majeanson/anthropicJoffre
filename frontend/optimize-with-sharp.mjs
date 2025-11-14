import sharp from 'sharp';
import { readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

async function optimizeImages() {
  const inputDir = 'public/cards';
  const outputDir = 'public/cards/optimized';

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('Optimizing images with Sharp...\n');

  // Get all jpg files
  const files = readdirSync(inputDir).filter(file => file.endsWith('.jpg'));

  for (const file of files) {
    const inputPath = join(inputDir, file);
    const outputPath = join(outputDir, file);

    try {
      const inputStats = statSync(inputPath);
      const inputSizeKB = (inputStats.size / 1024).toFixed(1);

      // Optimize with sharp
      await sharp(inputPath)
        .jpeg({
          quality: 85,
          progressive: true,
          mozjpeg: true
        })
        .toFile(outputPath);

      const outputStats = statSync(outputPath);
      const outputSizeKB = (outputStats.size / 1024).toFixed(1);
      const reduction = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

      console.log(`✓ ${file}: ${inputSizeKB}KB → ${outputSizeKB}KB (${reduction}% reduction)`);
    } catch (error) {
      console.error(`✗ Failed to optimize ${file}:`, error.message);
    }
  }

  console.log('\n✅ Image optimization complete!');
}

optimizeImages().catch(console.error);
