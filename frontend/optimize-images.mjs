import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminPngquant from 'imagemin-pngquant';
import imageminSvgo from 'imagemin-svgo';
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, statSync, copyFileSync } from 'fs';
import { join, basename } from 'path';

async function optimizeImages() {
  const inputDir = 'public/cards';
  const outputDir = 'public/cards/optimized';

  // Create output directory if it doesn't exist
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('Optimizing images...');

  const files = await imagemin([`${inputDir}/*.{jpg,png,svg}`], {
    destination: outputDir,
    plugins: [
      imageminMozjpeg({
        quality: 85,
        progressive: true
      }),
      imageminPngquant({
        quality: [0.6, 0.8]
      }),
      imageminSvgo({
        plugins: [
          {
            name: 'removeViewBox',
            active: false
          }
        ]
      })
    ]
  });

  console.log('Images optimized successfully!');

  // Show size reduction
  files.forEach(file => {
    const originalPath = join(inputDir, basename(file.sourcePath));
    const originalSize = statSync(originalPath).size;
    const optimizedSize = statSync(file.destinationPath).size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(`${basename(file.sourcePath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
  });

  // Copy optimized images back to original location
  console.log('\nReplacing original images with optimized versions...');
  files.forEach(file => {
    const originalPath = join(inputDir, basename(file.sourcePath));
    copyFileSync(file.destinationPath, originalPath);
  });

  // Clean up optimized directory
  rmSync(outputDir, { recursive: true, force: true });
  console.log('Done! Original images have been replaced with optimized versions.');
}

optimizeImages().catch(console.error);