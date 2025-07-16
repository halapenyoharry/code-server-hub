const { exec, spawn } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);

// Path to your prepared code-server instances
const CODE_SERVER_ROOT = '/Users/harold/Projects/code-server';

// Predefined instances
const INSTANCES = {
  '5253': {
    port: 5253,
    name: 'Development',
    description: 'Main development environment',
    workspace: 'workspace',
    icon: '🚀',
    color: '#0099ff'
  },
  '5254': {
    port: 5254,
    name: 'Testing',
    description: 'Testing and experiments',
    workspace: 'workspace',
    icon: '🧪',
    color: '#f59e0b'
  },
  '5255': {
    port: 5255,
    name: 'Production',
    description: 'Stable production code',
    workspace: 'workspace',
    icon: '🏭',
    color: '#10b981'
  }
};

class CodeServerManager {
  constructor() {
    this.instances = new Map();
    this.processes = new Map();
    this.initializeInstances();
  }

  initializeInstances() {
    for (const [port, config] of Object.entries(INSTANCES)) {
      this.instances.set(port, {
        ...config,
        status: 'stopped',
        pid: null,
        lastStarted: null,
        lastStopped: null,
        workspace: path.join(CODE_SERVER_ROOT, `instance-${port}`, config.workspace)
      });
    }
  }

  async getInstanceStatus(port) {
    try {
      const { stdout } = await execPromise(`lsof -i :${port} -P -n | grep LISTEN`);
      if (stdout.trim()) {
        const parts = stdout.trim().split(/\s+/);
        return {
          running: true,
          pid: parts[1],
          process: parts[0]
        };
      }
    } catch (error) {
      // Port not in use
    }
    return { running: false, pid: null, process: null };
  }

  async getAllInstances() {
    const instances = [];
    
    for (const [port, config] of this.instances) {
      const status = await this.getInstanceStatus(port);
      instances.push({
        ...config,
        status: status.running ? 'running' : 'stopped',
        pid: status.pid,
        url: `http://localhost:${port}`,
        lanUrl: `http://${this.getLocalIP()}:${port}`,
        canStart: !status.running,
        canStop: status.running,
        configPath: path.join(CODE_SERVER_ROOT, `instance-${port}`, 'config.yaml'),
        startScript: path.join(CODE_SERVER_ROOT, `instance-${port}`, 'start.sh')
      });
    }
    
    return instances;
  }

  async startInstance(port) {
    const instance = this.instances.get(port);
    if (!instance) {
      throw new Error(`Unknown instance: ${port}`);
    }

    const status = await this.getInstanceStatus(port);
    if (status.running) {
      throw new Error(`Instance ${port} is already running (PID: ${status.pid})`);
    }

    const instanceDir = path.join(CODE_SERVER_ROOT, `instance-${port}`);
    const startScript = path.join(instanceDir, 'start.sh');
    
    // Check if start script exists
    if (!fs.existsSync(startScript)) {
      throw new Error(`Start script not found: ${startScript}`);
    }

    return new Promise((resolve, reject) => {
      const process = spawn('bash', [startScript], {
        cwd: instanceDir,
        detached: true,
        stdio: 'ignore'
      });

      process.unref();
      
      // Give it a moment to start
      setTimeout(async () => {
        const newStatus = await this.getInstanceStatus(port);
        if (newStatus.running) {
          instance.status = 'running';
          instance.pid = newStatus.pid;
          instance.lastStarted = new Date();
          resolve({
            success: true,
            message: `Instance ${port} started successfully`,
            pid: newStatus.pid
          });
        } else {
          reject(new Error(`Failed to start instance ${port}`));
        }
      }, 2000);
    });
  }

  async stopInstance(port) {
    const instance = this.instances.get(port);
    if (!instance) {
      throw new Error(`Unknown instance: ${port}`);
    }

    const status = await this.getInstanceStatus(port);
    if (!status.running) {
      throw new Error(`Instance ${port} is not running`);
    }

    try {
      // Kill the process
      await execPromise(`kill ${status.pid}`);
      
      // Wait a moment and verify it's stopped
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newStatus = await this.getInstanceStatus(port);
      if (newStatus.running) {
        // Force kill if still running
        await execPromise(`kill -9 ${status.pid}`);
      }
      
      instance.status = 'stopped';
      instance.pid = null;
      instance.lastStopped = new Date();
      
      return {
        success: true,
        message: `Instance ${port} stopped successfully`
      };
    } catch (error) {
      throw new Error(`Failed to stop instance ${port}: ${error.message}`);
    }
  }

  async restartInstance(port) {
    try {
      await this.stopInstance(port);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await this.startInstance(port);
    } catch (error) {
      throw new Error(`Failed to restart instance ${port}: ${error.message}`);
    }
  }

  async startAllInstances() {
    const results = [];
    
    for (const port of this.instances.keys()) {
      try {
        const result = await this.startInstance(port);
        results.push({ port, ...result });
      } catch (error) {
        results.push({ port, success: false, error: error.message });
      }
    }
    
    return results;
  }

  async stopAllInstances() {
    const results = [];
    
    for (const port of this.instances.keys()) {
      try {
        const result = await this.stopInstance(port);
        results.push({ port, ...result });
      } catch (error) {
        results.push({ port, success: false, error: error.message });
      }
    }
    
    return results;
  }

  getLocalIP() {
    try {
      const interfaces = require('os').networkInterfaces();
      
      // Prefer Wi-Fi interfaces for iPad access
      const wifiInterfaces = ['en0', 'wlan0', 'Wi-Fi'];
      
      for (const wifiName of wifiInterfaces) {
        if (interfaces[wifiName]) {
          for (const interface of interfaces[wifiName]) {
            if (interface.family === 'IPv4' && !interface.internal) {
              return interface.address;
            }
          }
        }
      }
      
      // Fallback to any non-internal IPv4 address
      for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
          if (interface.family === 'IPv4' && !interface.internal) {
            return interface.address;
          }
        }
      }
    } catch (error) {
      // Fallback
    }
    return 'localhost';
  }

  async getInstanceLogs(port, lines = 50) {
    // This would require capturing logs during startup
    // For now, return basic info
    return {
      port,
      logs: [`Instance ${port} log access not implemented yet`]
    };
  }

  async getWorkspaceInfo(port) {
    const instance = this.instances.get(port);
    if (!instance) {
      throw new Error(`Unknown instance: ${port}`);
    }

    const workspacePath = instance.workspace;
    
    try {
      const stats = fs.statSync(workspacePath);
      const files = fs.readdirSync(workspacePath);
      
      return {
        port,
        workspace: workspacePath,
        exists: true,
        fileCount: files.length,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      return {
        port,
        workspace: workspacePath,
        exists: false,
        error: error.message
      };
    }
  }
}

module.exports = CodeServerManager;
