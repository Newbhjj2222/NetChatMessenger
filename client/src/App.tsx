import { useEffect, lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth } from "./contexts/AuthContext";
import { getToken } from "firebase/messaging";
import { messaging } from "./lib/firebase";

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
      // Check if messaging is available
      if (!messaging) {
        console.log("Firebase messaging is not available in this browser");
        return;
      }
      
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log("Notification permission denied");
        return;
      }
      
      // Check if we have the VAPID key
      if (!import.meta.env.VITE_FIREBASE_VAPID_KEY) {
        console.log("Firebase VAPID key is missing");
        return;
      }
      
      // Get FCM token
      try {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          console.log("Notification permission granted. Token:", token);
          // Here you would typically send this token to your server
        }
      } catch (tokenError) {
        console.error("Error getting token:", tokenError);
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
