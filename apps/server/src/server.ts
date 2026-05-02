import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './presentation/routes/health.route';
import aiRoutes from './presentation/routes/ai.route';
import taskRoutes from './presentation/routes/task.route';
import projectRoutes from './presentation/routes/project.route';
import { seedUser, cleanupOldData } from './infrastructure/db/db';

export const server = Fastify({
  logger: true,
  trustProxy: true,
  ignoreTrailingSlash: true
});

// Register CORS
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
server.register(cors, { 
  origin: allowedOrigins
});

// Register routes with /api prefix
server.register(async (api) => {
  await seedUser(); // Ensure default user exists
  await cleanupOldData(); // Run cleanup on start
  
  // Schedule cleanup every 24 hours
  setInterval(() => {
    cleanupOldData().catch(err => console.error('Scheduled cleanup failed:', err));
  }, 24 * 60 * 60 * 1000);

  api.register(healthRoutes);
  api.register(aiRoutes, { prefix: '/ai' });
  api.register(taskRoutes, { prefix: '/tasks' });
  api.register(projectRoutes, { prefix: '/projects' });
}, { prefix: '/api' });

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

// Only start the server if we are running this file directly (not as a Vercel function)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  start();
}

export default async (req: any, res: any) => {
  await server.ready();
  server.server.emit('request', req, res);
};
