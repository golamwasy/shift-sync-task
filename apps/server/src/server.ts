import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './presentation/routes/health.route';
import aiRoutes from './presentation/routes/ai.route';

const server = Fastify({
  logger: true
});

// Register CORS
server.register(cors, { 
  origin: true // Allows all origins. For production, specify your web app domain!
});

// Register routes
server.register(healthRoutes);
server.register(aiRoutes, { prefix: '/ai' });

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '0.0.0.0' });
    server.log.info(`Server listening on ${server.server.address()}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
