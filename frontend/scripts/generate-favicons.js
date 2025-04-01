import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { size: 16, name: 'favicon-16x16.png' },
  { size: 32, name: 'favicon-32x32.png' },
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'android-chrome-192x192.png' },
  { size: 512, name: 'android-chrome-512x512.png' }
];

const inputFile = path.join(__dirname, '../public/new-favicon.jpeg');
const outputDir = path.join(__dirname, '../public');

async function generateFavicons() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate each size
    for (const { size, name } of sizes) {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(outputDir, name));
      console.log(`Generated ${name}`);
    }

    // Generate ICO file (16x16, 32x32)
    const icoSizes = [16, 32];
    const icoBuffers = await Promise.all(
      icoSizes.map(size =>
        sharp(inputFile)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .toBuffer()
      )
    );

    // Combine into ICO file
    // Note: This is a simplified version. For a proper ICO file, you'd need a more complex library
    fs.writeFileSync(path.join(outputDir, 'favicon.ico'), Buffer.concat(icoBuffers));
    console.log('Generated favicon.ico');

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons(); 