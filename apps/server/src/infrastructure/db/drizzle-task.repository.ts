import { eq, and } from 'drizzle-orm';
import { db, tasks, users } from '../db/db';
import { ITaskRepository } from '../../domain/repositories/task.repository';
import type { Task } from '../../domain/entities';

export class DrizzleTaskRepository implements ITaskRepository {
  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    // Ensure user exists (anonymous user support)
    const existingUser = await db.select().from(users).where(eq(users.id, data.userId)).limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: data.userId,
        email: `anon-${data.userId}@planora.ai`,
        name: 'Anonymous User',
        role: 'user'
      });
    }

    const [row] = await db
      .insert(tasks)
      .values({
        title: data.title,
        category: data.category,
        status: data.status,
        userId: data.userId,
        scheduledAt: data.scheduledAt ?? null,
        meetingLink: data.meetingLink ?? null,
      })
      .returning();

    return this.mapRowToTask(row);
  }

  async findById(id: string): Promise<Task | null> {
    const [row] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);

    return row ? this.mapRowToTask(row) : null;
  }

  async findAll(userId?: string): Promise<Task[]> {
    let query = db.select().from(tasks);
    
    if (userId) {
      // @ts-ignore - userId is uuid in DB but we might pass string
      query = query.where(eq(tasks.userId, userId)) as any;
    }

    const rows = await query.orderBy(tasks.createdAt);
    return rows.map(this.mapRowToTask);
  }

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>, userId?: string): Promise<Task | null> {
    const values: Record<string, unknown> = {};
    if (data.title !== undefined) values.title = data.title;
    if (data.category !== undefined) values.category = data.category;
    if (data.status !== undefined) values.status = data.status;
    if (data.scheduledAt !== undefined) values.scheduledAt = data.scheduledAt;
    if (data.meetingLink !== undefined) values.meetingLink = data.meetingLink;

    let query = db.update(tasks).set({ ...values, updatedAt: new Date() });
    
    if (userId) {
      // @ts-ignore
      query = query.where(and(eq(tasks.id, id), eq(tasks.userId, userId))) as any;
    } else {
      query = query.where(eq(tasks.id, id)) as any;
    }

    const [row] = await query.returning();
    return row ? this.mapRowToTask(row) : null;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    let query = db.delete(tasks);

    if (userId) {
      // @ts-ignore
      query = query.where(and(eq(tasks.id, id), eq(tasks.userId, userId))) as any;
    } else {
      query = query.where(eq(tasks.id, id)) as any;
    }

    const [row] = await query.returning();
    return !!row;
  }

  private mapRowToTask(row: typeof tasks.$inferSelect): Task {
    return {
      id: row.id,
      title: row.title,
      category: row.category,
      status: row.status as Task['status'],
      userId: row.userId,
      scheduledAt: row.scheduledAt ?? undefined,
      meetingLink: row.meetingLink ?? undefined,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    };
  }
}
