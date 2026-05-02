import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { GeminiService } from '../../infrastructure/ai/gemini.service';
import { db as database, aiUsage } from '../../infrastructure/db/db';
import { eq } from 'drizzle-orm';

const ParseRequestSchema = z.object({
  text: z.string({ required_error: "Text input is required" }).min(1, "Text input is required")
});

export class AIController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly db: typeof database
  ) {}

  async parse(request: FastifyRequest<{ Body: { text: string } }>, reply: FastifyReply) {
    try {
      const parsedBody = ParseRequestSchema.safeParse(request.body);
      
      if (!parsedBody.success) {
        return reply.status(400).send({ 
          error: 'Validation failed', 
          details: parsedBody.error.errors 
        });
      }

      const { text } = parsedBody.data;
      const parsedData = await this.geminiService.parseTaskText(text);
      
      return reply.send({
        status: 'success',
        data: parsedData
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        status: 'error',
        message: 'Failed to process AI request'
      });
    }
  }

  async decompose(request: FastifyRequest<{ Body: { title: string } }>, reply: FastifyReply) {
    try {
      const { title } = request.body;
      if (!title) return reply.status(400).send({ error: 'Title is required' });

      const subtasks = await this.geminiService.decomposeTask(title);
      return reply.send({ status: 'success', data: subtasks });
    } catch (error) {
      return reply.status(500).send({ status: 'error', message: 'Failed to decompose task' });
    }
  }
}
