import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "677114617884",
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// Initialize messaging conditionally (disabled for now until VAPID key is provided)
export let messaging: null = null;

// Commented out messaging initialization until VAPID key is available
// const initializeMessaging = async () => {
//   if (await isSupported()) {
//     messaging = getMessaging(app);
//   }
// };
// 
// initializeMessaging().catch(error => {
//   console.error("Error initializing Firebase messaging:", error);
// });

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
