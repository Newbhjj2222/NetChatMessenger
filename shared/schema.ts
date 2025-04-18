import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  photoURL: text("photo_url"),
  about: text("about"),
  status: text("status").default("offline"),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat members junction table
export const chatMembers = pgTable("chat_members", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  userId: integer("user_id").notNull(),
  isAdmin: boolean("is_admin").default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chats table
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name"),
  photoURL: text("photo_url"),
  isGroup: boolean("is_group").default(false),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull(),
  senderId: integer("sender_id").notNull(),
  text: text("text"),
  imageUrl: text("image_url"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Statuses table
export const statuses = pgTable("statuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  viewers: jsonb("viewers"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Calls table
export const calls = pgTable("calls", {
  id: serial("id").primaryKey(),
  callerId: integer("caller_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  type: text("type").notNull(),  // "audio" or "video"
  status: text("status").notNull(), // "missed", "received", "dialed"
  duration: integer("duration"), // in seconds
  startedAt: timestamp("started_at").defaultNow(),
});

// Invites table
export const invites = pgTable("invites", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  chatId: integer("chat_id").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  displayName: true,
  photoURL: true,
  about: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  name: true,
  photoURL: true,
  isGroup: true,
  createdBy: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  senderId: true,
  text: true,
  imageUrl: true,
});

export const insertStatusSchema = createInsertSchema(statuses).pick({
  userId: true,
  imageUrl: true,
  caption: true,
});

export const insertCallSchema = createInsertSchema(calls).pick({
  callerId: true,
  receiverId: true,
  type: true,
  status: true,
  duration: true,
});

export const insertInviteSchema = createInsertSchema(invites).pick({
  code: true,
  chatId: true,
  createdBy: true,
  expiresAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chat = typeof chats.$inferSelect & {
  members: {
    userId: number;
    isAdmin: boolean;
    joinedAt: Date;
  }[];
};
export type InsertChat = z.infer<typeof insertChatSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Status = typeof statuses.$inferSelect;
export type InsertStatus = z.infer<typeof insertStatusSchema>;

export type Call = typeof calls.$inferSelect;
export type InsertCall = z.infer<typeof insertCallSchema>;

export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
