import { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set, serverTimestamp } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Message from "./Message";

type MessageType = {
  id: string;
  text: string;
  senderId: string;
  timestamp: number;
  senderName: string;
  imageUrl?: string;
  read: boolean;
};

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();
  const { selectedChat } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser || !selectedChat) return;

    const messagesRef = ref(db, `chats/${selectedChat.id}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedMessages: MessageType[] = [];
      
      if (data) {
        Object.entries(data).forEach(([id, message]: [string, any]) => {
          loadedMessages.push({
            id,
            text: message.text || "",
            senderId: message.senderId,
            timestamp: message.timestamp,
            senderName: message.senderName || "",
            imageUrl: message.imageUrl || "",
            read: message.read || false,
          });
        });
      }
      
      // Sort by timestamp
      loadedMessages.sort((a, b) => a.timestamp - b.timestamp);
      setMessages(loadedMessages);
      
      // Mark messages as read
      loadedMessages.forEach(message => {
        if (message.senderId !== currentUser.uid && !message.read) {
          const messageRef = ref(db, `chats/${selectedChat.id}/messages/${message.id}`);
          set(messageRef, { ...message, read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser, selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!currentUser || !selectedChat) return;
    if (!newMessage.trim() && !selectedImage) return;
    
    setLoading(true);
    
    try {
      let imageUrl = "";
      
      // Upload image if selected
      if (selectedImage) {
        const imageRef = storageRef(storage, `chats/${selectedChat.id}/${Date.now()}_${selectedImage.name}`);
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      // Add message to chat
      const messagesRef = ref(db, `chats/${selectedChat.id}/messages`);
      const newMessageRef = push(messagesRef);
      
      const timestamp = Date.now();
      
      await set(newMessageRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName,
        timestamp,
        imageUrl,
        read: false,
      });
      
      // Update last message in userChats
      const recipientId = selectedChat.isGroup ? "" : Object.keys(selectedChat.members || {}).find(id => id !== currentUser.uid);
      
      if (recipientId || selectedChat.isGroup) {
        // Update for sender
        await set(ref(db, `userChats/${currentUser.uid}/${selectedChat.id}/lastMessage`), {
          text: imageUrl ? "Image" : newMessage,
          timestamp,
        });
        
        // Update for receiver or group members
        if (selectedChat.isGroup) {
          // Update for all group members
          Object.keys(selectedChat.members || {}).forEach(async (memberId) => {
            if (memberId !== currentUser.uid) {
              await set(ref(db, `userChats/${memberId}/${selectedChat.id}/lastMessage`), {
                text: imageUrl ? "Image" : newMessage,
                timestamp,
              });
              
              // Increment unread count for group members
              const userChatRef = ref(db, `userChats/${memberId}/${selectedChat.id}`);
              onValue(userChatRef, (snapshot) => {
                const userData = snapshot.val();
                const unreadCount = userData?.unreadCount || 0;
                set(userChatRef, {
                  ...userData,
                  unreadCount: unreadCount + 1,
                });
              }, { onlyOnce: true });
            }
          });
        } else {
          // Update for single recipient
          await set(ref(db, `userChats/${recipientId}/${selectedChat.id}/lastMessage`), {
            text: imageUrl ? "Image" : newMessage,
            timestamp,
          });
          
          // Increment unread count for recipient
          const recipientChatRef = ref(db, `userChats/${recipientId}/${selectedChat.id}`);
          onValue(recipientChatRef, (snapshot) => {
            const userData = snapshot.val();
            const unreadCount = userData?.unreadCount || 0;
            set(recipientChatRef, {
              ...userData,
              unreadCount: unreadCount + 1,
            });
          }, { onlyOnce: true });
        }
      }
      
      // Reset form
      setNewMessage("");
      setSelectedImage(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Group messages by date
  const groupedMessages: { [key: string]: MessageType[] } = {};
  messages.forEach(message => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary-bg">
        <div className="rounded-full bg-primary w-16 h-16 flex items-center justify-center text-white mb-4">
          <i className="fas fa-comments text-3xl"></i>
        </div>
        <h2 className="text-xl font-medium text-text-primary mb-2">Welcome to NetChat</h2>
        <p className="text-text-secondary text-center max-w-md px-6">
          Connect with friends, family, and colleagues. Select a chat to start messaging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat header */}
      <div className="flex items-center p-3 bg-primary-dark text-white">
        <div className="flex-shrink-0 mr-3">
          {selectedChat.isGroup ? (
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-white font-medium">
              <i className="fas fa-users"></i>
            </div>
          ) : (
            <img 
              src={selectedChat.photoURL || "https://via.placeholder.com/100"} 
              className="w-10 h-10 rounded-full object-cover"
              alt={selectedChat.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/100";
              }}
            />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{selectedChat.name}</h3>
          <p className="text-xs opacity-80">
            {selectedChat.isOnline ? "Online" : "Offline"}
          </p>
        </div>
        <div className="flex space-x-4">
          <button><i className="fas fa-search"></i></button>
          <button><i className="fas fa-ellipsis-v"></i></button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-chat-bg"
        style={{
          backgroundImage: "url('https://i.pinimg.com/originals/97/c0/07/97c00759d90d786d9b6096d274ad3e07.png')",
          backgroundSize: "contain",
        }}
      >
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="bg-white px-3 py-1 rounded-full text-xs text-text-secondary">
                {date === new Date().toLocaleDateString() ? "Today" : date}
              </span>
            </div>
            
            {dateMessages.map(message => (
              <Message 
                key={message.id} 
                message={message} 
                isOwnMessage={message.senderId === currentUser?.uid}
              />
            ))}
          </div>
        ))}
        
        {selectedImage && (
          <div className="bg-white p-2 rounded-lg mb-2 max-w-xs mx-auto">
            <div className="relative">
              <img 
                src={URL.createObjectURL(selectedImage)} 
                alt="Selected" 
                className="w-full h-32 object-contain"
              />
              <Button 
                className="absolute top-1 right-1 w-6 h-6 p-0 rounded-full bg-red-500"
                onClick={() => setSelectedImage(null)}
              >
                <i className="fas fa-times text-xs"></i>
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="bg-primary-dark text-white p-2 flex items-center">
        <button className="p-2 rounded-full hover:bg-primary-light transition">
          <i className="far fa-smile"></i>
        </button>
        <button 
          className="p-2 rounded-full hover:bg-primary-light transition"
          onClick={handleAttachImage}
        >
          <i className="fas fa-paperclip"></i>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </button>
        <div className="flex-1 mx-2">
          <Input
            type="text"
            placeholder="Type a message"
            className="w-full py-2 px-3 bg-white text-text-primary rounded-full focus:outline-none"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
        </div>
        <button 
          className="p-2 rounded-full hover:bg-primary-light transition"
          onClick={handleSendMessage}
          disabled={loading}
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className="fas fa-paper-plane"></i>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
