import { FastifyRequest, FastifyReply } from 'fastify';
import { CreateProjectUseCase } from '../../use-cases/project/create-project.use-case';
import { GetProjectsUseCase } from '../../use-cases/project/get-projects.use-case';
import { GeminiService } from '../../infrastructure/ai/gemini.service';
import { CreateTaskUseCase } from '../../use-cases/create-task.use-case';

export class ProjectController {
  constructor(
    private createProjectUseCase: CreateProjectUseCase,
    private getProjectsUseCase: GetProjectsUseCase,
    private createTaskUseCase: CreateTaskUseCase,
    private geminiService: GeminiService
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as any;
    const project = await this.createProjectUseCase.execute(data);
    return reply.send(project);
  }

  async list(request: FastifyRequest, reply: FastifyReply) {
    const { userId } = request.query as { userId: string };
    const projects = await this.getProjectsUseCase.execute(userId);
    return reply.send(projects);
  }

  async plan(request: FastifyRequest, reply: FastifyReply) {
    const { goal, userId } = request.body as { goal: string; userId: string };
    
    // 1. Ask Gemini to plan the project
    const plan = await this.geminiService.planProject(goal);
    
    // 2. Create the Project container
    const project = await this.createProjectUseCase.execute({
      name: plan.name,
      description: plan.description,
      status: 'active',
      userId: userId
    });
    
    // 3. Create all Tasks and handle basic title-based dependency linking
    const createdTasks = [];
    const taskMap = new Map();
    
    for (const taskData of plan.tasks) {
      const task = await this.createTaskUseCase.execute({
        title: taskData.title,
        category: taskData.category,
        status: 'todo',
        userId: userId,
        projectId: project.id,
      });
      createdTasks.push(task);
      taskMap.set(taskData.title, task.id);
    }
    
    // 4. Update tasks with dependencies (title -> id mapping)
    // In a more robust system, we'd do this in one go or batch updates
    // For now, we'll return the tasks and let the frontend handle the mapping if needed,
    // OR we can do a quick update pass here.
    
    return reply.send({ project, tasks: createdTasks });
  }
}
