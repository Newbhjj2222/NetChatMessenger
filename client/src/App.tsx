import { useEffect, lazy, Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { ChatProvider } from "./contexts/ChatContext";

// Lazy loaded components
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Home = lazy(() => import("@/pages/Home"));
const Profile = lazy(() => import("@/pages/Profile"));

// Loading component
const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading NetChat...</p>
    </div>
  </div>
);

// Route wrapper with authentication
function RouteManager() {
  const { currentUser, loading } = useAuth();
  const [, navigate] = useLocation();
  
  // Handle notifications
  useEffect(() => {
    if (currentUser) {
      requestNotificationPermission();
    }
  }, [currentUser]);

  const requestNotificationPermission = async () => {
    try {
      if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return;
      }
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log("Notification permission granted.");
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // Redirect based on auth state
  useEffect(() => {
    if (!loading) {
      const pathname = window.location.pathname;
      const isAuthRoute = pathname === "/login" || pathname === "/register";
      
      if (!currentUser && !isAuthRoute) {
        navigate("/login");
      } else if (currentUser && isAuthRoute) {
        navigate("/");
      }
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Switch>
      <Route path="/login">
        <Suspense fallback={<LoadingScreen />}>
          <Login />
        </Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<LoadingScreen />}>
          <Register />
        </Suspense>
      </Route>
      <Route path="/profile">
        {currentUser ? (
          <Suspense fallback={<LoadingScreen />}>
            <Profile />
          </Suspense>
        ) : (
          <LoadingScreen />
        )}
      </Route>
      <Route path="/">
        {currentUser ? (
          <Suspense fallback={<LoadingScreen />}>
            <Home />
          </Suspense>
        ) : (
          <LoadingScreen />
        )}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ChatProvider>
            <WebSocketProvider>
              <Toaster />
              <RouteManager />
            </WebSocketProvider>
          </ChatProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
