import { z } from 'zod';

// --- User Schema ---
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'member']),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type User = z.infer<typeof UserSchema>;

// --- Task Schema ---
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  category: z.string(),
  scheduledAt: z.date().optional(),
  meetingLink: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']),
  userId: z.string().uuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// --- Resource Schema ---
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: z.enum(['document', 'link', 'file']),
  url: z.string().url().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type Resource = z.infer<typeof ResourceSchema>;

// --- Hooks ---
export { useSmartInput } from './hooks/useSmartInput';
