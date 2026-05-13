const { Router } = require('express');
const pool = require('../db/pool');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { sprint_id, status, assignee_id } = req.query;
    let query = `
      SELECT t.*, m.name as assignee_name, m.avatar_color
      FROM tasks t
      LEFT JOIN members m ON t.assignee_id = m.id
      WHERE 1=1
    `;
    const params = [];

    if (sprint_id) {
      params.push(sprint_id);
      query += ` AND t.sprint_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    if (assignee_id) {
      params.push(assignee_id);
      query += ` AND t.assignee_id = $${params.length}`;
    }

    query += ' ORDER BY t.position ASC, t.created_at ASC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, status, priority, story_points, sprint_id, assignee_id } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const posResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM tasks WHERE sprint_id = $1 AND status = $2',
      [sprint_id || null, status || 'todo']
    );

    const { rows } = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, story_points, sprint_id, assignee_id, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description || null, status || 'todo', priority || 'medium', story_points || null, sprint_id || null, assignee_id || null, posResult.rows[0].next_pos]
    );

    const { rows: full } = await pool.query(
      `SELECT t.*, m.name as assignee_name, m.avatar_color
       FROM tasks t LEFT JOIN members m ON t.assignee_id = m.id
       WHERE t.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(full[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { title, description, status, priority, story_points, sprint_id, assignee_id } = req.body;
    const fields = [];
    const params = [];
    let idx = 1;

    if (title !== undefined) { fields.push(`title = $${idx++}`); params.push(title); }
    if (description !== undefined) { fields.push(`description = $${idx++}`); params.push(description); }
    if (status !== undefined) { fields.push(`status = $${idx++}`); params.push(status); }
    if (priority !== undefined) { fields.push(`priority = $${idx++}`); params.push(priority); }
    if (story_points !== undefined) { fields.push(`story_points = $${idx++}`); params.push(story_points); }
    if (sprint_id !== undefined) { fields.push(`sprint_id = $${idx++}`); params.push(sprint_id); }
    if (assignee_id !== undefined) { fields.push(`assignee_id = $${idx++}`); params.push(assignee_id); }

    if (!fields.length) return res.status(400).json({ error: 'No fields to update' });

    fields.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (!rows.length) return res.status(404).json({ error: 'Task not found' });

    const { rows: full } = await pool.query(
      `SELECT t.*, m.name as assignee_name, m.avatar_color
       FROM tasks t LEFT JOIN members m ON t.assignee_id = m.id
       WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(full[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/move', async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { status, position } = req.body;
    if (status === undefined || position === undefined) {
      return res.status(400).json({ error: 'status and position are required' });
    }

    await client.query('BEGIN');

    const { rows: [task] } = await client.query('SELECT * FROM tasks WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!task) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status === status) {
      await client.query(
        `UPDATE tasks SET position = position + (CASE WHEN position >= $1 THEN 1 ELSE 0 END) - (CASE WHEN position > $2 THEN 0 ELSE 0 END)
         WHERE sprint_id = $3 AND status = $4 AND id != $5 AND position >= LEAST($1, $2) AND position <= GREATEST($1, $2)`,
        [position, task.position, task.sprint_id, status, task.id]
      );
      if (position < task.position) {
        await client.query(
          'UPDATE tasks SET position = position + 1 WHERE sprint_id = $1 AND status = $2 AND position >= $3 AND id != $4',
          [task.sprint_id, status, position, task.id]
        );
      } else {
        await client.query(
          'UPDATE tasks SET position = position - 1 WHERE sprint_id = $1 AND status = $2 AND position <= $3 AND position > $4 AND id != $5',
          [task.sprint_id, status, position, task.position, task.id]
        );
      }
    } else {
      await client.query(
        'UPDATE tasks SET position = position - 1 WHERE sprint_id = $1 AND status = $2 AND position > $3',
        [task.sprint_id, task.status, task.position]
      );
      await client.query(
        'UPDATE tasks SET position = position + 1 WHERE sprint_id = $1 AND status = $2 AND position >= $3',
        [task.sprint_id, status, position]
      );
    }

    const { rows } = await client.query(
      'UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, position, req.params.id]
    );

    await client.query('COMMIT');

    const { rows: full } = await pool.query(
      `SELECT t.*, m.name as assignee_name, m.avatar_color
       FROM tasks t LEFT JOIN members m ON t.assignee_id = m.id
       WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(full[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Task not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
