import { FastifyInstance } from 'fastify';
import { container } from '../../infrastructure/di/container';
import { ProjectController } from '../controllers/project.controller';
import { checkAIUsage } from '../../infrastructure/ai/usage.middleware';

export default async function projectRoutes(fastify: FastifyInstance) {
  const controller = container.resolve<ProjectController>('projectController');

  fastify.post('/', controller.create.bind(controller));
  fastify.get('/', controller.list.bind(controller));
  fastify.post('/plan', { preHandler: checkAIUsage }, controller.plan.bind(controller) as any);
  fastify.get('/:projectId/risk', { preHandler: checkAIUsage }, controller.assessRisk.bind(controller) as any);
}
