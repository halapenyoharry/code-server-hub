# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm install          # Install all dependencies
npm run dev          # Start development server with auto-reload (nodemon)
npm start            # Start production server
npm run setup        # Run initial setup (creates .env file)

# Alternative startup scripts
./start-dev.sh       # Development mode with environment setup
./start.sh           # Production mode
./setup.sh           # Initial project setup
```

### Testing & Quality
```bash
# Currently no test suite configured
# TODO: Add jest for unit testing
# TODO: Add eslint for code linting
```

### Service Management
```bash
# Check if service is running
lsof -i :7777        # Check default port
ps aux | grep "node.*server.js"  # Find process

# Stop service
pkill -f "node.*server.js"
```

## Architecture Overview

Code Server Hub is a Node.js application that discovers and manages local development services through a web interface.

### Core Components

**Backend Architecture**
- `server.js`: Express server with Socket.io for real-time updates
- `lib/discovery.js`: Service discovery engine that scans common development ports
- `lib/routes.js`: REST API endpoints for service management
- `lib/codeserver-manager.js`: Specialized handling for code-server instances

**Frontend Architecture**
- `public/index.html`: Single-page application interface
- `public/app.js`: Vanilla JavaScript with Socket.io client for real-time updates

### Service Discovery Pattern
The discovery engine (`lib/discovery.js`) uses multiple strategies:
1. Port scanning on common development ports (3000-9999, specific ranges)
2. Process inspection via `ps` and `lsof` commands
3. HTTP probing to identify service types
4. WebSocket connections for real-time status updates

### Real-time Communication
- Socket.io manages bidirectional communication
- Events: `services-update`, `service-start`, `service-stop`
- Automatic reconnection and state synchronization

### Configuration
Environment variables (`.env`):
- `PORT`: Server port (default: 7777)
- `NODE_ENV`: Environment mode (development/production)
- Additional service-specific configs can be added

## Development Workflow

### Adding New Service Types
1. Update `lib/discovery.js` to add detection logic
2. Add service-specific handling in `lib/routes.js` if needed
3. Update frontend (`public/app.js`) for custom UI elements
4. Test discovery with the new service running

### API Endpoints
- `GET /api/services`: List all discovered services
- `POST /api/services/:id/start`: Start a service
- `POST /api/services/:id/stop`: Stop a service
- `GET /api/system-info`: System resource information
- WebSocket: Real-time service updates on connection

### Port Allocation Strategy
The hub scans these port ranges:
- 3000-3010: Common Node.js apps
- 4000-4010: Alternative Node.js range
- 5000-5010: Python Flask/FastAPI
- 8000-8010: Django/Python servers
- 8080-8090: Alternative HTTP servers
- 8443: HTTPS development
- 9000-9010: PHP/Other services

## Important Patterns

### Error Handling
- All async operations use try-catch blocks
- Process operations fail gracefully with user-friendly messages
- Network errors trigger automatic retry mechanisms

### Security Considerations
- Binds to 0.0.0.0 for network accessibility (configurable)
- No authentication by default (suitable for local development)
- Process management requires appropriate system permissions

### Performance
- Service discovery runs every 5 seconds
- Caches service information to reduce system calls
- WebSocket reduces polling overhead for real-time updates

## Future Enhancements Planned
- AI-powered service identification and configuration
- Service dependency mapping
- Automated service health checks
- Docker container discovery
- Remote server management capabilities