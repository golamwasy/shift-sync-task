import { Task } from '../entities';

export interface ITaskRepository {
  create(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  findById(id: string): Promise<Task | null>;
  findAll(userId?: string): Promise<Task[]>;
  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>, userId?: string): Promise<Task | null>;
  delete(id: string, userId?: string): Promise<boolean>;
}
