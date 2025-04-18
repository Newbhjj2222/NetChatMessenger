import { createContext, useContext, useState, ReactNode } from "react";

interface ChatType {
  id: string;
  name: string;
  photoURL: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
  members?: { [key: string]: { role: string, joinedAt: number } };
}

interface ChatContextType {
  selectedChat: ChatType | null;
  setSelectedChat: (chat: ChatType | null) => void;
}

const ChatContext = createContext<ChatContextType>({
  selectedChat: null,
  setSelectedChat: () => {},
});

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);

  const value = {
    selectedChat,
    setSelectedChat,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
