import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";

// WebSocket connections by user ID
const connections: Map<string, WebSocket> = new Map();

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(parseInt(req.params.id));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      await storage.deleteUser(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Handle incoming messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        
        // Handle authentication
        if (data.type === 'auth') {
          const userId = data.userId;
          connections.set(userId, ws);
          console.log(`User ${userId} connected to WebSocket`);
        }
        
        // Handle chat messages
        if (data.type === 'message') {
          // Send to recipient if online
          if (connections.has(data.recipientId)) {
            const recipientWs = connections.get(data.recipientId);
            if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify({
                type: 'message',
                senderId: data.senderId,
                recipientId: data.recipientId,
                text: data.text,
                timestamp: Date.now()
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      // Remove client from connections
      for (const [userId, client] of connections.entries()) {
        if (client === ws) {
          connections.delete(userId);
          console.log(`User ${userId} disconnected from WebSocket`);
          break;
        }
      }
    });
  });

  return httpServer;
}
