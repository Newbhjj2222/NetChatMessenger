import { ref, serverTimestamp, push, set, remove, query, orderByChild, endAt } from "firebase/database";
import { db } from "@/lib/firebase";

// Generate a unique invitation link
export const generateInviteLink = (userId: string, chatId: string, isGroup: boolean, chatName: string, chatPhoto?: string) => {
  const inviteCode = Math.random().toString(36).substring(2, 10);
  const inviteRef = ref(db, `invites/${inviteCode}`);
  
  set(inviteRef, {
    createdBy: userId,
    chatId,
    chatName,
    chatPhoto: chatPhoto || "",
    isGroup,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  
  return `${window.location.origin}?invite=${inviteCode}`;
};

// Clean up old messages (older than 10 days)
export const cleanupOldMessages = async () => {
  const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
  
  // Get all chats
  const chatsRef = ref(db, "chats");
  const chatsSnapshot = await chatsRef.get();
  
  if (chatsSnapshot.exists()) {
    chatsSnapshot.forEach((chatSnapshot) => {
      const chatId = chatSnapshot.key;
      
      // Query messages older than 10 days
      const messagesRef = ref(db, `chats/${chatId}/messages`);
      const oldMessagesQuery = query(
        messagesRef,
        orderByChild("timestamp"),
        endAt(tenDaysAgo)
      );
      
      // Delete old messages
      oldMessagesQuery.get().then((messagesSnapshot) => {
        if (messagesSnapshot.exists()) {
          messagesSnapshot.forEach((messageSnapshot) => {
            remove(ref(db, `chats/${chatId}/messages/${messageSnapshot.key}`));
          });
        }
      });
    });
  }
};

// Clean up old statuses (older than 3 days)
export const cleanupOldStatuses = async () => {
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  
  // Get all users
  const usersRef = ref(db, "users");
  const usersSnapshot = await usersRef.get();
  
  if (usersSnapshot.exists()) {
    usersSnapshot.forEach((userSnapshot) => {
      const userId = userSnapshot.key;
      
      // Query statuses older than 3 days
      const statusesRef = ref(db, `statuses/${userId}`);
      const oldStatusesQuery = query(
        statusesRef,
        orderByChild("timestamp"),
        endAt(threeDaysAgo)
      );
      
      // Delete old statuses
      oldStatusesQuery.get().then((statusesSnapshot) => {
        if (statusesSnapshot.exists()) {
          statusesSnapshot.forEach((statusSnapshot) => {
            remove(ref(db, `statuses/${userId}/${statusSnapshot.key}`));
          });
        }
      });
    });
  }
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
};

export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
