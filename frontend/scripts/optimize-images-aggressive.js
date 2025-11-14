/**
 * Aggressive Image Optimization Script
 *
 * Compresses images to <100KB for production deployment
 * Uses sharp library for high-quality compression
 *
 * Usage: node scripts/optimize-images-aggressive.js
 */

import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, '../public/cards/optimized');
const OUTPUT_DIR = path.join(__dirname, '../public/cards/production');

// Target max size: 95KB (leaving buffer for <100KB requirement)
const TARGET_SIZE_KB = 95;
const TARGET_SIZE_BYTES = TARGET_SIZE_KB * 1024;

async function optimizeImage(inputPath, outputPath, filename) {
  try {
    const stats = await fs.stat(inputPath);
    const originalSizeKB = Math.round(stats.size / 1024);

    console.log(`\n📸 Processing: ${filename} (${originalSizeKB}KB)`);

    // Start with quality 85 and reduce if needed
    let quality = 85;
    let compressed = null;
    let finalSize = 0;

    while (quality >= 50) {
      compressed = await sharp(inputPath)
        .jpeg({
          quality,
          progressive: true,
          mozjpeg: true, // Use mozjpeg for better compression
          chromaSubsampling: '4:2:0',
        })
        .toBuffer();

      finalSize = compressed.length;
      const finalSizeKB = Math.round(finalSize / 1024);

      if (finalSize <= TARGET_SIZE_BYTES) {
        console.log(`   ✅ Success at quality ${quality}: ${finalSizeKB}KB (${originalSizeKB - finalSizeKB}KB saved)`);
        await fs.writeFile(outputPath, compressed);
        return {
          filename,
          originalSize: originalSizeKB,
          finalSize: finalSizeKB,
          quality,
          saved: originalSizeKB - finalSizeKB,
        };
      }

      quality -= 5; // Reduce quality and try again
    }

    // If we couldn't get under target, use quality 50
    console.log(`   ⚠️  Using quality 50: ${Math.round(finalSize / 1024)}KB (couldn't reach <${TARGET_SIZE_KB}KB)`);
    await fs.writeFile(outputPath, compressed);

    return {
      filename,
      originalSize: originalSizeKB,
      finalSize: Math.round(finalSize / 1024),
      quality: 50,
      saved: originalSizeKB - Math.round(finalSize / 1024),
    };
  } catch (error) {
    console.error(`   ❌ Error processing ${filename}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🎨 Aggressive Image Optimization for Production\n');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Target: <${TARGET_SIZE_KB}KB per image\n`);

  // Create output directory
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error('❌ Failed to create output directory:', error.message);
      process.exit(1);
    }
  }

  // Get all JPG files from optimized directory
  const files = await fs.readdir(SOURCE_DIR);
  const jpgFiles = files.filter(f => f.endsWith('.jpg'));

  if (jpgFiles.length === 0) {
    console.log('⚠️  No JPG files found in optimized directory');
    process.exit(0);
  }

  console.log(`Found ${jpgFiles.length} images to optimize\n`);
  console.log('='.repeat(60));

  const results = [];

  for (const filename of jpgFiles) {
    const inputPath = path.join(SOURCE_DIR, filename);
    const outputPath = path.join(OUTPUT_DIR, filename);

    const result = await optimizeImage(inputPath, outputPath, filename);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Optimization Summary:\n');

  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalFinal = results.reduce((sum, r) => sum + r.finalSize, 0);
  const totalSaved = totalOriginal - totalFinal;
  const percentSaved = Math.round((totalSaved / totalOriginal) * 100);

  results.forEach(r => {
    const status = r.finalSize < TARGET_SIZE_KB ? '✅' : '⚠️';
    console.log(`${status} ${r.filename.padEnd(25)} ${r.originalSize}KB → ${r.finalSize}KB (quality ${r.quality})`);
  });

  console.log(`\n📦 Total: ${totalOriginal}KB → ${totalFinal}KB (${totalSaved}KB saved, ${percentSaved}%)`);
  console.log(`\n✨ Production images saved to: ${OUTPUT_DIR}`);
  console.log('\n💡 Next step: Update Card.tsx to use /cards/production/ instead of /cards/optimized/');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
