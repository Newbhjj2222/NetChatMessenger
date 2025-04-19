import { users, messages, chats, User, Chat, Message, InsertUser, InsertChat, InsertMessage } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private usersStore: Map<number, User>;
  private chatsStore: Map<number, Chat>;
  private messagesStore: Map<number, Message>;
  private userIdCounter: number;
  private chatIdCounter: number;
  private messageIdCounter: number;

  constructor() {
    this.usersStore = new Map();
    this.chatsStore = new Map();
    this.messagesStore = new Map();
    this.userIdCounter = 1;
    this.chatIdCounter = 1;
    this.messageIdCounter = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersStore.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersStore.values()).find(
      (user) => user.username === username,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersStore.values());
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id, createdAt: new Date() };
    this.usersStore.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, ...data };
    this.usersStore.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.usersStore.delete(id);
  }

  // Chat operations
  async getChat(id: number): Promise<Chat | undefined> {
    return this.chatsStore.get(id);
  }

  async getUserChats(userId: number): Promise<Chat[]> {
    return Array.from(this.chatsStore.values()).filter(chat => 
      chat.members.some(member => member.userId === userId)
    );
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const id = this.chatIdCounter++;
    const newChat: Chat = { ...chat, id, createdAt: new Date() };
    this.chatsStore.set(id, newChat);
    return newChat;
  }

  async addUserToChat(chatId: number, userId: number, isAdmin: boolean): Promise<void> {
    const chat = await this.getChat(chatId);
    if (!chat) throw new Error("Chat not found");
    
    if (!chat.members.some(member => member.userId === userId)) {
      chat.members.push({
        userId,
        isAdmin,
        joinedAt: new Date()
      });
      this.chatsStore.set(chatId, chat);
    }
  }

  async removeUserFromChat(chatId: number, userId: number): Promise<void> {
    const chat = await this.getChat(chatId);
    if (!chat) throw new Error("Chat not found");
    
    chat.members = chat.members.filter(member => member.userId !== userId);
    this.chatsStore.set(chatId, chat);
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messagesStore.get(id);
  }

  async getChatMessages(chatId: number): Promise<Message[]> {
    return Array.from(this.messagesStore.values()).filter(
      message => message.chatId === chatId
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messageIdCounter++;
    const newMessage: Message = { 
      ...message, 
      id, 
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
    };
    this.messagesStore.set(id, newMessage);
    return newMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    this.messagesStore.delete(id);
  }

  async deleteOldMessages(days: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    for (const [id, message] of this.messagesStore.entries()) {
      if (message.createdAt < cutoffDate || (message.expiresAt && message.expiresAt < new Date())) {
        this.messagesStore.delete(id);
      }
    }
  }

  async deleteOldStatuses(days: number): Promise<void> {
    // In a real implementation, we would have a separate table for statuses
    // This is a placeholder for the Firebase implementation
    console.log(`Deleting statuses older than ${days} days`);
  }
}

export const storage = new MemStorage();
