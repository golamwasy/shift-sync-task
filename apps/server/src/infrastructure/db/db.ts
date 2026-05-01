import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 256 }).notNull().unique(),
  name: varchar('name', { length: 256 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 256 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  scheduledAt: timestamp('scheduled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Setup the database connection. For production, this should come from env vars.
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/shiftsync';
const client = postgres(connectionString);
export const db = drizzle(client);
