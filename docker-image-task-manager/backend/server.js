import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tasksdb'
});

const upload = multer({ storage: multer.memoryStorage() });

app.post('/tasks', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageBuffer = null;

    if (req.file) {
      imageBuffer = await sharp(req.file.buffer)
        .resize({ width: 800 })
        .jpeg({ quality: 70 })
        .toBuffer();
    }

    const result = await pool.query(
      'INSERT INTO tasks (title, description, image_data) VALUES ($1, $2, $3) RETURNING *',
      [title, description, imageBuffer]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT id, title, description, created_at FROM tasks');
  res.json(result.rows);
});

app.get('/images/:id', async (req, res) => {
  const result = await pool.query('SELECT image_data FROM tasks WHERE id=$1', [req.params.id]);
  if (result.rows.length === 0 || !result.rows[0].image_data) {
    return res.status(404).send('Image not found');
  }
  res.set('Content-Type', 'image/jpeg');
  res.send(result.rows[0].image_data);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));