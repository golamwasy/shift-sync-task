import { FastifyInstance } from 'fastify';
import { AIController } from '../controllers/ai.controller';
import { container } from '../../infrastructure/di/container';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Resolve from container
  const aiController = container.resolve('aiController') as AIController;

  fastify.post('/parse', aiController.parse.bind(aiController));
  fastify.post('/decompose', aiController.decompose.bind(aiController));
}
