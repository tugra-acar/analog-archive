import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT, 'public/images/uploads');
const THUMBS_DIR = path.join(ROOT, 'public/images/thumbs');
const PHOTOS_JSON = path.join(ROOT, 'src/data/photos.json');

const THUMB_WIDTH = 600;
const THUMB_QUALITY = 75;

async function main() {
  // Dynamically import sharp
  const sharp = (await import('sharp')).default;

  // Create thumbs directory
  if (!fs.existsSync(THUMBS_DIR)) {
    fs.mkdirSync(THUMBS_DIR, { recursive: true });
  }

  // Get all image files
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });

  console.log(`Found ${files.length} images to process.\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const srcPath = path.join(UPLOADS_DIR, file);
    const destPath = path.join(THUMBS_DIR, file);

    // Skip if thumbnail already exists and is newer than source
    if (fs.existsSync(destPath)) {
      const srcStat = fs.statSync(srcPath);
      const destStat = fs.statSync(destPath);
      if (destStat.mtimeMs >= srcStat.mtimeMs) {
        skipped++;
        continue;
      }
    }

    try {
      await sharp(srcPath)
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY, progressive: true })
        .toFile(destPath);
      processed++;
      if (processed % 50 === 0) {
        console.log(`  ...processed ${processed}/${files.length - skipped}`);
      }
    } catch (err) {
      console.error(`  ERROR: ${file} — ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}, Errors: ${errors}`);

  // Now update photos.json — add thumbnailUrl fields
  const data = JSON.parse(fs.readFileSync(PHOTOS_JSON, 'utf8'));

  // Add thumbnailUrl to films (cover photos)
  for (const film of data.films) {
    if (film.coverPhotoUrl) {
      const filename = path.basename(film.coverPhotoUrl);
      const thumbPath = path.join(THUMBS_DIR, filename);
      if (fs.existsSync(thumbPath)) {
        film.coverThumbUrl = `images/thumbs/${filename}`;
      }
    }
  }

  // Add thumbnailUrl to photos
  for (const photo of data.photos) {
    if (photo.imageUrl) {
      const filename = path.basename(photo.imageUrl);
      const thumbPath = path.join(THUMBS_DIR, filename);
      if (fs.existsSync(thumbPath)) {
        photo.thumbUrl = `images/thumbs/${filename}`;
      }
    }
  }

  fs.writeFileSync(PHOTOS_JSON, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log('Updated photos.json with thumbnail URLs.');

  // Report size savings
  const origSize = files.reduce((sum, f) => {
    try { return sum + fs.statSync(path.join(UPLOADS_DIR, f)).size; } catch { return sum; }
  }, 0);
  const thumbFiles = fs.readdirSync(THUMBS_DIR).filter(f => !f.startsWith('.'));
  const thumbSize = thumbFiles.reduce((sum, f) => {
    try { return sum + fs.statSync(path.join(THUMBS_DIR, f)).size; } catch { return sum; }
  }, 0);

  console.log(`\nOriginals: ${(origSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Thumbnails: ${(thumbSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Savings: ${((1 - thumbSize / origSize) * 100).toFixed(1)}%`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
