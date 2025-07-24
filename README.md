# Code Server Hub 🎛️

A real-time web dashboard for discovering and managing all your local development services, with special powers for code-server instances and web terminals.

## Installation

### Prerequisites

- **Node.js** 16+ and npm
- **code-server** (for VS Code instances): `brew install code-server`
- **ttyd** (for web terminals): `brew install ttyd`
- **macOS** (currently optimized for macOS, Linux support coming)

### Quick Install

```bash
# Clone the repository
git clone https://github.com/halapenyoharry/code-server-hub.git
cd code-server-hub

# Run setup script
./setup.sh

# Start the hub
./start.sh
```

### Manual Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Copy instances template and customize
cp instances.json.example instances.json

# Edit instances.json to configure your workspaces
nano instances.json

# Generate SSL certificates (for HTTPS)
mkdir -p ~/code-server-data/shared/certs
cd ~/code-server-data/shared/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout code-server.key -out code-server.pem \
  -subj "/CN=localhost"

# Start the hub
npm start
```

Then open http://localhost:7777

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
- Self-signed HTTPS for secure access

## Configuration

### Environment Variables

Create a `.env` file:

```bash
PORT=7777                          # Hub port
NODE_ENV=production               # Environment
CODE_SERVER_DATA_DIR=~/code-server-data  # Data directory
CODE_SERVER_BIN=code-server       # Path to code-server
```

### Instance Configuration

Edit `instances.json` to define your code-server instances:

```json
{
  "instances": {
    "5253": {
      "type": "code-server",
      "port": 5253,
      "name": "Main Projects",
      "description": "Primary workspace",
      "icon": "📁",
      "color": "#0099ff",
      "workspace": "/path/to/projects"
    },
    "9923": {
      "type": "gotty",
      "port": 9923,
      "name": "Terminal",
      "description": "Web terminal",
      "icon": "🖥️",
      "color": "#8b5cf6",
      "command": "bash"
    }
  }
}
```

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

## Known Issues

- **SSL Certificate Trust**: VS Code extensions may fail with SSL errors until certificates are manually trusted. See [TODO.md](TODO.md) for details and workaround.

## Tech Stack

- **Backend**: Node.js + Express + Socket.io
- **Frontend**: Vanilla JS with real-time updates
- **Discovery**: System calls (lsof, ps, curl)
- **Monitoring**: systeminformation package

## Contributing

This is the beginning of democratizing service management. Ideas welcome!

## License

This project uses a custom license that's free for personal/educational use but requires permission for commercial use. See [LICENSE](LICENSE) for details.

---

Made with ❤️ and a healthy dose of "why doesn't this already exist?"