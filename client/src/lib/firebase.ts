import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Initialize messaging - conditionally for browser support
export let messaging: ReturnType<typeof getMessaging> | null = null;

// Initialize messaging asynchronously
const initializeMessaging = async () => {
  if (await isSupported()) {
    messaging = getMessaging(app);
  }
};

initializeMessaging();

// Data cleanup functions
export const setupDataCleanup = () => {
  // Function to clean up messages older than 10 days
  const cleanupMessages = () => {
    const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000;
    // Cleanup logic will be implemented on server side
    console.log("Cleaning up messages older than", new Date(tenDaysAgo));
  };

  // Function to clean up statuses older than 3 days
  const cleanupStatuses = () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    // Cleanup logic will be implemented on server side
    console.log("Cleaning up statuses older than", new Date(threeDaysAgo));
  };

  // Run cleanup periodically
  setInterval(cleanupMessages, 12 * 60 * 60 * 1000); // Every 12 hours
  setInterval(cleanupStatuses, 12 * 60 * 60 * 1000); // Every 12 hours
};

export default app;
