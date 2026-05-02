import { Task } from '../domain/entities';
import { ITaskRepository } from '../domain/repositories/task.repository';

export interface CreateTaskDTO {
  title: string;
  category: string;
  scheduledAt?: Date;
  status: 'todo' | 'in-progress' | 'done';
  userId: string;
  projectId?: string;
  dependsOn?: string[];
}

export class CreateTaskUseCase {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(data: CreateTaskDTO): Promise<Task> {
    // Here we would typically add business logic/validation before saving.
    return this.taskRepository.create(data);
  }
}
