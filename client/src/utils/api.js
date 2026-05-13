const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error);
  }
  return res.json();
}

export const api = {
  members: {
    list: () => request('/members'),
    create: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  },
  sprints: {
    list: () => request('/sprints'),
    active: () => request('/sprints/active'),
    create: (data) => request('/sprints', { method: 'POST', body: JSON.stringify(data) }),
    activate: (id) => request(`/sprints/${id}/activate`, { method: 'PATCH' }),
  },
  tasks: {
    list: (params = {}) => {
      const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null)).toString();
      return request(`/tasks${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    move: (id, data) => request(`/tasks/${id}/move`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  },
};
