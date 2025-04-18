import { 
  users, chats, chatMembers, messages, statuses,
  User, Chat, Message, InsertUser, InsertChat, InsertMessage 
} from "@shared/schema";
import { eq, and, lt, asc, inArray, or } from "drizzle-orm";
import { db } from "./db";

// Storage interface for user CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  
  // Chat operations
  getChat(id: number): Promise<Chat | undefined>;
  getUserChats(userId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  addUserToChat(chatId: number, userId: number, isAdmin: boolean): Promise<void>;
  removeUserFromChat(chatId: number, userId: number): Promise<void>;
  
  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getChatMessages(chatId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<void>;
  deleteOldMessages(days: number): Promise<void>;
  deleteOldStatuses(days: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, id));
    
    if (!chat) return undefined;
    
    const members = await db
      .select()
      .from(chatMembers)
      .where(eq(chatMembers.chatId, id));
    
    return {
      ...chat,
      members: members.map(m => ({
        userId: m.userId,
        isAdmin: m.isAdmin || false,
        joinedAt: m.joinedAt || new Date(),
      })),
    };
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    // Get chat IDs that the user is a member of
    const memberChats = await db
      .select({ chatId: chatMembers.chatId })
      .from(chatMembers)
      .where(eq(chatMembers.userId, userId));
    
    if (memberChats.length === 0) return [];
    
    const chatIds = memberChats.map(c => c.chatId);
    
    // Get the chats
    const userChats = await db
      .select()
      .from(chats)
      .where(inArray(chats.id, chatIds));
    
    // Get all chat members for these chats
    const allMembers = await db
      .select()
      .from(chatMembers)
      .where(inArray(chatMembers.chatId, chatIds));
    
    // Organize members by chat
    const membersByChatId: Record<number, { userId: number; isAdmin: boolean; joinedAt: Date }[]> = {};
    
    for (const member of allMembers) {
      if (!membersByChatId[member.chatId]) {
        membersByChatId[member.chatId] = [];
      }
      
      membersByChatId[member.chatId].push({
        userId: member.userId,
        isAdmin: member.isAdmin || false,
        joinedAt: member.joinedAt || new Date(),
      });
    }
    
    // Combine chats with their members
    return userChats.map(chat => ({
      ...chat,
      members: membersByChatId[chat.id] || [],
    }));
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db.insert(chats).values(chat).returning();
    
    return {
      ...newChat,
      members: [],
    };
  }

  async addUserToChat(chatId: number, userId: number, isAdmin: boolean): Promise<void> {
    await db.insert(chatMembers).values({
      chatId,
      userId,
      isAdmin,
    });
  }

  async removeUserFromChat(chatId: number, userId: number): Promise<void> {
    await db
      .delete(chatMembers)
      .where(
        and(
          eq(chatMembers.chatId, chatId),
          eq(chatMembers.userId, userId)
        )
      );
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    // Set expiration 10 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 10);
    
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        expiresAt
      })
      .returning();
    
    return newMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async deleteOldMessages(days: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    await db
      .delete(messages)
      .where(
        or(
          lt(messages.createdAt, cutoff),
          lt(messages.expiresAt, new Date())
        )
      );
  }

  async deleteOldStatuses(days: number): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    await db
      .delete(statuses)
      .where(lt(statuses.createdAt, cutoff));
  }
}

export const storage = new DatabaseStorage();
