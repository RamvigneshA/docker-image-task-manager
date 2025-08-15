import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tasksdb'
});

const upload = multer({ storage: multer.memoryStorage() });

// POST /tasks → create task with optional image
app.post('/tasks', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageBuffer = null;
    let thumbBuffer = null;

    if (req.file) {
      // Full-size compressed image
      imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .jpeg({ quality: 70 })
        .toBuffer();

      // Thumbnail
      thumbBuffer = await sharp(req.file.buffer)
        .resize({ width: 200 })
        .jpeg({ quality: 50 })
        .toBuffer();
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, description, image_data, thumbnail_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, imageBuffer, thumbBuffer]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /tasks → list tasks (without images in JSON)
app.get('/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title, description, created_at FROM tasks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /tasks/:id/image → full-size image
app.get('/tasks/:id/image', async (req, res) => {
  try {
    const result = await pool.query('SELECT image_data FROM tasks WHERE id=$1', [req.params.id]);

    if (!result.rows.length || !result.rows[0].image_data) {
      return res.status(404).send('Image not found');
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(result.rows[0].image_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /tasks/:id/thumbnail → thumbnail
app.get('/tasks/:id/thumbnail', async (req, res) => {
  try {
    const result = await pool.query('SELECT thumbnail_data FROM tasks WHERE id=$1', [req.params.id]);

    if (!result.rows.length || !result.rows[0].thumbnail_data) {
      // fallback: use full image if thumbnail not available
      const full = await pool.query('SELECT image_data FROM tasks WHERE id=$1', [req.params.id]);
      if (!full.rows.length || !full.rows[0].image_data) return res.status(404).send('Image not found');
      res.set('Content-Type', 'image/jpeg');
      return res.send(full.rows[0].image_data);
    }

    res.set('Content-Type', 'image/jpeg');
    res.send(result.rows[0].thumbnail_data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));