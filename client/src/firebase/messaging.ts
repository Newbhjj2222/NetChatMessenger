import { getMessaging, getToken, onMessage } from "firebase/messaging";
import app from "./firebase";

// Initialize Firebase Cloud Messaging
export const messaging = getMessaging(app);

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // This should be configured in Firebase
      });
      
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get notification permission:', error);
    return null;
  }
};

// Handle incoming messages when the app is in the foreground
export const setupMessageListener = (callback: (payload: any) => void) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Handle notifications display
export const displayNotification = (title: string, body: string, icon?: string, clickAction?: string) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: icon || '/favicon.ico'
    });
    
    if (clickAction) {
      notification.onclick = () => {
        window.open(clickAction, '_blank');
      };
    }
  }
};
