import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/health.controller';

export default async function healthRoutes(fastify: FastifyInstance) {
  const healthController = new HealthController();

  fastify.get('/health', healthController.getHealth.bind(healthController));
  fastify.get('/metrics', healthController.getMetrics.bind(healthController));
}
