const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const net = require('net');

// Common development ports to scan
const COMMON_PORTS = {
  // Code servers
  'code-server': [8080, 8443, 3000, 8089, 8090, 8091, 5253, 5254, 5255],
  // Web servers
  'web': [80, 443, 8000, 8001, 3000, 3001, 5000, 5001, 4200, 9000],
  // Databases
  'database': [5432, 3306, 27017, 6379, 9200, 5984],
  // Development tools
  'dev-tools': [9229, 9230, 6006, 4200, 3000, 8081, 19000, 19001],
  // MCP and AI services
  'ai-services': [11434, 8765, 9999, 7860, 7861]
};

// Service identification patterns
const SERVICE_PATTERNS = {
  'code-server': /code-server|vscode/i,
  'postgresql': /postgres|postgresql/i,
  'mysql': /mysql|mariadb/i,
  'mongodb': /mongod|mongodb/i,
  'redis': /redis-server/i,
  'docker': /docker|containerd/i,
  'node': /node|npm|yarn/i,
  'python': /python|pip|django|flask/i,
  'mcp': /mcp-server|modelcontext/i,
  'ollama': /ollama/i,
  'jupyter': /jupyter/i
};

class ServiceDiscovery {
  constructor() {
    this.services = new Map();
    this.codeServers = new Map();
  }

