const imagemin = require('imagemin');
const path = require('path');
const fs = require('fs');

async function loadPlugins() {
  const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
  const imageminPngquant = (await import('imagemin-pngquant')).default;
  const imageminSvgo = (await import('imagemin-svgo')).default;

  return { imageminMozjpeg, imageminPngquant, imageminSvgo };
}

async function optimizeImages() {
  const inputDir = 'public/cards';
  const outputDir = 'public/cards/optimized';

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Optimizing images...');

  const { imageminMozjpeg, imageminPngquant, imageminSvgo } = await loadPlugins();

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
    const originalPath = path.join(inputDir, path.basename(file.sourcePath));
    const originalSize = fs.statSync(originalPath).size;
    const optimizedSize = fs.statSync(file.destinationPath).size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(`${path.basename(file.sourcePath)}: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);
  });

  // Copy optimized images back to original location
  console.log('\nReplacing original images with optimized versions...');
  files.forEach(file => {
    const originalPath = path.join(inputDir, path.basename(file.sourcePath));
    fs.copyFileSync(file.destinationPath, originalPath);
  });

  // Clean up optimized directory
  fs.rmSync(outputDir, { recursive: true, force: true });
  console.log('Done! Original images have been replaced with optimized versions.');
}

optimizeImages().catch(console.error);