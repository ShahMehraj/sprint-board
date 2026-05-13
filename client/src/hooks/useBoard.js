import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useBoard() {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [membersData, sprintData] = await Promise.all([
        api.members.list(),
        api.sprints.active(),
      ]);
      setMembers(membersData);
      setSprint(sprintData);

      if (sprintData) {
        const tasksData = await api.tasks.list({ sprint_id: sprintData.id });
        setTasks(tasksData);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addTask = async (data) => {
    const task = await api.tasks.create({ ...data, sprint_id: sprint?.id });
    setTasks((prev) => [...prev, task]);
    return task;
  };

  const updateTask = async (id, data) => {
    const task = await api.tasks.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  };

  const moveTask = async (id, status, position) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status, position } : t)));
    try {
      await api.tasks.move(id, { status, position });
      const tasksData = await api.tasks.list({ sprint_id: sprint?.id });
      setTasks(tasksData);
    } catch (err) {
      console.error('Move failed:', err);
      load();
    }
  };

  const deleteTask = async (id) => {
    await api.tasks.delete(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, members, sprint, loading, addTask, updateTask, moveTask, deleteTask, reload: load };
}
