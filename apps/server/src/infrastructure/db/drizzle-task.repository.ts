import { eq } from 'drizzle-orm';
import { db, tasks } from '../db/db';
import { ITaskRepository } from '../../domain/repositories/task.repository';
import type { Task } from '../../domain/entities';

export class DrizzleTaskRepository implements ITaskRepository {
  async create(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
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

  async findAll(): Promise<Task[]> {
    const rows = await db
      .select()
      .from(tasks)
      .orderBy(tasks.createdAt);

    return rows.map(this.mapRowToTask);
  }

  async update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Task | null> {
    const values: Record<string, unknown> = {};
    if (data.title !== undefined) values.title = data.title;
    if (data.category !== undefined) values.category = data.category;
    if (data.status !== undefined) values.status = data.status;
    if (data.scheduledAt !== undefined) values.scheduledAt = data.scheduledAt;
    if (data.meetingLink !== undefined) values.meetingLink = data.meetingLink;

    const [row] = await db
      .update(tasks)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();

    return row ? this.mapRowToTask(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

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
