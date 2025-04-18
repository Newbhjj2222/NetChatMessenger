// User related types
export interface UserData {
  uid: string;
  username: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  hasStatus?: boolean;
  lastStatusTimestamp?: number;
  lastSeen?: number;
  about?: string;
}

// Message related types
export interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl: string | null;
  timestamp: number;
  expiresAt: number;
}

export interface LastMessage {
  text: string;
  senderId: string;
  timestamp: number;
}

export interface ChatData {
  chatId: string;
  lastMessage: {
    text: string;
    timestamp: number;
  };
  unread: number;
}

// Group related types
export interface GroupMember {
  role: 'admin' | 'member';
  addedAt: number;
}

export interface Group {
  id: string;
  name: string;
  photoURL: string | null;
  createdBy: string;
  createdAt: number;
  members: {
    [userId: string]: GroupMember;
  };
  lastMessage: LastMessage | null;
}

export interface UserGroup {
  id: string;
  lastRead: number;
}

// Status related types
export interface StatusView {
  timestamp: number;
}

export interface Status {
  id: string;
  userId: string;
  content: string;
  imageUrl: string | null;
  timestamp: number;
  expiresAt: number;
  views: {
    [userId: string]: StatusView;
  };
}

// Notification related types
export interface Notification {
  id: string;
  type: 'message' | 'group_message' | 'status' | 'call';
  senderId: string;
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
  data?: any;
}
