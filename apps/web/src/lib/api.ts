import type { Task } from '@shift-sync/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = {
  async fetchTasks(): Promise<Task[]> {
    try {
      const res = await fetch(`${API_URL}/tasks`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch tasks');
      }
      const json = await res.json();
      return (json.data as any[]).map(t => ({
        ...t,
        scheduledAt: t.scheduledAt ? new Date(t.scheduledAt) : undefined,
        createdAt: t.createdAt ? new Date(t.createdAt) : undefined,
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      }));
    } catch (e: any) {
      throw new Error(e.message || 'Network error: Check if the server is running on port 3000');
    }
  },

  async createTask(task: any): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to create task in database');
    }
    const json = await res.json();
    return json.data;
  },

  async updateTask(id: string, data: Partial<{ title: string; category: string; status: string; scheduledAt: string | null }>): Promise<Task> {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const json = await res.json();
    return json.data;
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async parseAI(text: string): Promise<{ title: string; category: string; scheduledAt?: string }[]> {
    const res = await fetch(`${API_URL}/ai/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'AI service unavailable. Check GEMINI_API_KEY.');
    }
    const json = await res.json();
    return json.data;
  },
};
