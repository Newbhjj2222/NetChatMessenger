import { useState, useEffect } from "react";
import { ref, onValue, query, orderByChild, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";

type Chat = {
  id: string;
  name: string;
  photoURL: string;
  lastMessage: string;
  timestamp: number;
  unreadCount: number;
  isGroup: boolean;
  isOnline?: boolean;
};

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const { currentUser } = useAuth();
  const { setSelectedChat } = useChat();

  useEffect(() => {
    if (!currentUser) return;

    const userChatsRef = ref(db, `userChats/${currentUser.uid}`);
    const unsubscribe = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedChats: Chat[] = [];
      
      if (data) {
        Object.entries(data).forEach(([id, chatData]: [string, any]) => {
          loadedChats.push({
            id,
            name: chatData.name,
            photoURL: chatData.photoURL || "",
            lastMessage: chatData.lastMessage?.text || "",
            timestamp: chatData.lastMessage?.timestamp || 0,
            unreadCount: chatData.unreadCount || 0,
            isGroup: chatData.isGroup || false,
            isOnline: chatData.isOnline || false,
          });
        });
      }
      
      // Sort by timestamp
      loadedChats.sort((a, b) => b.timestamp - a.timestamp);
      setChats(loadedChats);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    
    // Mark messages as read
    if (currentUser && chat.unreadCount > 0) {
      const chatRef = ref(db, `userChats/${currentUser.uid}/${chat.id}`);
      set(chatRef, { ...chat, unreadCount: 0 });
    }
  };

  const handleCreateChat = async () => {
    if (!currentUser || !newChatName.trim()) return;
    
    try {
      const newChatRef = push(ref(db, "chats"));
      const chatId = newChatRef.key;
      
      // Create chat
      await set(newChatRef, {
        name: newChatName,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        isGroup: isCreatingGroup,
        members: {
          [currentUser.uid]: {
            role: "admin",
            joinedAt: Date.now()
          }
        }
      });
      
      // Add chat to user's chats
      await set(ref(db, `userChats/${currentUser.uid}/${chatId}`), {
        name: newChatName,
        photoURL: "",
        isGroup: isCreatingGroup,
        unreadCount: 0,
        timestamp: Date.now()
      });
      
      // Reset form
      setNewChatName("");
      setIsCreatingGroup(false);
      setIsNewChatOpen(false);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp: number) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-3 py-2 bg-white">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search or start new chat"
            className="w-full py-2 pl-10 pr-4 bg-secondary-bg rounded-lg text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-2.5 text-text-secondary"></i>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <div 
              key={chat.id}
              className="flex items-center p-3 hover:bg-secondary-bg border-b border-gray-100 cursor-pointer"
              onClick={() => handleChatClick(chat)}
            >
              <div className="relative flex-shrink-0">
                {chat.isGroup ? (
                  <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-white font-medium">
                    <i className="fas fa-users"></i>
                  </div>
                ) : (
                  <img 
                    src={chat.photoURL || "https://via.placeholder.com/100"} 
                    className="w-12 h-12 rounded-full object-cover"
                    alt={chat.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/100";
                    }}
                  />
                )}
                {chat.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary-light rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-medium">{chat.name}</h3>
                  <span className="text-xs text-text-secondary">{formatTime(chat.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary truncate">
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary-light text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-text-secondary">
            No chats found. Start a new conversation!
          </div>
        )}
      </div>
      
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogTrigger asChild>
          <div className="absolute bottom-5 right-5 md:bottom-24">
            <Button className="bg-primary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg">
              <i className="fas fa-comment-alt text-xl"></i>
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isGroup" 
                checked={isCreatingGroup}
                onChange={(e) => setIsCreatingGroup(e.target.checked)}
              />
              <label htmlFor="isGroup">Create a group</label>
            </div>
            <Input
              placeholder={isCreatingGroup ? "Group Name" : "Contact Name"}
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
            />
            <Button 
              className="w-full bg-primary text-white"
              onClick={handleCreateChat}
            >
              Create {isCreatingGroup ? "Group" : "Chat"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatList;
