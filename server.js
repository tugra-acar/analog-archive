import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Set up storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'public', 'images', 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const DATA_FILE = path.join(__dirname, 'src', 'data', 'photos.json');

app.post('/api/upload', upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'photos', maxCount: 100 }
]), (req, res) => {
  try {
    const { filmName, filmStock, filmType, filmSoul, filmDate, notes } = req.body;

    // Read current data
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    const newFilmId = `film-${Date.now()}`;

    // Process cover photo
    let coverPhotoUrl = '/assets/hero-bg.png';
    if (req.files && req.files['cover'] && req.files['cover'][0]) {
      coverPhotoUrl = `/images/uploads/${req.files['cover'][0].filename}`;
    }

    // Add new film
    data.films.unshift({
      id: newFilmId,
      name: filmName,
      filmStock: filmStock || '',
      type: filmType,
      soul: filmSoul,
      coverPhotoUrl: coverPhotoUrl,
      date: filmDate || new Date().toISOString().split('T')[0],
      isFavorite: false,
      notes: notes || '',
    });

    // Process grid photos
    if (req.files && req.files['photos']) {
      req.files['photos'].forEach((file, index) => {
        data.photos.push({
          id: `photo-${Date.now()}-${index}`,
          filmId: newFilmId,
          imageUrl: `/images/uploads/${file.filename}`,
        });
      });
    }

    // Save back to JSON file
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.status(200).json({ success: true, message: 'Upload successful' });
  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tag-location', (req, res) => {
  try {
    const { photoId, location } = req.body;
    const { name, lat, lng } = location;

    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // Check if location already exists
    let targetLoc = data.locations.find(l => l.name.toLowerCase() === name.toLowerCase());

    if (!targetLoc) {
      // Create new location
      // Infer region (rough logic)
      let region = 'world';
      const nameLower = name.toLowerCase();
      if (nameLower.includes('istanbul')) region = 'istanbul';
      else if (nameLower.includes('turkey') || nameLower.includes('türkiye') || lat > 35 && lat < 43 && lng > 25 && lng < 45) region = 'turkey';

      targetLoc = {
        id: `loc-${Date.now()}`,
        name: name,
        region: region,
        lat: lat,
        lng: lng
      };
      data.locations.push(targetLoc);
    }

    // Assign to photo
    const photoIndex = data.photos.findIndex(p => p.id === photoId);
    if (photoIndex !== -1) {
      data.photos[photoIndex].locationId = targetLoc.id;
    } else {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    // Save back to JSON file
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.status(200).json({ success: true, locationId: targetLoc.id });
  } catch (error) {
    console.error('Tag Location Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/film/:id', (req, res) => {
  try {
    const filmId = req.params.id;
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // Find the film
    const filmIndex = data.films.findIndex(f => f.id === filmId);
    if (filmIndex === -1) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }

    // Delete film thumbnail if it's an uploaded one
    const film = data.films[filmIndex];
    if (film.coverPhotoUrl.startsWith('/images/uploads/')) {
      const filePath = path.join(__dirname, 'public', film.coverPhotoUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Find and delete all associated photos
    const filmPhotos = data.photos.filter(p => p.filmId === filmId);
    filmPhotos.forEach(p => {
      if (p.imageUrl.startsWith('/images/uploads/')) {
        const filePath = path.join(__dirname, 'public', p.imageUrl);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });

    // Update data: remove film and its photos
    data.films = data.films.filter(f => f.id !== filmId);
    data.photos = data.photos.filter(p => p.filmId !== filmId);

    console.log(`Writing updated data to ${DATA_FILE} after deleting film ${filmId}`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Successfully wrote to data file');
    res.status(200).json({ success: true, message: 'Film and associated photos deleted' });
  } catch (error) {
    console.error('Delete Film Error FULL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/photo/:id', (req, res) => {
  try {
    const photoId = req.params.id;
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    const photoIndex = data.photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return res.status(404).json({ success: false, message: 'Photo not found' });
    }

    const photo = data.photos[photoIndex];
    if (photo.imageUrl.startsWith('/images/uploads/')) {
      const filePath = path.join(__dirname, 'public', photo.imageUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    data.photos = data.photos.filter(p => p.id !== photoId);

    console.log(`Writing updated data to ${DATA_FILE} after deleting photo ${photoId}`);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Successfully wrote to data file');
    res.status(200).json({ success: true, message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete Photo Error FULL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/film/:id', (req, res) => {
  try {
    const filmId = req.params.id;
    const { filmName, filmStock, notes } = req.body;
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    const filmIndex = data.films.findIndex(f => f.id === filmId);
    if (filmIndex === -1) {
      return res.status(404).json({ success: false, message: 'Film not found' });
    }

    if (filmName) data.films[filmIndex].name = filmName;
    if (filmStock !== undefined) data.films[filmIndex].filmStock = filmStock;
    if (notes !== undefined) data.films[filmIndex].notes = notes;

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.status(200).json({ success: true, message: 'Film updated' });
  } catch (error) {
    console.error('Update Film Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Local Backend running on http://localhost:${PORT}`);
});
