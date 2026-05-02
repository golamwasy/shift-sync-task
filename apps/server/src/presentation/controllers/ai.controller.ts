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
      const ip = request.ip || 'unknown';
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Check AI usage limit
      const usageRows = await this.db.select().from(aiUsage).where(eq(aiUsage.ip, ip)).limit(1);
      const usage = usageRows[0];
      
      if (usage) {
        const isExpired = usage.lastRequestAt && usage.lastRequestAt < twentyFourHoursAgo;
        
        if (isExpired) {
          // Reset count if the window has passed
          await this.db.update(aiUsage)
            .set({ 
              count: 1,
              lastRequestAt: now
            })
            .where(eq(aiUsage.ip, ip));
        } else if (usage.count >= 10) {
          return reply.status(429).send({
            status: 'error',
            message: 'Limit reached'
          });
        } else {
          // Increment usage count
          await this.db.update(aiUsage)
            .set({ 
              count: usage.count + 1,
              lastRequestAt: now
            })
            .where(eq(aiUsage.ip, ip));
        }
      } else {
        // First time request for this IP
        await this.db.insert(aiUsage).values({
          ip: ip,
          count: 1,
          lastRequestAt: now
        });
      }

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
