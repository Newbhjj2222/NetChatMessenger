import { initializeApp } from "firebase/app";

// Firebase configuration from the uploaded content
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

export default app;
