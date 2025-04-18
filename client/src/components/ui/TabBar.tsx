import { useState } from "react";

type TabBarProps = {
  onTabChange: (tab: "chats" | "status" | "calls") => void;
};

const TabBar: React.FC<TabBarProps> = ({ onTabChange }) => {
  const [activeTab, setActiveTab] = useState<"chats" | "status" | "calls">("chats");

  const handleTabClick = (tab: "chats" | "status" | "calls") => {
    setActiveTab(tab);
    onTabChange(tab);
  };

  return (
    <div className="flex border-b border-gray-200">
      <button 
        className={`flex-1 py-3 ${activeTab === "chats" ? "text-primary border-b-2 border-primary" : "text-text-secondary"} font-medium`}
        onClick={() => handleTabClick("chats")}
      >
        <i className="fas fa-comments block text-center mb-1"></i>
        Chats
      </button>
      <button 
        className={`flex-1 py-3 ${activeTab === "status" ? "text-primary border-b-2 border-primary" : "text-text-secondary"} font-medium`}
        onClick={() => handleTabClick("status")}
      >
        <i className="fas fa-circle-notch block text-center mb-1"></i>
        Status
      </button>
      <button 
        className={`flex-1 py-3 ${activeTab === "calls" ? "text-primary border-b-2 border-primary" : "text-text-secondary"} font-medium`}
        onClick={() => handleTabClick("calls")}
      >
        <i className="fas fa-phone-alt block text-center mb-1"></i>
        Calls
      </button>
    </div>
  );
};

export default TabBar;
