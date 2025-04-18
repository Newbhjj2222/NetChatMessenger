import { useState, useEffect } from "react";
import { ref, set } from "firebase/database";
import { db } from "@/lib/firebase";

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

type StatusViewerProps = {
  status: StatusType;
  userStatuses: StatusType[];
  onClose: () => void;
  currentUserId: string;
};

const StatusViewer: React.FC<StatusViewerProps> = ({ 
  status, 
  userStatuses, 
  onClose, 
  currentUserId 
}) => {
  const [currentIndex, setCurrentIndex] = useState(userStatuses.findIndex(s => s.id === status.id));
  const [currentStatus, setCurrentStatus] = useState(status);
  const [reply, setReply] = useState("");
  const [progressWidth, setProgressWidth] = useState<number[]>(userStatuses.map(() => 0));
  
  useEffect(() => {
    // Mark status as viewed if it's not the user's own status
    if (currentUserId && currentStatus.userId !== currentUserId) {
      const statusRef = ref(db, `statuses/${currentStatus.userId}/${currentStatus.id}/viewers/${currentUserId}`);
      set(statusRef, {
        viewedAt: Date.now(),
      });
    }

    // Start progress animation for the current status
    const interval = setInterval(() => {
      setProgressWidth(prev => {
        const newProgress = [...prev];
        if (newProgress[currentIndex] < 100) {
          newProgress[currentIndex] += 2;
        } else {
          // Move to next status when progress completes
          if (currentIndex < userStatuses.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCurrentStatus(userStatuses[currentIndex + 1]);
          } else {
            // Close viewer when all statuses are viewed
            clearInterval(interval);
            onClose();
          }
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, currentStatus, currentUserId, onClose, userStatuses]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    
    // In a real app, you'd send this reply to the status owner
    console.log(`Replying to ${currentStatus.userName}'s status: ${reply}`);
    setReply("");
  };

  const handleNext = () => {
    if (currentIndex < userStatuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentStatus(userStatuses[currentIndex + 1]);
      const newProgress = [...progressWidth];
      newProgress[currentIndex] = 100;
      setProgressWidth(newProgress);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentStatus(userStatuses[currentIndex - 1]);
      const newProgress = [...progressWidth];
      newProgress[currentIndex] = 0;
      setProgressWidth(newProgress);
    }
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

  const countViewers = () => {
    return Object.keys(currentStatus.viewers || {}).length;
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="absolute top-0 left-0 right-0 flex items-center p-4">
        <button className="text-white mr-4" onClick={onClose}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <img 
          src={currentStatus.userPhoto || "https://via.placeholder.com/100"} 
          className="w-10 h-10 rounded-full"
          alt={currentStatus.userName}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://via.placeholder.com/100";
          }}
        />
        <div className="ml-3 text-white">
          <p className="font-medium">{currentStatus.userName}</p>
          <p className="text-xs opacity-80">{formatTime(currentStatus.timestamp)}</p>
        </div>
      </div>
      
      {/* Progress bars for multiple status items */}
      <div className="absolute top-16 left-0 right-0 flex px-4 space-x-1">
        {userStatuses.map((_, index) => (
          <div 
            key={index} 
            className="h-1 bg-white bg-opacity-50 flex-1 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${index < currentIndex ? 100 : (index === currentIndex ? progressWidth[index] : 0)}%` }}
            ></div>
          </div>
        ))}
      </div>
      
      {/* Left/right click areas for navigation */}
      <div className="absolute inset-0 flex" style={{ top: '60px', bottom: '80px' }}>
        <div className="w-1/3 h-full" onClick={handlePrevious}></div>
        <div className="w-1/3 h-full"></div>
        <div className="w-1/3 h-full" onClick={handleNext}></div>
      </div>
      
      {/* Status content */}
      <div className="h-full flex items-center justify-center p-4">
        <img 
          src={currentStatus.imageUrl} 
          alt="Status" 
          className="max-w-full max-h-[70vh] object-contain"
        />
      </div>
      
      {/* Caption if any */}
      {currentStatus.caption && (
        <div className="absolute bottom-20 left-4 right-4 text-white text-center bg-black bg-opacity-50 p-2 rounded">
          {currentStatus.caption}
        </div>
      )}
      
      {/* Reply interface */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <form onSubmit={handleReplySubmit} className="flex items-center bg-white rounded-full overflow-hidden">
          <input 
            type="text" 
            placeholder="Reply to status..." 
            className="flex-1 px-4 py-2 focus:outline-none"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-primary text-white p-2 rounded-full m-1"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </form>
      </div>
      
      {/* Views count - only show for own statuses */}
      {currentStatus.userId === currentUserId && (
        <div className="absolute bottom-20 right-4 bg-black bg-opacity-50 text-white rounded-full px-3 py-1 text-sm">
          <i className="far fa-eye mr-1"></i>
          <span>{countViewers()} views</span>
        </div>
      )}
    </div>
  );
};

export default StatusViewer;
