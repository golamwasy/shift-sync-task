import { FastifyInstance } from 'fastify';
import { container } from '../../infrastructure/di/container';
import { ProjectController } from '../controllers/project.controller';

export default async function projectRoutes(fastify: FastifyInstance) {
  const controller = container.resolve<ProjectController>('projectController');

  fastify.post('/', controller.create.bind(controller));
  fastify.get('/', controller.list.bind(controller));
  fastify.post('/plan', controller.plan.bind(controller));
  fastify.get('/:projectId/risk', controller.assessRisk.bind(controller));
}
