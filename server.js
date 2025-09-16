const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const { discoverServices, manageCodeServers } = require('./lib/discovery');
const { setupRoutes } = require('./lib/routes');
const CodeServerManager = require('./lib/codeserver-manager');

const app = express();

// Create HTTP server - always use HTTP for hub for simplicity and compatibility
const server = http.createServer(app);

// Socket.io with HTTP server
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Service state
let services = new Map();
let codeServers = new Map();

// Code Server Manager for your prepared instances
const codeServerManager = new CodeServerManager();

// Discover services every 5 seconds
setInterval(async () => {
  try {
    const discovered = await discoverServices();
    services = discovered.services;
    codeServers = discovered.codeServers;
    
    // Get your prepared code-server instances
    const preparedInstances = await codeServerManager.getAllInstances();
    
    // Broadcast updates to all connected clients
    io.emit('services-update', {
      services: Array.from(services.values()),
      codeServers: Array.from(codeServers.values()),
      preparedInstances,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Discovery error:', error);
  }
}, 5000);

// WebSocket connection for real-time updates
io.on('connection', async (socket) => {
  console.log('Client connected');
  
  // Send current state
  const preparedInstances = await codeServerManager.getAllInstances();
  socket.emit('services-update', {
    services: Array.from(services.values()),
    codeServers: Array.from(codeServers.values()),
    preparedInstances,
    timestamp: new Date()
  });
  
  // Handle control commands for discovered services
  socket.on('control-service', async (data) => {
    const { serviceId, action } = data;
    try {
      const result = await manageCodeServers.controlService(serviceId, action);
      socket.emit('control-result', { success: true, result });
    } catch (error) {
      socket.emit('control-result', { success: false, error: error.message });
    }
  });
  
  // Handle code-server instance management
  socket.on('manage-instance', async (data) => {
    const { port, action } = data;
    try {
      let result;
      switch (action) {
        case 'start':
          result = await codeServerManager.startInstance(port);
          break;
        case 'stop':
          result = await codeServerManager.stopInstance(port);
          break;
        case 'restart':
          result = await codeServerManager.restartInstance(port);
          break;
        case 'start-all':
          result = await codeServerManager.startAllInstances();
          break;
        case 'stop-all':
          result = await codeServerManager.stopAllInstances();
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      socket.emit('instance-result', { success: true, result });
      
      // Broadcast updated instances to all clients
      const updatedInstances = await codeServerManager.getAllInstances();
      io.emit('instances-update', { instances: updatedInstances });
      
    } catch (error) {
      socket.emit('instance-result', { success: false, error: error.message });
    }
  });
  
  socket.on('refresh-instances', async () => {
    try {
      const instances = await codeServerManager.getAllInstances();
      socket.emit('instances-update', { instances });
    } catch (error) {
      console.error('Error refreshing instances:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Setup API routes
setupRoutes(app, { services, codeServers, codeServerManager });

// Start server
const PORT = process.env.PORT || 7777;
server.listen(PORT, '0.0.0.0', () => {
  const hostname = require('os').hostname();
  console.log(`
🚀 Code Server Hub running!

Local: http://localhost:${PORT}
Network: http://${hostname}:${PORT}

Features:
✅ Manage YOUR prepared code-server instances (5253, 5254, 5255)
✅ Start/stop/restart individual or all instances
✅ Auto-discovers all other services on your system
✅ Real-time service monitoring with visual dashboard
✅ iPad/mobile-friendly interface
✅ System resource monitoring

Tabs:
📂 Code Servers - Manage your prepared instances
🔍 Discovered Services - View all running services

Note: The hub interface uses HTTP for compatibility.
Code-server instances use HTTPS for security.
  `);
});
