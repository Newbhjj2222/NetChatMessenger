import { useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";

// Lazy loaded components
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Home = lazy(() => import("@/pages/Home"));
const Profile = lazy(() => import("@/pages/Profile"));

function Router() {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission();
    }
  }, [currentUser]);

  const requestNotificationPermission = async () => {
    try {
      // Check if browser supports notifications
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return;
      }
      
      // Request permission without FCM (using native browser notifications)
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log("Notification permission granted.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  return (
    <Switch>
      <Route path="/login">
        {currentUser ? (
          <Home />
        ) : (
          <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <Login />
          </Suspense>
        )}
      </Route>
      <Route path="/register">
        {currentUser ? (
          <Home />
        ) : (
          <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <Register />
          </Suspense>
        )}
      </Route>
      <Route path="/profile">
        {currentUser ? (
          <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <Profile />
          </Suspense>
        ) : (
          <Login />
        )}
      </Route>
      <Route path="/">
        {currentUser ? (
          <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
            <Home />
          </Suspense>
        ) : (
          <Login />
        )}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Toaster />
            <Router />
          </WebSocketProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
