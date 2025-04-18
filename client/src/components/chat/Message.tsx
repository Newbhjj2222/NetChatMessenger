import { format } from "date-fns";

type MessageProps = {
  message: {
    id: string;
    text: string;
    senderId: string;
    timestamp: number;
    senderName: string;
    imageUrl?: string;
    read: boolean;
  };
  isOwnMessage: boolean;
};

const Message: React.FC<MessageProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm");
  };

  return (
    <div className={`flex mb-4 ${isOwnMessage ? "justify-end" : ""}`}>
      <div 
        className={`max-w-[70%] ${isOwnMessage ? "bg-outgoing-msg" : "bg-incoming-msg"} rounded-lg p-3 shadow-sm`}
      >
        {!isOwnMessage && message.senderName && (
          <span className="text-xs text-primary-dark font-medium mb-1 block">
            {message.senderName}
          </span>
        )}
        
        {message.imageUrl && (
          <div className="mb-2 rounded-lg overflow-hidden">
            <img 
              src={message.imageUrl}
              className="w-full h-auto max-h-48 object-contain"
              alt="Message attachment"
            />
          </div>
        )}
        
        {message.text && <p className="text-text-primary">{message.text}</p>}
        
        <div className={`text-right flex items-center ${isOwnMessage ? "justify-end" : ""} space-x-1`}>
          <span className="text-xs text-text-secondary">{formatTime(message.timestamp)}</span>
          
          {isOwnMessage && (
            <i className={`fas fa-check${message.read ? "-double" : ""} text-xs ${message.read ? "text-primary" : "text-text-secondary"}`}></i>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