  async scanPort(port, host = 'localhost') {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(300);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  async identifyService(port) {
    try {
      // Try to get process info using lsof
      const { stdout } = await execPromise(`lsof -i :${port} -P -n | grep LISTEN | head -1`);
      
      if (!stdout) return null;
      
      const parts = stdout.trim().split(/\s+/);
      const command = parts[0];
      const pid = parts[1];
      
      // Get more detailed info
      const { stdout: psInfo } = await execPromise(`ps -p ${pid} -o command= 2>/dev/null || echo ""`);
      
      // Try HTTP probe for web services
      let httpInfo = null;
      try {
        const { stdout: curlOut } = await execPromise(
          `curl -s -m 1 -H "Accept: application/json" http://localhost:${port}/ | head -c 500`
        );
        if (curlOut) httpInfo = curlOut;
      } catch (e) {
        // Not HTTP or failed
      }
      
      return {
        port,
        pid,
        command,
        fullCommand: psInfo.trim(),
        httpResponse: httpInfo,
        type: this.identifyServiceType(command, psInfo, httpInfo)
      };
    } catch (error) {
      return null;
    }
  }

  identifyServiceType(command, fullCommand, httpResponse) {
    const combined = `${command} ${fullCommand} ${httpResponse || ''}`.toLowerCase();
    
    // Check patterns
    for (const [type, pattern] of Object.entries(SERVICE_PATTERNS)) {
      if (pattern.test(combined)) {
        return type;
      }
    }
    
    // Check for code-server specifically
    if (combined.includes('code-server') || 
        (httpResponse && httpResponse.includes('vscode'))) {
      return 'code-server';
    }
    
    return 'unknown';
  }

  async getAllNetworkInterfaces() {
    const interfaces = require('os').networkInterfaces();
    const hosts = ['localhost', '127.0.0.1'];
    
    // Add all non-internal IPv4 addresses
    for (const interfaceName of Object.keys(interfaces)) {
      for (const interface of interfaces[interfaceName]) {
        if (interface.family === 'IPv4' && !interface.internal) {
          hosts.push(interface.address);
        }
      }
    }
    
    return hosts;
  }

  async discoverAllServices() {
    const discovered = {
      services: new Map(),
      codeServers: new Map()
    };
    
    // Get all network interfaces
    const hosts = await this.getAllNetworkInterfaces();
    const allPorts = [...new Set(Object.values(COMMON_PORTS).flat())];
    
    console.log(`Scanning ${allPorts.length} ports across ${hosts.length} network interfaces...`);
    
    for (const host of hosts) {
      for (const port of allPorts) {
        if (await this.scanPort(port, host)) {
          const serviceInfo = await this.identifyService(port);
          
          if (serviceInfo) {
            const serviceId = `service-${host}-${port}`;
            const service = {
              id: serviceId,
              host,
              port,
              ...serviceInfo,
              status: 'running',
              url: `http://${host}:${port}`,
              lastSeen: new Date(),
              metadata: await this.getServiceMetadata(serviceInfo)
            };
            
            if (serviceInfo.type === 'code-server') {
              discovered.codeServers.set(service.id, {
                ...service,
                workspace: await this.getCodeServerWorkspace(port),
                extensions: await this.getCodeServerExtensions(port)
              });
            }
            
            discovered.services.set(service.id, service);
          }
        }
      }
    }
    
    return discovered;
  }

  async getServiceMetadata(serviceInfo) {
    const metadata = {
      description: this.generateDescription(serviceInfo),
      icon: this.getServiceIcon(serviceInfo.type),
      category: this.getServiceCategory(serviceInfo.type),
      actions: this.getAvailableActions(serviceInfo.type)
    };
    
    return metadata;
  }

  generateDescription(serviceInfo) {
    const descriptions = {
      'code-server': 'VS Code in the browser - full development environment',
      'postgresql': 'PostgreSQL database server',
      'mysql': 'MySQL database server',
      'mongodb': 'MongoDB NoSQL database',
      'redis': 'Redis in-memory data store',
      'docker': 'Docker container runtime',
      'node': 'Node.js application',
      'python': 'Python application',
      'mcp': 'Model Context Protocol server',
      'ollama': 'Local LLM inference server',
      'jupyter': 'Jupyter notebook server',
      'unknown': 'Unknown service'
    };
    
    return descriptions[serviceInfo.type] || descriptions.unknown;
  }

  getServiceIcon(type) {
    const icons = {
      'code-server': '💻',
      'postgresql': '🐘',
      'mysql': '🐬',
      'mongodb': '🍃',
      'redis': '⚡',
      'docker': '🐳',
      'node': '💚',
      'python': '🐍',
      'mcp': '🤖',
      'ollama': '🦙',
      'jupyter': '📓',
      'unknown': '❓'
    };
    
    return icons[type] || icons.unknown;
  }

  getServiceCategory(type) {
    const categories = {
      'code-server': 'Development',
      'postgresql': 'Database',
      'mysql': 'Database',
      'mongodb': 'Database',
      'redis': 'Database',
      'docker': 'Infrastructure',
      'node': 'Runtime',
      'python': 'Runtime',
      'mcp': 'AI/ML',
      'ollama': 'AI/ML',
      'jupyter': 'Development',
      'unknown': 'Other'
    };
    
    return categories[type] || categories.unknown;
  }

  getAvailableActions(type) {
    const baseActions = ['stop', 'restart', 'view-logs'];
    
    const typeSpecificActions = {
      'code-server': ['open', 'manage-extensions', 'view-workspace'],
      'postgresql': ['open-admin', 'backup', 'query'],
      'mcp': ['view-tools', 'test-connection'],
      'ollama': ['list-models', 'pull-model']
    };
    
    return [...baseActions, ...(typeSpecificActions[type] || [])];
  }

  async getCodeServerWorkspace(port) {
    // Try to get workspace info
    try {
      const { stdout } = await execPromise(
        `curl -s http://localhost:${port}/vscode-remote-resource 2>/dev/null | head -c 100`
      );
      return stdout || 'Unknown workspace';
    } catch (e) {
      return 'Unknown workspace';
    }
  }

  async getCodeServerExtensions(port) {
    // This would need code-server API access
    return [];
  }
}

// Control functions
const controlService = async (serviceId, action) => {
  const port = serviceId.split('-')[1];
  
  switch (action) {
    case 'stop':
      await execPromise(`lsof -ti:${port} | xargs kill -9`);
      return { message: `Stopped service on port ${port}` };
      
    case 'open':
      await execPromise(`open http://localhost:${port}`);
      return { message: `Opened service in browser` };
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

// Export functions
const discovery = new ServiceDiscovery();

module.exports = {
  discoverServices: () => discovery.discoverAllServices(),
  manageCodeServers: {
    controlService
  }
};
