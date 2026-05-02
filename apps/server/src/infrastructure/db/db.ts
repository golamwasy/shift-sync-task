import { pgTable, uuid, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, lt, sql, and } from 'drizzle-orm';
import postgres from 'postgres';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const aiUsage = pgTable('ai_usage', {
  ip: varchar('ip', { length: 50 }).primaryKey(),
  count: integer('count').notNull().default(0),
  lastRequestAt: timestamp('last_request_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  description: varchar('description', { length: 1024 }),
  status: varchar('status', { length: 50 }).notNull(),
  dueDate: timestamp('due_date'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  dependsOn: jsonb('depends_on').default([]),
  scheduledAt: timestamp('scheduled_at'),
  meetingLink: varchar('meeting_link', { length: 512 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const resources = pgTable('resources', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 256 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  url: varchar('url', { length: 1024 }),
  projectId: uuid('project_id').references(() => projects.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Setup the database connection. For production, this should come from env vars.
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/shiftsync';
const client = postgres(connectionString);
export const db = drizzle(client);

export async function seedUser() {
  const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
  
  const existingUser = await db.select().from(users).where(eq(users.id, DEFAULT_USER_ID)).limit(1);
  
  if (existingUser.length === 0) {
    console.log('Seeding default user...');
    await db.insert(users).values({
      id: DEFAULT_USER_ID,
      email: 'wasy@planora.ai',
      name: 'Wasy (Default)',
      role: 'admin'
    });
  }
}

/**
 * Deletes tasks and users that are older than 3 days.
 * This is used to maintain privacy and limit data retention for session-based users.
 */
export async function cleanupOldData() {
  console.log('Running cleanup of old session data...');
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  try {
    // Delete old tasks first (due to foreign key)
    await db.delete(tasks).where(lt(tasks.createdAt, threeDaysAgo));
    
    // Delete old users (except the default one)
    const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';
    await db.delete(users).where(
      and(
        lt(users.createdAt, threeDaysAgo),
        sql`${users.id}::text != ${DEFAULT_USER_ID}`
      )
    );
    
    console.log(`Cleanup complete. Deleted old tasks and users.`);
  } catch (error) {
    console.error('Error during data cleanup:', error);
  }
}
