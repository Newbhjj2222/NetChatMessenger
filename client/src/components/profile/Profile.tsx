import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { updateProfile, deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as dbRef, update, remove } from "firebase/database";
import { auth, storage, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";

const Profile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [about, setAbout] = useState("Available");
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleEditProfile = async () => {
    if (!currentUser) return;

    if (isEditing) {
      setLoading(true);
      try {
        await updateProfile(currentUser, {
          displayName,
        });

        // Update in database
        const userRef = dbRef(db, `users/${currentUser.uid}`);
        await update(userRef, {
          username: displayName,
          about,
        });

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully.",
        });
        
        setIsEditing(false);
      } catch (error: any) {
        console.error("Error updating profile:", error);
        toast({
          title: "Update failed",
          description: error.message || "Failed to update profile.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files || !e.target.files[0]) return;
    
    setLoading(true);
    
    try {
      const file = e.target.files[0];
      
      // Upload new profile picture
      const storageRef = ref(storage, `profiles/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Update profile
      await updateProfile(currentUser, {
        photoURL,
      });
      
      // Update in database
      const userRef = dbRef(db, `users/${currentUser.uid}`);
      await update(userRef, {
        photoURL,
      });
      
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile picture:", error);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile picture.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email!,
        password
      );
      
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete user data from database
      await remove(dbRef(db, `users/${currentUser.uid}`));
      await remove(dbRef(db, `userChats/${currentUser.uid}`));
      await remove(dbRef(db, `statuses/${currentUser.uid}`));
      
      // Delete user account
      await deleteUser(currentUser);
      
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete account. Please check your password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-secondary-bg">
      <div className="bg-primary-dark text-white flex items-center p-3">
        <button className="mr-4" onClick={handleGoBack}>
          <i className="fas fa-arrow-left"></i>
        </button>
        <h1 className="text-xl">Profile</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-6 flex flex-col items-center">
          <div className="relative mb-4">
            <img 
              src={currentUser?.photoURL || "https://via.placeholder.com/100"}
              className="w-24 h-24 rounded-full object-cover"
              alt="Profile"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://via.placeholder.com/100";
              }}
            />
            <div 
              className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="fas fa-camera"></i>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfilePictureChange}
                disabled={loading}
              />
            </div>
          </div>
          <h2 className="text-xl font-medium">{currentUser?.displayName}</h2>
        </div>
        
        <div className="mt-4 bg-white">
          <div className="p-4 border-b border-gray-100">
            <p className="text-text-secondary text-sm mb-1">Name</p>
            <div className="flex justify-between items-center">
              {isEditing ? (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 mr-2"
                />
              ) : (
                <p className="font-medium">{currentUser?.displayName}</p>
              )}
              <Button 
                variant="ghost" 
                className="text-primary p-2"
                onClick={handleEditProfile}
                disabled={loading}
              >
                <i className={`fas ${isEditing ? "fa-check" : "fa-pen"}`}></i>
              </Button>
            </div>
          </div>
          
          <div className="p-4">
            <p className="text-text-secondary text-sm mb-1">About</p>
            <div className="flex justify-between items-center">
              {isEditing ? (
                <Input
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="flex-1 mr-2"
                />
              ) : (
                <p>{about}</p>
              )}
              <Button 
                variant="ghost" 
                className="text-primary p-2"
                onClick={handleEditProfile}
                disabled={loading}
              >
                <i className={`fas ${isEditing ? "fa-check" : "fa-pen"}`}></i>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-white">
          <div className="p-4 border-b border-gray-100">
            <p className="text-text-secondary text-sm mb-1">Email</p>
            <p className="font-medium">{currentUser?.email}</p>
          </div>
          
          <div className="p-4">
            <p className="text-text-secondary text-sm mb-1">User ID</p>
            <p className="font-medium">{currentUser?.uid}</p>
          </div>
        </div>
        
        <div className="mt-4 p-4 space-y-2">
          <Button
            className="w-full py-3 bg-primary text-white"
            onClick={() => {
              localStorage.clear();
              logout();
              navigate("/login");
            }}
          >
            Log Out
          </Button>
          
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full py-3 text-red-500 font-medium border border-red-300 bg-white hover:bg-red-50">
                Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-500">Delete Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your messages, statuses, and account information will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-4">
                <p className="text-sm mb-2">Enter your password to confirm:</p>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                />
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  disabled={loading || !password}
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Profile;
