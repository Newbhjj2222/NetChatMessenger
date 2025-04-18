import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ref as dbRef, set } from "firebase/database";
import { storage, db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Logo from "@/components/ui/Logo";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user
      await register(email, password, username);
      
      navigate("/");
      toast({
        title: "Registration successful",
        description: "Welcome to NetChat!",
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-primary-dark">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <Logo size="medium" />
          <h1 className="text-2xl font-bold text-primary">Create Account</h1>
          <p className="text-text-secondary text-sm mt-1">Join NetChat today</p>
        </div>
        
        <form className="space-y-4" onSubmit={handleRegister}>
          <div className="flex justify-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-primary flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} className="object-cover w-full h-full" alt="Profile preview" />
                ) : (
                  <i className="fas fa-user text-gray-400 text-3xl"></i>
                )}
              </div>
              <div 
                className="absolute bottom-0 right-0 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <i className="fas fa-camera"></i>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-text-secondary mb-1">Username</Label>
            <Input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Choose a username"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reg-email" className="text-sm font-medium text-text-secondary mb-1">Email</Label>
            <Input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reg-password" className="text-sm font-medium text-text-secondary mb-1">Password</Label>
            <Input
              type="password"
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Create a password"
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-dark transition duration-200"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Already have an account? 
            <Button 
              type="button" 
              variant="link" 
              className="text-primary font-medium"
              onClick={goToLogin}
            >
              Log In
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
