import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Define types for WebSocket messages
type WebSocketMessage = {
  type: 'auth' | 'message' | 'status' | 'typing' | 'read';
  senderId?: string;
  recipientId?: string;
  text?: string;
  timestamp?: number;
  messageId?: string;
};

interface WebSocketContextType {
  sendMessage: (recipientId: string, text: string) => void;
  sendTypingIndicator: (recipientId: string, isTyping: boolean) => void;
  markAsRead: (recipientId: string, messageId: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const WebSocketContext = createContext<WebSocketContextType>({
  sendMessage: () => {},
  sendTypingIndicator: () => {},
  markAsRead: () => {},
  connectionStatus: 'disconnected',
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Only connect to WebSocket if user is authenticated
    if (!currentUser) {
      setConnectionStatus('disconnected');
      return;
    }

    // Connect to WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    
    // Set up event handlers
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setConnectionStatus('connected');
      
      // Authenticate with user ID
      ws.send(JSON.stringify({
        type: 'auth',
        userId: currentUser.uid
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'message':
            // Notification can be handled here
            break;
          case 'typing':
            // Update UI to show typing indicator
            break;
          case 'read':
            // Update message read status
            break;
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnectionStatus('disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [currentUser]);

  // Reconnect if connection is lost
  useEffect(() => {
    if (connectionStatus === 'disconnected' && currentUser) {
      const reconnectTimer = setTimeout(() => {
        console.log('Attempting to reconnect WebSocket...');
        setConnectionStatus('connecting');
      }, 5000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [connectionStatus, currentUser]);

  // Send a chat message
  const sendMessage = (recipientId: string, text: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
      const message: WebSocketMessage = {
        type: 'message',
        senderId: currentUser.uid,
        recipientId,
        text,
        timestamp: Date.now()
      };
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  };

  // Send typing indicator
  const sendTypingIndicator = (recipientId: string, isTyping: boolean) => {
    if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
      const message: WebSocketMessage = {
        type: 'typing',
        senderId: currentUser.uid,
        recipientId,
        timestamp: Date.now()
      };
      socket.send(JSON.stringify(message));
    }
  };

  // Mark message as read
  const markAsRead = (recipientId: string, messageId: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && currentUser) {
      const message: WebSocketMessage = {
        type: 'read',
        senderId: currentUser.uid,
        recipientId,
        messageId,
        timestamp: Date.now()
      };
      socket.send(JSON.stringify(message));
    }
  };

  const value = {
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    connectionStatus
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};