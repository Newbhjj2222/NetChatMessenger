import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  User, 
  sendPasswordResetEmail
} from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import app from "./firebase";
import { storage } from "./storage";
import { database } from "./database";
import { ref as dbRef, set } from "firebase/database";

const auth = getAuth(app);

export const registerUser = async (
  email: string, 
  password: string, 
  username: string, 
  profilePicture: File | null
): Promise<User> => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let photoURL = "";
    
    // Upload profile picture if provided
    if (profilePicture) {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, profilePicture);
      photoURL = await getDownloadURL(storageRef);
    }

    // Update profile with username and photo URL
    await updateProfile(user, {
      displayName: username,
      photoURL
    });

    // Create user database entry
    await set(dbRef(database, `users/${user.uid}`), {
      uid: user.uid,
      username,
      email,
      photoURL,
      createdAt: Date.now()
    });

    return user;
  } catch (error) {
    console.error("Error during registration:", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error during logout:", error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw error;
  }
};

export { auth };
