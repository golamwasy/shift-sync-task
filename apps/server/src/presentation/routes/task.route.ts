import { FastifyInstance } from 'fastify';
import { TaskController } from '../controllers/task.controller';
import { container } from '../../infrastructure/di/container';

export default async function taskRoutes(fastify: FastifyInstance) {
  const taskController = container.resolve('taskController') as TaskController;

  fastify.get('/', taskController.getAll.bind(taskController));
  fastify.get('/:id', taskController.getById.bind(taskController));
  fastify.post('/', taskController.create.bind(taskController));
  fastify.put('/:id', taskController.update.bind(taskController));
  fastify.delete('/:id', taskController.delete.bind(taskController));
}
