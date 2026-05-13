const pool = require('./pool');

const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#14b8a6'];

const members = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Eve',
  'Frank', 'Grace', 'Henry', 'Ivy', 'Jack'
];

async function seed() {
  try {
    for (let i = 0; i < members.length; i++) {
      await pool.query(
        'INSERT INTO members (name, avatar_color) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [members[i], colors[i]]
      );
    }

    const sprintResult = await pool.query(
      `INSERT INTO sprints (name, goal, start_date, end_date, is_active)
       VALUES ('Sprint 1', 'Set up project foundation', CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', true)
       RETURNING id`
    );

    const sprintId = sprintResult.rows[0].id;

    const tasks = [
      { title: 'Set up CI/CD pipeline', status: 'todo', priority: 'high', points: 5, assignee: 1 },
      { title: 'Design database schema', status: 'done', priority: 'high', points: 3, assignee: 2 },
      { title: 'Create API endpoints', status: 'in_progress', priority: 'medium', points: 8, assignee: 3 },
      { title: 'Build Kanban board UI', status: 'in_progress', priority: 'high', points: 8, assignee: 4 },
      { title: 'Write unit tests', status: 'todo', priority: 'medium', points: 5, assignee: 5 },
      { title: 'Set up monitoring', status: 'todo', priority: 'low', points: 3, assignee: 6 },
    ];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      await pool.query(
        `INSERT INTO tasks (title, status, priority, story_points, sprint_id, assignee_id, position)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [t.title, t.status, t.priority, t.points, sprintId, t.assignee, i]
      );
    }

    console.log('Seed data inserted successfully');
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
