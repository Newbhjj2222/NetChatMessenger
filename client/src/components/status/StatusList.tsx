import { useState, useEffect, useRef } from "react";
import { ref, onValue, push, set, serverTimestamp } from "firebase/database";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import StatusViewer from "./StatusViewer";

type StatusType = {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  imageUrl: string;
  caption: string;
  timestamp: number;
  viewers: { [key: string]: { viewedAt: number } };
};

const StatusList: React.FC = () => {
  const [myStatuses, setMyStatuses] = useState<StatusType[]>([]);
  const [contactStatuses, setContactStatuses] = useState<{ [key: string]: StatusType[] }>({}); 
  const [selectedStatus, setSelectedStatus] = useState<StatusType | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    // Fetch current user's statuses
    const userStatusesRef = ref(db, `statuses/${currentUser.uid}`);
    const userStatusesUnsubscribe = onValue(userStatusesRef, (snapshot) => {
      const data = snapshot.val();
      const loadedStatuses: StatusType[] = [];
      
      if (data) {
        Object.entries(data).forEach(([id, status]: [string, any]) => {
          // Only include statuses from the last 3 days
          const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
          if (status.timestamp > threeDaysAgo) {
            loadedStatuses.push({
              id,
              userId: currentUser.uid,
              userName: currentUser.displayName || "",
              userPhoto: currentUser.photoURL || "",
              imageUrl: status.imageUrl || "",
              caption: status.caption || "",
              timestamp: status.timestamp,
              viewers: status.viewers || {},
            });
          }
        });
      }
      
      // Sort by timestamp (newest first)
      loadedStatuses.sort((a, b) => b.timestamp - a.timestamp);
      setMyStatuses(loadedStatuses);
    });

    // Fetch contacts' statuses
    const contactsRef = ref(db, `users`);
    const contactsUnsubscribe = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val();
      const contactStatusesTemp: { [key: string]: StatusType[] } = {};
      
      if (data) {
        Object.entries(data).forEach(([userId, userData]: [string, any]) => {
          if (userId !== currentUser.uid) {
            const statusesRef = ref(db, `statuses/${userId}`);
            
            onValue(statusesRef, (statusSnapshot) => {
              const statusData = statusSnapshot.val();
              const userStatuses: StatusType[] = [];
              
              if (statusData) {
                Object.entries(statusData).forEach(([statusId, status]: [string, any]) => {
                  // Only include statuses from the last 3 days
                  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
                  if (status.timestamp > threeDaysAgo) {
                    userStatuses.push({
                      id: statusId,
                      userId,
                      userName: userData.username || "",
                      userPhoto: userData.photoURL || "",
                      imageUrl: status.imageUrl || "",
                      caption: status.caption || "",
                      timestamp: status.timestamp,
                      viewers: status.viewers || {},
                    });
                  }
                });
                
                if (userStatuses.length > 0) {
                  // Sort by timestamp (newest first)
                  userStatuses.sort((a, b) => b.timestamp - a.timestamp);
                  contactStatusesTemp[userId] = userStatuses;
                  setContactStatuses({ ...contactStatusesTemp });
                }
              }
            });
          }
        });
      }
    });

    return () => {
      userStatusesUnsubscribe();
      contactsUnsubscribe();
    };
  }, [currentUser]);

  const handleAddStatus = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files || !e.target.files[0]) return;
    
    setIsUploading(true);
    
    try {
      const file = e.target.files[0];
      
      // Upload image
      const statusRef = storageRef(storage, `statuses/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(statusRef, file);
      const imageUrl = await getDownloadURL(statusRef);
      
      // Add status to database
      const newStatusRef = push(ref(db, `statuses/${currentUser.uid}`));
      await set(newStatusRef, {
        imageUrl,
        caption: "",
        timestamp: Date.now(),
        viewers: {},
      });
    } catch (error) {
      console.error("Error uploading status:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatusClick = (status: StatusType, userId: string) => {
    setSelectedStatus(status);
    setSelectedUserId(userId);
    
    // Mark as viewed if it's not the user's own status
    if (currentUser && userId !== currentUser.uid) {
      const statusRef = ref(db, `statuses/${userId}/${status.id}/viewers/${currentUser.uid}`);
      set(statusRef, {
        viewedAt: Date.now(),
      });
    }
  };

  const closeStatusViewer = () => {
    setSelectedStatus(null);
    setSelectedUserId(null);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    
    return `Today, ${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* My status */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="relative" onClick={handleAddStatus}>
            {myStatuses.length > 0 ? (
              <div 
                className="status-ring-active w-12 h-12 rounded-full p-0.5 cursor-pointer"
                onClick={() => handleStatusClick(myStatuses[0], currentUser!.uid)}
              >
                <img 
                  src={currentUser?.photoURL || "https://via.placeholder.com/100"} 
                  className="w-full h-full rounded-full object-cover"
                  alt="My profile"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/100";
                  }}
                />
              </div>
            ) : (
              <div className="relative cursor-pointer">
                <img 
                  src={currentUser?.photoURL || "https://via.placeholder.com/100"} 
                  className="w-12 h-12 rounded-full border-2 border-gray-200"
                  alt="My profile"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/100";
                  }}
                />
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  <i className="fas fa-plus"></i>
                </div>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
          <div className="ml-3">
            <p className="font-medium">My Status</p>
            <p className="text-text-secondary text-xs">
              {myStatuses.length > 0 
                ? `${myStatuses.length} update${myStatuses.length > 1 ? 's' : ''}` 
                : "Tap to add status update"}
            </p>
          </div>
        </div>
      </div>
      
      {/* Recent updates */}
      {Object.keys(contactStatuses).length > 0 && (
        <>
          <div className="p-2 bg-secondary-bg">
            <p className="text-text-secondary text-xs font-medium px-2">RECENT UPDATES</p>
          </div>
          
          <div className="overflow-y-auto">
            {Object.entries(contactStatuses).map(([userId, statuses]) => (
              <div 
                key={userId}
                className="flex items-center p-3 hover:bg-secondary-bg cursor-pointer"
                onClick={() => handleStatusClick(statuses[0], userId)}
              >
                <div className="relative">
                  <div className="status-ring-active w-12 h-12 rounded-full p-0.5">
                    <img 
                      src={statuses[0].userPhoto || "https://via.placeholder.com/100"} 
                      className="w-full h-full rounded-full object-cover"
                      alt={statuses[0].userName}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://via.placeholder.com/100";
                      }}
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{statuses[0].userName}</p>
                  <p className="text-text-secondary text-xs">{formatTime(statuses[0].timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Status viewer */}
      {selectedStatus && (
        <StatusViewer
          status={selectedStatus}
          userStatuses={selectedUserId === currentUser?.uid 
            ? myStatuses 
            : contactStatuses[selectedUserId!] || []}
          onClose={closeStatusViewer}
          currentUserId={currentUser?.uid || ""}
        />
      )}
    </div>
  );
};

export default StatusList;
