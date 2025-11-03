const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// PostgreSQL connection for Render
// The 'rejectUnauthorized: false' property fixes the 'self-signed certificate' error.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } 
});

// Create scores table if it doesn’t exist
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

// 🗑️ DELETE route to clear all scores (Admin Only)
// Access this via a DELETE request to: [Your Render URL]/scores?pass=ShellReset2025
app.delete('/scores', async (req, res) => {
  const adminPassword = 'ShellReset2025'; // Password for the event duration
  const pass = req.query.pass; // Get password from query parameter: ?pass=...

  if (pass !== adminPassword) {
    return res.status(403).send({ success: false, message: 'Unauthorized' });
  }

  try {
    // TRUNCATE is slightly faster and resets auto-increment counters, but DELETE works fine too.
    await pool.query('TRUNCATE TABLE scores RESTART IDENTITY'); 
    res.send({ success: true, message: 'All scores cleared successfully' });
  } catch (err) {
    console.error('❌ Delete failed:', err);
    res.status(500).send({ success: false, message: 'DB Error while clearing scores' });
  }
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  await initDB();
});
