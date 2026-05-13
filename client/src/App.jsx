import { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Column from './components/Column';
import TaskCard from './components/TaskCard';
import TaskModal from './components/TaskModal';
import SprintModal from './components/SprintModal';
import { useBoard } from './hooks/useBoard';
import { api } from './utils/api';

const STATUSES = ['todo', 'in_progress', 'review', 'done'];

export default function App() {
  const { tasks, members, sprint, loading, addTask, updateTask, moveTask, deleteTask, reload } = useBoard();
  const [currentUser, setCurrentUser] = useState('');
  const [taskModal, setTaskModal] = useState(null);
  const [sprintModal, setSprintModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns = useMemo(() => {
    const cols = {};
    STATUSES.forEach((s) => {
      cols[s] = tasks.filter((t) => t.status === s).sort((a, b) => a.position - b.position);
    });
    return cols;
  }, [tasks]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const points = tasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const donePoints = tasks.filter((t) => t.status === 'done').reduce((sum, t) => sum + (t.story_points || 0), 0);
    return { total, done, points, donePoints };
  }, [tasks]);

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let targetStatus;
    let targetPosition;

    if (STATUSES.includes(overId)) {
      targetStatus = overId;
      targetPosition = columns[overId].length;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      const colTasks = columns[targetStatus];
      const overIndex = colTasks.findIndex((t) => t.id === overId);
      targetPosition = overIndex >= 0 ? overIndex : colTasks.length;
    }

    if (activeTask.status === targetStatus) {
      const colTasks = columns[targetStatus];
      const oldIndex = colTasks.findIndex((t) => t.id === activeId);
      if (oldIndex === targetPosition) return;
    }

    moveTask(activeId, targetStatus, targetPosition);
  };

  const handleAddTask = (status) => {
    setTaskModal({ mode: 'create', status });
  };

  const handleTaskClick = (task) => {
    setTaskModal({ mode: 'edit', task });
  };

  const handleTaskSave = async (data) => {
    if (taskModal.mode === 'create') {
      await addTask({ ...data, status: taskModal.status });
    } else {
      await updateTask(taskModal.task.id, data);
    }
    setTaskModal(null);
  };

  const handleTaskDelete = async (id) => {
    await deleteTask(id);
    setTaskModal(null);
  };

  const handleCreateSprint = async (data) => {
    const newSprint = await api.sprints.create(data);
    await api.sprints.activate(newSprint.id);
    setSprintModal(false);
    reload();
  };

  if (loading) {
    return (
      <div className="app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading board...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Sprint Board</h1>
        <div className="header-actions">
          <select
            className="user-select"
            value={currentUser}
            onChange={(e) => setCurrentUser(e.target.value)}
          >
            <option value="">Select yourself</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={() => setSprintModal(true)}>
            New Sprint
          </button>
        </div>
      </header>

      {sprint && (
        <div className="sprint-info">
          <span className="sprint-name">{sprint.name}</span>
          <span className="sprint-dates">
            {new Date(sprint.start_date).toLocaleDateString()} — {new Date(sprint.end_date).toLocaleDateString()}
          </span>
          {sprint.goal && <span style={{ color: 'var(--text-secondary)' }}>Goal: {sprint.goal}</span>}
          <div className="sprint-stats">
            <div className="stat">Tasks: <span className="stat-value">{stats.done}/{stats.total}</span></div>
            <div className="stat">Points: <span className="stat-value">{stats.donePoints}/{stats.points}</span></div>
          </div>
        </div>
      )}

      {!sprint && (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No active sprint. Create one to get started.</p>
          <button className="btn btn-primary" onClick={() => setSprintModal(true)}>Create Sprint</button>
        </div>
      )}

      {sprint && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board">
            {STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                tasks={columns[status]}
                onAddTask={handleAddTask}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>
        </DndContext>
      )}

      {taskModal && (
        <TaskModal
          task={taskModal.task}
          members={members}
          initialStatus={taskModal.status}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onClose={() => setTaskModal(null)}
        />
      )}

      {sprintModal && (
        <SprintModal
          onSave={handleCreateSprint}
          onClose={() => setSprintModal(false)}
        />
      )}
    </div>
  );
}
