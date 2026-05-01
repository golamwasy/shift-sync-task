import { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../infrastructure/db/db';
import { sql } from 'drizzle-orm';

export class HealthController {
  async getHealth(request: FastifyRequest, reply: FastifyReply) {
    return reply.send({
      status: 'ok',
      uptime: process.uptime()
    });
  }

  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const start = process.hrtime();
      await db.execute(sql`SELECT 1`);
      const diff = process.hrtime(start);
      const latencyMs = (diff[0] * 1e9 + diff[1]) / 1e6;

      return reply.send({
        status: 'ok',
        dbLatencyMs: Number(latencyMs.toFixed(2))
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        status: 'error',
        message: 'Database connection failed'
      });
    }
  }
}
