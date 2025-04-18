import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ref, get, onValue, onDisconnect, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import TabBar from "@/components/ui/TabBar";
import ChatList from "@/components/chat/ChatList";
import ChatBox from "@/components/chat/ChatBox";
import StatusList from "@/components/status/StatusList";
import CallsList from "@/components/calls/CallsList";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "calls">("chats");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser } = useAuth();
  const [, navigate] = useLocation();

  // Set user as online when they open the app
  useEffect(() => {
    if (!currentUser) return;
    
    const userStatusRef = ref(db, `users/${currentUser.uid}/status`);
    
    // Set user as online
    set(userStatusRef, "online");
    
    // Set up disconnect handler
    const connectedRef = ref(db, `users/${currentUser.uid}`);
    onDisconnect(connectedRef).update({
      status: "offline",
      lastSeen: new Date().toISOString()
    });

    // Clean up
    return () => {
      set(userStatusRef, "offline");
    };
  }, [currentUser]);

  // Check for invitation link in URL
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const inviteCode = queryParams.get("invite");
    
    if (inviteCode && currentUser) {
      // Process invitation
      const inviteRef = ref(db, `invites/${inviteCode}`);
      get(inviteRef).then((snapshot) => {
        const invite = snapshot.val();
        if (invite) {
          // Join the chat or group
          const chatId = invite.chatId;
          const userChatsRef = ref(db, `userChats/${currentUser.uid}/${chatId}`);
          set(userChatsRef, {
            name: invite.chatName,
            photoURL: invite.chatPhoto || "",
            isGroup: invite.isGroup || false,
            timestamp: Date.now(),
            unreadCount: 0
          });
          
          // If it's a group, add user to group members
          if (invite.isGroup) {
            const chatMembersRef = ref(db, `chats/${chatId}/members/${currentUser.uid}`);
            set(chatMembersRef, {
              role: "member",
              joinedAt: Date.now()
            });
          }
        }
      });
    }
  }, [currentUser]);

  const handleTabChange = (tab: "chats" | "status" | "calls") => {
    setActiveTab(tab);
  };

  const generateInviteLink = () => {
    if (!currentUser) return;
    
    const inviteCode = Math.random().toString(36).substring(2, 10);
    const inviteRef = ref(db, `invites/${inviteCode}`);
    
    set(inviteRef, {
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Generate a shareable link
    const link = `${window.location.origin}?invite=${inviteCode}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(link)
      .then(() => {
        alert("Invitation link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        alert(`Your invitation link: ${link}`);
      });
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Left Sidebar - Chats, Status, and Calls tabs */}
      <div id="sidebar" className={`w-full md:w-1/3 lg:w-1/4 flex flex-col border-r border-gray-200 ${activeTab !== "chats" || window.innerWidth >= 768 ? "" : "hidden"}`}>
        {/* Header with profile and navigation */}
        <div className="bg-primary-dark text-white flex items-center justify-between p-3">
          <div className="text-xl font-bold">NetChat</div>
          <div className="flex items-center space-x-4">
            <button className="p-1">
              <i className="fas fa-search text-white"></i>
            </button>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger className="p-1">
                <i className="fas fa-ellipsis-v text-white"></i>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={generateInviteLink}>
                  Invite Friend
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Tabs navigation */}
        <TabBar onTabChange={handleTabChange} />
        
        {/* Tab content */}
        {activeTab === "chats" && <ChatList />}
        {activeTab === "status" && <StatusList />}
        {activeTab === "calls" && <CallsList />}
      </div>
      
      {/* Chat content area */}
      <div 
        id="chat-content" 
        className={`${(activeTab !== "chats" || window.innerWidth < 768) ? "hidden" : "flex"} flex-1 flex-col`}
      >
        <ChatBox />
      </div>
      
      {/* Status tab content - only shown when status tab is active */}
      {activeTab === "status" && window.innerWidth >= 768 && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-secondary-bg">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <i className="fas fa-circle-notch text-2xl"></i>
              </div>
              <h2 className="text-xl font-medium text-text-primary mb-2">Status Updates</h2>
              <p className="text-text-secondary">
                Select a status from the left to view it here
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Calls tab content - only shown when calls tab is active */}
      {activeTab === "calls" && window.innerWidth >= 768 && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-secondary-bg">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mx-auto mb-4">
                <i className="fas fa-phone-alt text-2xl"></i>
              </div>
              <h2 className="text-xl font-medium text-text-primary mb-2">Call History</h2>
              <p className="text-text-secondary">
                Select a call from the left to initiate a new call
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
