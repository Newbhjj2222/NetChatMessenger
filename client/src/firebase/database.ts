import { getDatabase, ref, set, get, remove, update, push, query, orderByChild, equalTo, onValue, off } from "firebase/database";
import app from "./firebase";
import { UserData, Message, Group, Status } from "../types";

export const database = getDatabase(app);

// User operations
export const updateUserData = async (uid: string, data: Partial<UserData>): Promise<void> => {
  await update(ref(database, `users/${uid}`), data);
};

export const getUserByUid = async (uid: string): Promise<UserData | null> => {
  const snapshot = await get(ref(database, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
};

export const getUserByUsername = async (username: string): Promise<UserData | null> => {
  const userQuery = query(ref(database, "users"), orderByChild("username"), equalTo(username));
  const snapshot = await get(userQuery);
  
  if (snapshot.exists()) {
    const users = snapshot.val();
    return users[Object.keys(users)[0]];
  }
  
  return null;
};

// Chat operations
export const sendMessage = async (senderId: string, receiverId: string, text: string, imageUrl?: string): Promise<string> => {
  const chatId = senderId < receiverId ? `${senderId}_${receiverId}` : `${receiverId}_${senderId}`;
  const messageRef = push(ref(database, `chats/${chatId}/messages`));
  
  // Set expiration time (10 days from now)
  const expiresAt = Date.now() + (10 * 24 * 60 * 60 * 1000);
  
  await set(messageRef, {
    id: messageRef.key,
    senderId,
    text,
    imageUrl: imageUrl || null,
    timestamp: Date.now(),
    expiresAt
  });
  
  // Update chat metadata
  await update(ref(database, `chats/${chatId}`), {
    lastMessage: {
      text,
      senderId,
      timestamp: Date.now()
    }
  });
  
  // Update user chats for both users
  await update(ref(database, `userChats/${senderId}/${receiverId}`), {
    chatId,
    lastMessage: {
      text,
      timestamp: Date.now()
    },
    unread: 0
  });
  
  await update(ref(database, `userChats/${receiverId}/${senderId}`), {
    chatId,
    lastMessage: {
      text,
      timestamp: Date.now()
    },
    unread: increment => (increment || 0) + 1
  });
  
  return messageRef.key!;
};

export const listenToUserChats = (userId: string, callback: (chats: any) => void) => {
  const chatsRef = ref(database, `userChats/${userId}`);
  onValue(chatsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  
  return () => off(chatsRef);
};

export const listenToChat = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `chats/${chatId}/messages`);
  onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()) as Message[];
      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    } else {
      callback([]);
    }
  });
  
  return () => off(messagesRef);
};

export const markChatAsRead = async (userId: string, contactId: string): Promise<void> => {
  await update(ref(database, `userChats/${userId}/${contactId}`), {
    unread: 0
  });
};

// Group operations
export const createGroup = async (name: string, creatorId: string, members: string[]): Promise<string> => {
  const groupRef = push(ref(database, "groups"));
  const groupId = groupRef.key!;
  
  const groupData: Group = {
    id: groupId,
    name,
    photoURL: null,
    createdBy: creatorId,
    createdAt: Date.now(),
    members: {
      [creatorId]: {
        role: "admin",
        addedAt: Date.now()
      }
    },
    lastMessage: null
  };
  
  // Add all other members
  members.forEach(memberId => {
    if (memberId !== creatorId) {
      groupData.members[memberId] = {
        role: "member",
        addedAt: Date.now()
      };
    }
  });
  
  await set(groupRef, groupData);
  
  // Add group to each member's groups list
  for (const memberId of [...members, creatorId]) {
    await update(ref(database, `userGroups/${memberId}/${groupId}`), {
      id: groupId,
      lastRead: Date.now()
    });
  }
  
  return groupId;
};

export const sendGroupMessage = async (groupId: string, senderId: string, text: string, imageUrl?: string): Promise<string> => {
  const messageRef = push(ref(database, `groupMessages/${groupId}`));
  
  // Set expiration time (10 days from now)
  const expiresAt = Date.now() + (10 * 24 * 60 * 60 * 1000);
  
  await set(messageRef, {
    id: messageRef.key,
    senderId,
    text,
    imageUrl: imageUrl || null,
    timestamp: Date.now(),
    expiresAt
  });
  
  // Update group metadata
  await update(ref(database, `groups/${groupId}`), {
    lastMessage: {
      text,
      senderId,
      timestamp: Date.now()
    }
  });
  
  return messageRef.key!;
};

export const listenToUserGroups = (userId: string, callback: (groups: any) => void) => {
  const groupsRef = ref(database, `userGroups/${userId}`);
  onValue(groupsRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });
  
  return () => off(groupsRef);
};

