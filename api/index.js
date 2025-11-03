const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ✅ PostgreSQL connection for Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false }
});

// ✅ Create scores table if it doesn’t exist
async function initDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT NOT NULL,
      time FLOAT NOT NULL,
      moves INT,
      institution TEXT,
      ts BIGINT,
      PRIMARY KEY (id, ts)
    );
  `;
  try {
    await pool.query(query);
    console.log('✅ Database ready');
  } catch (err) {
    console.error('❌ Database init failed:', err);
  }
}

// POST /score — save score
app.post('/score', async (req, res) => {
  const { id, time, moves, institution, ts } = req.body;
  if (!id || !time || !institution)
    return res.status(400).send({ success: false, message: 'Missing data fields' });

  try {
    await pool.query(
      'INSERT INTO scores (id, time, moves, institution, ts) VALUES ($1,$2,$3,$4,$5)',
      [id, time, moves, institution, ts]
    );
    res.send({ success: true });
  } catch (err) {
    console.error('❌ Insert failed:', err);
    res.status(500).send({ success: false, message: 'DB Error' });
  }
});

// GET /scores — fetch scores
app.get('/scores', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM scores ORDER BY time ASC LIMIT 9');
    res.send(result.rows);
  } catch (err) {
    console.error('❌ Fetch failed:', err);
    res.status(500).send({ success: false, message: 'DB Error' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initDB();
});
