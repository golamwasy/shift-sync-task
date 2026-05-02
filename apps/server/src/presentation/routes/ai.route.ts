import { FastifyInstance } from 'fastify';
import { AIController } from '../controllers/ai.controller';
import { container } from '../../infrastructure/di/container';
import { checkAIUsage } from '../../infrastructure/ai/usage.middleware';

export default async function aiRoutes(fastify: FastifyInstance) {
  // Resolve from container
  const aiController = container.resolve('aiController') as AIController;

  fastify.post('/parse', { preHandler: checkAIUsage }, aiController.parse.bind(aiController) as any);
  fastify.post('/decompose', { preHandler: checkAIUsage }, aiController.decompose.bind(aiController) as any);
}
