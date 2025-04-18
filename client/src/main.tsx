import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <ChatProvider>
      <App />
    </ChatProvider>
  </AuthProvider>
);
