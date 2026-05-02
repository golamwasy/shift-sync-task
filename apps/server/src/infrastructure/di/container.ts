import { createContainer, asClass, asValue } from 'awilix';
import { CreateTaskUseCase } from '../../use-cases/create-task.use-case';
import { GeminiService } from '../ai/gemini.service';
import { AIController } from '../../presentation/controllers/ai.controller';
import { TaskController } from '../../presentation/controllers/task.controller';
import { DrizzleTaskRepository } from '../db/drizzle-task.repository';
import { db } from '../db/db';

export const container = createContainer({
  injectionMode: 'CLASSIC'
});

container.register({
  db: asValue(db),
  taskRepository: asClass(DrizzleTaskRepository).singleton(),
  createTaskUseCase: asClass(CreateTaskUseCase).singleton(),
  geminiService: asClass(GeminiService).singleton(),
  aiController: asClass(AIController).singleton(),
  taskController: asClass(TaskController).singleton(),
});
