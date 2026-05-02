import { FastifyReply, FastifyRequest } from 'fastify';
import { db, aiUsage } from '../db/db';
import { eq } from 'drizzle-orm';

export async function checkAIUsage(request: FastifyRequest, reply: FastifyReply) {
  const ip = request.ip || 'unknown';
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Check AI usage limit
  const usageRows = await db.select().from(aiUsage).where(eq(aiUsage.ip, ip)).limit(1);
  const usage = usageRows[0];
  
  const resetTime = usage?.lastRequestAt ? new Date(usage.lastRequestAt.getTime() + 24 * 60 * 60 * 1000) : null;

  if (usage) {
    const isExpired = usage.lastRequestAt && usage.lastRequestAt < twentyFourHoursAgo;
    
    if (isExpired) {
      // Reset window
      await db.update(aiUsage)
        .set({ 
          count: 1,
          lastRequestAt: now
        })
        .where(eq(aiUsage.ip, ip));
    } else if (usage.count >= 10) {
      const formattedTime = resetTime?.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

      return reply.status(429).send({
        status: 'error',
        message: `Limit reached. Please come back after ${formattedTime}.`
      });
    } else {
      // Increment usage count, but keep the original window start time
      await db.update(aiUsage)
        .set({ 
          count: usage.count + 1
        })
        .where(eq(aiUsage.ip, ip));
    }
  } else {
    // First time request for this IP
    await db.insert(aiUsage).values({
      ip: ip,
      count: 1,
      lastRequestAt: now
    });
  }
}
