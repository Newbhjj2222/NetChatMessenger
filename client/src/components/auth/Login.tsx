import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Logo from "@/components/ui/Logo";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    navigate("/register");
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6 bg-primary-dark">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Logo size="large" />
          <h1 className="text-2xl font-bold text-primary">NetChat</h1>
          <p className="text-text-secondary text-sm mt-2">Connect with friends and family</p>
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-text-secondary mb-1">Email</Label>
            <Input 
              type="email" 
              id="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="Enter your email" 
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-text-secondary mb-1">Password</Label>
            <Input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" 
              placeholder="Enter your password" 
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-dark transition duration-200"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-secondary">
            Don't have an account? 
            <Button 
              type="button" 
              variant="link" 
              className="text-primary font-medium"
              onClick={goToRegister}
            >
              Register
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
