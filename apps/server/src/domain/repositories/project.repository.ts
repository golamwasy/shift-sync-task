import { Project } from '../entities';

export interface IProjectRepository {
  create(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findAll(userId: string): Promise<Project[]>;
  update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>, userId: string): Promise<Project | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
