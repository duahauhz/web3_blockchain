import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { startEventListener } from './eventListener.js';
import { gasStationRouter } from './gasStation.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Gas Station API
app.use('/api/gas-station', gasStationRouter);

// Start HTTP Server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Gas Station API: http://localhost:${PORT}/api/gas-station`);
});

// Start WebSocket Server for real-time notifications
const wss = new WebSocketServer({ port: WS_PORT });

console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);

// Store connected clients with their email/address
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substr(2, 9);
  
  console.log(`✅ New WebSocket connection: ${clientId}`);
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Client registers with their email or address
      if (data.type === 'register') {
        clients.set(clientId, {
          ws,
          email: data.email,
          address: data.address,
        });
        console.log(`📝 Client registered: ${data.email || data.address}`);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`❌ Client disconnected: ${clientId}`);
  });
});

// Function to broadcast notifications
export function broadcastNotification(recipientEmail, notification) {
  let sentCount = 0;
  
  for (const [clientId, client] of clients.entries()) {
    if (client.email === recipientEmail) {
      try {
        client.ws.send(JSON.stringify(notification));
        sentCount++;
      } catch (error) {
        console.error(`Failed to send to ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  }
  
  console.log(`📤 Sent notification to ${sentCount} client(s) for ${recipientEmail}`);
  return sentCount;
}

// Start Event Listener
startEventListener(broadcastNotification);

console.log('🎧 Event listener started');
console.log('');
console.log('====================================');
console.log('🎁 Sui Gifting Backend is ready!');
console.log('====================================');
