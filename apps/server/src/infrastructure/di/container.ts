import { createContainer, asClass, asValue } from 'awilix';
import { CreateTaskUseCase } from '../../use-cases/create-task.use-case';
import { GeminiService } from '../ai/gemini.service';
import { AIController } from '../../presentation/controllers/ai.controller';
import { db } from '../db/db';

export const container = createContainer({
  injectionMode: 'CLASSIC'
});

// For now, we register a mock repository until we implement DrizzleTaskRepository
class MockTaskRepository {
  async create(data: any) {
    return { id: 'mock-id', ...data, createdAt: new Date(), updatedAt: new Date() };
  }
  async findById() { return null; }
  async findAll() { return []; }
}

container.register({
  db: asValue(db),
  taskRepository: asClass(MockTaskRepository).singleton(),
  createTaskUseCase: asClass(CreateTaskUseCase).singleton(),
  geminiService: asClass(GeminiService).singleton(),
  aiController: asClass(AIController).singleton()
});
