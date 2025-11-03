
import express from 'express';
import pkg from 'pg';
import cors from 'cors';

const { Pool } = pkg;
const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL + "?sslmode=require",
  ssl: {
    rejectUnauthorized: false
  }
});

// POST route to store score
app.post('/score', async (req, res) => {
  const { id, time, moves, institution, ts } = req.body;
  if (!id || !time || !institution) {
    return res.status(400).send({ success: false, message: "Missing data fields" });
  }
  try {
    const query = `
      INSERT INTO scores (id, time, moves, institution, ts) 
      VALUES ($1, $2, $3, $4, $5)
    `;
    await pool.query(query, [id, time, moves, institution, ts]);
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: "DB Error" });
  }
});

// GET route to fetch scores
app.get('/scores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM scores ORDER BY time ASC LIMIT 9
    `);
    res.send(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({ success: false, message: "DB Error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
