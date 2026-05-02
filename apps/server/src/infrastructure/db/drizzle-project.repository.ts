import { eq, and } from 'drizzle-orm';
import { db, projects, users } from './db';
import { IProjectRepository } from '../../domain/repositories/project.repository';
import type { Project } from '../../domain/entities';

export class DrizzleProjectRepository implements IProjectRepository {
  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
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
      .insert(projects)
      .values({
        name: data.name,
        description: data.description ?? null,
        status: data.status,
        dueDate: data.dueDate ?? null,
        userId: data.userId,
      })
      .returning();

    return this.mapRowToProject(row);
  }

  async findById(id: string): Promise<Project | null> {
    const [row] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    return row ? this.mapRowToProject(row) : null;
  }

  async findAll(userId: string): Promise<Project[]> {
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);

    return rows.map(this.mapRowToProject);
  }

  async update(id: string, data: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>, userId: string): Promise<Project | null> {
    const values: Record<string, unknown> = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.description !== undefined) values.description = data.description;
    if (data.status !== undefined) values.status = data.status;
    if (data.dueDate !== undefined) values.dueDate = data.dueDate;

    const [row] = await db
      .update(projects)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return row ? this.mapRowToProject(row) : null;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const [row] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    return !!row;
  }

  private mapRowToProject(row: typeof projects.$inferSelect): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      status: row.status as Project['status'],
      dueDate: row.dueDate ?? undefined,
      userId: row.userId,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined,
    };
  }
}
