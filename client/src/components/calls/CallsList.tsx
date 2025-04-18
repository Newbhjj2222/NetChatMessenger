import { useState, useEffect } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

type CallType = {
  id: string;
  caller: {
    id: string;
    name: string;
    photoURL: string;
  };
  receiver: {
    id: string;
    name: string;
    photoURL: string;
  };
  type: "audio" | "video";
  timestamp: number;
  duration: number;
  status: "missed" | "received" | "dialed";
};

const CallsList: React.FC = () => {
  const [calls, setCalls] = useState<CallType[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const callsRef = ref(db, `calls/${currentUser.uid}`);
    const unsubscribe = onValue(callsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedCalls: CallType[] = [];
      
      if (data) {
        Object.entries(data).forEach(([id, call]: [string, any]) => {
          loadedCalls.push({
            id,
            caller: call.caller,
            receiver: call.receiver,
            type: call.type,
            timestamp: call.timestamp,
            duration: call.duration,
            status: call.status,
          });
        });
      }
      
      // Sort by timestamp (newest first)
      loadedCalls.sort((a, b) => b.timestamp - a.timestamp);
      setCalls(loadedCalls);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatCallTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  const createCallLink = () => {
    if (!currentUser) return;
    
    const callLinkId = Math.random().toString(36).substring(2, 8);
    const callLinkRef = ref(db, `callLinks/${callLinkId}`);
    
    set(callLinkRef, {
      createdBy: currentUser.uid,
      createdAt: Date.now(),
      active: true
    });
    
    // Generate a shareable link
    const link = `${window.location.origin}?callLink=${callLinkId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(link)
      .then(() => {
        alert("Call link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        alert(`Your call link: ${link}`);
      });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div 
          className="flex items-center p-4 border-b border-gray-100 cursor-pointer"
          onClick={createCallLink}
        >
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <i className="fas fa-link"></i>
          </div>
          <div className="ml-4 flex-1">
            <p className="font-medium">Create call link</p>
            <p className="text-text-secondary text-sm">Share a link for your NetChat call</p>
          </div>
        </div>
        
        <div className="p-2 bg-secondary-bg">
          <p className="text-text-secondary text-xs font-medium px-2">RECENT</p>
        </div>
        
        {calls.length > 0 ? (
          calls.map((call) => {
            const isOutgoing = call.status === "dialed";
            const contact = isOutgoing ? call.receiver : call.caller;
            
            return (
              <div 
                key={call.id} 
                className="flex items-center p-3 hover:bg-secondary-bg border-b border-gray-100"
              >
                <img 
                  src={contact.photoURL || "https://via.placeholder.com/100"} 
                  className="w-12 h-12 rounded-full object-cover"
                  alt={contact.name}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/100";
                  }}
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{contact.name}</h3>
                  </div>
                  <div className="flex items-center text-text-secondary">
                    <i className={`fas fa-arrow-${isOutgoing ? "up text-green-500" : "down text-red-500"} mr-1`}></i>
                    <span className="text-sm">{formatCallTime(call.timestamp)}</span>
                  </div>
                </div>
                <button className="text-primary">
                  <i className={`fas fa-${call.type === "audio" ? "phone" : "video"}`}></i>
                </button>
              </div>
            );
          })
        ) : (
          <div className="p-4 text-center text-text-secondary">
            No recent calls
          </div>
        )}
      </div>
    </div>
  );
};

export default CallsList;
