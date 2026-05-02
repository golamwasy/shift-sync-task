import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ITaskRepository } from '../../domain/repositories/task.repository';

const CreateTaskBody = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  scheduledAt: z.string().optional().nullable(),
  meetingLink: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  userId: z.string().uuid(),
});

const UpdateTaskBody = z.object({
  title: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  scheduledAt: z.string().optional().nullable(),
  meetingLink: z.string().optional().nullable(),
  status: z.enum(['todo', 'in-progress', 'done']).optional(),
});

export class TaskController {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async getAll(_request: FastifyRequest, reply: FastifyReply) {
    const tasks = await this.taskRepository.findAll();
    return reply.send({ status: 'success', data: tasks });
  }

  async getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const task = await this.taskRepository.findById(request.params.id);
    if (!task) {
      return reply.status(404).send({ status: 'error', message: 'Task not found' });
    }
    return reply.send({ status: 'success', data: task });
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const parsed = CreateTaskBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });
    }

    const task = await this.taskRepository.create({
      title: parsed.data.title,
      category: parsed.data.category,
      status: parsed.data.status,
      userId: parsed.data.userId,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : undefined,
      meetingLink: parsed.data.meetingLink ?? undefined,
    });

    return reply.status(201).send({ status: 'success', data: task });
  }

  async update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const parsed = UpdateTaskBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Validation failed', details: parsed.error.errors });
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.scheduledAt !== undefined) {
      updateData.scheduledAt = parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null;
    }

    const task = await this.taskRepository.update(request.params.id, updateData as any);
    if (!task) {
      return reply.status(404).send({ status: 'error', message: 'Task not found' });
    }

    return reply.send({ status: 'success', data: task });
  }

  async delete(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const deleted = await this.taskRepository.delete(request.params.id);
    if (!deleted) {
      return reply.status(404).send({ status: 'error', message: 'Task not found' });
    }
    return reply.status(204).send();
  }
}
