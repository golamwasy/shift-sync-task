import { createContainer, asClass, asValue } from 'awilix';
import { CreateTaskUseCase } from '../../use-cases/create-task.use-case';
import { GeminiService } from '../ai/gemini.service';
import { AIController } from '../../presentation/controllers/ai.controller';
import { TaskController } from '../../presentation/controllers/task.controller';
import { DrizzleTaskRepository } from '../db/drizzle-task.repository';
import { DrizzleProjectRepository } from '../db/drizzle-project.repository';
import { CreateProjectUseCase } from '../../use-cases/project/create-project.use-case';
import { GetProjectsUseCase } from '../../use-cases/project/get-projects.use-case';
import { ProjectController } from '../../presentation/controllers/project.controller';
import { db } from '../db/db';

export const container = createContainer({
  injectionMode: 'CLASSIC'
});

container.register({
  db: asValue(db),
  taskRepository: asClass(DrizzleTaskRepository).singleton(),
  projectRepository: asClass(DrizzleProjectRepository).singleton(),
  createTaskUseCase: asClass(CreateTaskUseCase).singleton(),
  createProjectUseCase: asClass(CreateProjectUseCase).singleton(),
  getProjectsUseCase: asClass(GetProjectsUseCase).singleton(),
  geminiService: asClass(GeminiService).singleton(),
  aiController: asClass(AIController).singleton(),
  taskController: asClass(TaskController).singleton(),
  projectController: asClass(ProjectController).singleton(),
});
