const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM members ORDER BY name');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, avatar_color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const { rows } = await pool.query(
      'INSERT INTO members (name, avatar_color) VALUES ($1, $2) RETURNING *',
      [name.trim(), avatar_color || '#6366f1']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Member already exists' });
    next(err);
  }
});

module.exports = router;
