# Code Server Hub

A real-time web UI for discovering and managing all your local development services, with special focus on code-server instances.

## Features

🔍 **Auto-Discovery**
- Scans common development ports automatically
- Identifies service types (code-server, databases, web servers, etc.)
- Updates in real-time via WebSocket

📊 **Visual Dashboard**
- Beautiful web UI accessible from any device
- System resource monitoring (CPU, Memory, Network)
- Service categorization with icons

🎮 **Service Control**
- Start/stop services from the UI
- Open code-server instances with one click
- View detailed service information

🌐 **Network Ready**
- Access from iPad, phone, or any device
- Real-time updates across all connected clients
- No authentication needed (for local network use)

## Quick Start

```bash
cd ~/servers/code-server-hub
chmod +x setup.sh
./setup.sh
./start.sh
```

Then open http://localhost:7777

## Architecture

This is the foundation for the larger vision:
- Currently: Discovers and manages code-server instances
- Future: Universal service discovery and management
- Eventually: AI-powered service interpretation and automation

## How It Works

1. **Service Discovery**: Scans common ports every 5 seconds
2. **Process Identification**: Uses `lsof` to identify what's running
3. **Type Detection**: Pattern matching to categorize services
4. **Real-time Updates**: WebSocket broadcasts changes to all clients
5. **Visual Interface**: Modern web UI with real-time updates

## Extending

The modular design makes it easy to add:
- New service types in `SERVICE_PATTERNS`
- Additional ports in `COMMON_PORTS`
- Custom actions for different service types
- AI integration for service interpretation

## Future Vision

This is step 1 of making the invisible visible:
- Add MCP server discovery
- Integrate AI for explaining unknown services
- Add service relationship mapping
- Create visual dependency graphs
- Enable cross-service orchestration

## Tech Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JS with real-time updates
- **Discovery**: System calls (lsof, ps, curl)
- **Monitoring**: systeminformation package

## Contributing

This is the beginning of democratizing service management. Ideas welcome!
