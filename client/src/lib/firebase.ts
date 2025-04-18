import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAoYySL7E7CpiqrMhq6ZUknAlYokEze9oQ",
  authDomain: "newtalentsg-ccaee.firebaseapp.com",
  databaseURL: "https://newtalentsg-ccaee-default-rtdb.firebaseio.com",
  projectId: "newtalentsg-ccaee",
  storageBucket: "newtalentsg-ccaee.firebasestorage.app",
  messagingSenderId: "677114617884",
  appId: "1:677114617884:web:8e5776b45f1163ba67ffd9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Initialize messaging - conditionally for browser support
// Using a function instead of top-level await to avoid TypeScript errors
export let messaging: ReturnType<typeof getMessaging> | null = null;

// Initialize messaging asynchronously
const initializeMessaging = async () => {
  if (await isSupported()) {
    messaging = getMessaging(app);
  }
};

initializeMessaging().catch(error => {
  console.error("Error initializing Firebase messaging:", error);
});

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
