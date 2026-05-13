const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sprints ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/active', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sprints WHERE is_active = true LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, goal, start_date, end_date } = req.body;
    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'Name, start_date, and end_date are required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO sprints (name, goal, start_date, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, goal || null, start_date, end_date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/activate', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE sprints SET is_active = false WHERE is_active = true');
    const { rows } = await client.query(
      'UPDATE sprints SET is_active = true WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    await client.query('COMMIT');
    if (!rows.length) return res.status(404).json({ error: 'Sprint not found' });
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM sprints WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Sprint not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
