import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './presentation/routes/health.route';
import aiRoutes from './presentation/routes/ai.route';
import taskRoutes from './presentation/routes/task.route';

const server = Fastify({
  logger: true
});

// Register CORS
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
server.register(cors, { 
  origin: allowedOrigins
});

// Register routes
server.register(healthRoutes);
server.register(aiRoutes, { prefix: '/ai' });
server.register(taskRoutes, { prefix: '/tasks' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