export const listenToGroupInfo = (groupId: string, callback: (group: Group) => void) => {
  const groupRef = ref(database, `groups/${groupId}`);
  onValue(groupRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
  
  return () => off(groupRef);
};

export const listenToGroupMessages = (groupId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(database, `groupMessages/${groupId}`);
  onValue(messagesRef, (snapshot) => {
    if (snapshot.exists()) {
      const messages = Object.values(snapshot.val()) as Message[];
      // Sort messages by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp);
      callback(messages);
    } else {
      callback([]);
    }
  });
  
  return () => off(messagesRef);
};

export const updateGroupMemberRole = async (groupId: string, userId: string, role: 'admin' | 'member'): Promise<void> => {
  await update(ref(database, `groups/${groupId}/members/${userId}`), {
    role
  });
};

export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  await remove(ref(database, `groups/${groupId}/members/${userId}`));
  await remove(ref(database, `userGroups/${userId}/${groupId}`));
};

export const addGroupMember = async (groupId: string, userId: string): Promise<void> => {
  await update(ref(database, `groups/${groupId}/members/${userId}`), {
    role: "member",
    addedAt: Date.now()
  });
  
  await update(ref(database, `userGroups/${userId}/${groupId}`), {
    id: groupId,
    lastRead: Date.now()
  });
};

// Status operations
export const createStatus = async (userId: string, content: string, imageUrl?: string): Promise<string> => {
  const statusRef = push(ref(database, `statuses/${userId}`));
  
  // Set expiration time (3 days from now)
  const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000);
  
  const status: Status = {
    id: statusRef.key!,
    userId,
    content,
    imageUrl: imageUrl || null,
    timestamp: Date.now(),
    expiresAt,
    views: {}
  };
  
  await set(statusRef, status);
  
  // Update user status info
  await update(ref(database, `users/${userId}`), {
    hasStatus: true,
    lastStatusTimestamp: Date.now()
  });
  
  return statusRef.key!;
};

export const viewStatus = async (statusUserId: string, statusId: string, viewerId: string): Promise<void> => {
  await update(ref(database, `statuses/${statusUserId}/${statusId}/views/${viewerId}`), {
    timestamp: Date.now()
  });
};

export const listenToUserStatuses = (userId: string, callback: (statuses: Status[]) => void) => {
  const statusesRef = ref(database, `statuses/${userId}`);
  onValue(statusesRef, (snapshot) => {
    if (snapshot.exists()) {
      const statuses = Object.values(snapshot.val()) as Status[];
      // Sort statuses by timestamp (newest first)
      statuses.sort((a, b) => b.timestamp - a.timestamp);
      callback(statuses);
    } else {
      callback([]);
    }
  });
  
  return () => off(statusesRef);
};

export const listenToRecentStatuses = (callback: (statusUpdates: {[userId: string]: {timestamp: number}}) => void) => {
  const usersRef = ref(database, "users");
  onValue(usersRef, (snapshot) => {
    if (snapshot.exists()) {
      const users = snapshot.val();
      const statusUpdates: {[userId: string]: {timestamp: number}} = {};
      
      Object.keys(users).forEach(userId => {
        if (users[userId].hasStatus && users[userId].lastStatusTimestamp) {
          statusUpdates[userId] = {
            timestamp: users[userId].lastStatusTimestamp
          };
        }
      });
      
      callback(statusUpdates);
    } else {
      callback({});
    }
  });
  
  return () => off(usersRef);
};

// Clean up expired data (should run on server)
export const cleanupExpiredData = async (): Promise<void> => {
  const now = Date.now();
  
  // Clean up expired messages
  const chatsSnapshot = await get(ref(database, "chats"));
  if (chatsSnapshot.exists()) {
    const chats = chatsSnapshot.val();
    
    for (const chatId in chats) {
      if (chats[chatId].messages) {
        for (const messageId in chats[chatId].messages) {
          const message = chats[chatId].messages[messageId];
          if (message.expiresAt && message.expiresAt < now) {
            await remove(ref(database, `chats/${chatId}/messages/${messageId}`));
          }
        }
      }
    }
  }
  
  // Clean up expired group messages
  const groupMessagesSnapshot = await get(ref(database, "groupMessages"));
  if (groupMessagesSnapshot.exists()) {
    const groupMessages = groupMessagesSnapshot.val();
    
    for (const groupId in groupMessages) {
      for (const messageId in groupMessages[groupId]) {
        const message = groupMessages[groupId][messageId];
        if (message.expiresAt && message.expiresAt < now) {
          await remove(ref(database, `groupMessages/${groupId}/${messageId}`));
        }
      }
    }
  }
  
  // Clean up expired statuses
  const statusesSnapshot = await get(ref(database, "statuses"));
  if (statusesSnapshot.exists()) {
    const statuses = statusesSnapshot.val();
    
    for (const userId in statuses) {
      let hasActiveStatus = false;
      
      for (const statusId in statuses[userId]) {
        const status = statuses[userId][statusId];
        if (status.expiresAt && status.expiresAt < now) {
          await remove(ref(database, `statuses/${userId}/${statusId}`));
        } else {
          hasActiveStatus = true;
        }
      }
      
      // Update user hasStatus flag if all statuses expired
      if (!hasActiveStatus) {
        await update(ref(database, `users/${userId}`), {
          hasStatus: false
        });
      }
    }
  }
};
