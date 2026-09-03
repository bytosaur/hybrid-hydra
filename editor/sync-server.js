#!/usr/bin/env node
/**
 * Simple WebSocket sync server for live coding editor
 * 
 * Install: npm install ws
 * Run: node sync-server.js
 * 
 * This server relays messages between connected clients in the same room.
 */

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Sync Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store clients by room
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substring(7);
  let currentRoom = null;
  
  console.log(`[${clientId}] Client connected from ${req.socket.remoteAddress}`);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Handle room join
      if (message.type === 'join') {
        const room = message.room || 'default-room';
        currentRoom = room;
        
        // Add client to room
        if (!rooms.has(room)) {
          rooms.set(room, new Set());
        }
        rooms.get(room).add(ws);
        
        console.log(`[${clientId}] Joined room: ${room} (${rooms.get(room).size} clients)`);
        return;
      }
      
      // Broadcast message to all clients in the same room (except sender)
      if (currentRoom && rooms.has(currentRoom)) {
        const roomClients = rooms.get(currentRoom);
        let sent = 0;
        
        roomClients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data);
            sent++;
          }
        });
        
        console.log(`[${clientId}] Relayed ${message.type} to ${sent} clients in room ${currentRoom}`);
      }
    } catch (err) {
      console.error(`[${clientId}] Error processing message:`, err.message);
    }
  });

  ws.on('close', () => {
    // Remove client from room
    if (currentRoom && rooms.has(currentRoom)) {
      rooms.get(currentRoom).delete(ws);
      
      // Clean up empty rooms
      if (rooms.get(currentRoom).size === 0) {
        rooms.delete(currentRoom);
        console.log(`[${clientId}] Room ${currentRoom} deleted (empty)`);
      } else {
        console.log(`[${clientId}] Left room ${currentRoom} (${rooms.get(currentRoom).size} clients remaining)`);
      }
    }
    
    console.log(`[${clientId}] Client disconnected`);
  });

  ws.on('error', (err) => {
    console.error(`[${clientId}] WebSocket error:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket Sync Server listening on port ${PORT}`);
  console.log(`ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
