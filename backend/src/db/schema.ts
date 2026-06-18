import { pgTable, text, timestamp, varchar, jsonb, boolean, uuid, customType } from 'drizzle-orm/pg-core';

// Custom pgvector type for Drizzle ORM
const pgVector = customType<{ data: number[]; config: { dimensions: number } }>({
  dataType(config) {
    return `vector(${config?.dimensions})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === 'string') {
      return value.slice(1, -1).split(',').map(Number);
    }
    return value as number[];
  },
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const gmailAccounts = pgTable('gmail_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  historyId: varchar('history_id', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const threads = pgTable('threads', {
  id: varchar('id', { length: 255 }).primaryKey(), // Gmail Thread ID
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  subject: text('subject'),
  snippet: text('snippet'),
  lastMessageDate: timestamp('last_message_date', { withTimezone: true }),
  summary: text('summary'),
  summaryEmbedding: pgVector('summary_embedding', { dimensions: 768 }), // Gemini text-embedding-004
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const emails = pgTable('emails', {
  id: varchar('id', { length: 255 }).primaryKey(), // Gmail Message ID
  threadId: varchar('thread_id', { length: 255 }).references(() => threads.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sender: text('sender').notNull(),
  receiver: text('receiver').notNull(),
  subject: text('subject'),
  body: text('body'),
  html: text('html'),
  internalDate: timestamp('internal_date', { withTimezone: true }).notNull(),
  category: varchar('category', { length: 50 }), // Newsletter, Finance, Job, Notification, Personal, Professional
  summary: text('summary'),
  embedding: pgVector('embedding', { dimensions: 768 }), // Gemini text-embedding-004
  headers: jsonb('headers'), // Message-ID, In-Reply-To, References, etc.
  labelIds: text('label_ids').array(),
  isNewsletter: boolean('is_newsletter').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'user' or 'assistant'
  content: text('content').notNull(),
  sources: jsonb('sources'), // { emailId, subject, threadId }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
