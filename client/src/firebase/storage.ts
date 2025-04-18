import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import app from "./firebase";

export const storage = getStorage(app);

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  return await uploadImage(file, `profilePictures/${userId}`);
};

export const uploadMessageImage = async (chatId: string, file: File): Promise<string> => {
  const filename = `${Date.now()}_${file.name}`;
  return await uploadImage(file, `chatImages/${chatId}/${filename}`);
};

export const uploadGroupImage = async (groupId: string, file: File): Promise<string> => {
  return await uploadImage(file, `groupImages/${groupId}`);
};

export const uploadStatusImage = async (userId: string, file: File): Promise<string> => {
  const filename = `${Date.now()}_${file.name}`;
  return await uploadImage(file, `statusImages/${userId}/${filename}`);
};

export const deleteImage = async (path: string): Promise<void> => {
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};
