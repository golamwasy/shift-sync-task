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
    try {
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
      
      // 3. Create all Tasks
      const createdTasks = [];
      for (const taskData of plan.tasks) {
        const task = await this.createTaskUseCase.execute({
          title: taskData.title,
          category: taskData.category,
          status: 'todo',
          userId: userId,
          projectId: project.id,
        });
        createdTasks.push(task);
      }
      
      return reply.send({ project, tasks: createdTasks });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({ 
        status: 'error', 
        message: error.message || 'AI Project planning failed' 
      });
    }
  }
}
