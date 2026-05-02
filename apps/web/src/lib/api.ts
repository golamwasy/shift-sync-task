import type { Task, Project } from '@shift-sync/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api'; // Use /api as the base for all requests

export const api = {
  async fetchTasks(userId?: string): Promise<Task[]> {
    try {
      const url = userId ? `${API_URL}/tasks?userId=${userId}` : `${API_URL}/tasks`;
      const res = await fetch(url);
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

  async updateTask(id: string, data: Partial<{ title: string; category: string; status: string; scheduledAt: string | null }>, userId?: string): Promise<Task> {
    const url = userId ? `${API_URL}/tasks/${id}?userId=${userId}` : `${API_URL}/tasks/${id}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    const json = await res.json();
    return json.data;
  },

  async deleteTask(id: string, userId?: string): Promise<void> {
    const url = userId ? `${API_URL}/tasks/${id}?userId=${userId}` : `${API_URL}/tasks/${id}`;
    const res = await fetch(url, { method: 'DELETE' });
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

  async decomposeTask(title: string): Promise<string[]> {
    const res = await fetch(`${API_URL}/ai/decompose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) throw new Error('Decomposition failed');
    const json = await res.json();
    return json.data;
  },

  async assessRisk(projectId: string, userId: string): Promise<string> {
    const res = await fetch(`${API_URL}/projects/${projectId}/risk?userId=${userId}`);
    if (!res.ok) throw new Error('Risk assessment failed');
    const json = await res.json();
    return json.risk;
  },

  async fetchProjects(userId: string): Promise<Project[]> {
    const res = await fetch(`${API_URL}/projects?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async planProject(goal: string, userId: string): Promise<{ project: Project, tasks: Task[] }> {
    const res = await fetch(`${API_URL}/projects/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, userId }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || 'AI Project planning failed');
    }
    return res.json();
  },
};
