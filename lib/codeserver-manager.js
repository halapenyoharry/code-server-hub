const { exec, spawn } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);

// Path to your prepared code-server instances
const CODE_SERVER_ROOT = '/Users/harold/Projects/code-server';
const INSTANCES_FILE = path.join(__dirname, '..', 'instances.json');

class CodeServerManager {
  constructor() {
    this.instances = new Map();
    this.processes = new Map();
    this.loadInstances();
  }

  loadInstances() {
    try {
      const data = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      for (const [port, config] of Object.entries(parsed.instances)) {
        this.instances.set(port, {
          ...config,
          status: 'stopped',
          pid: null,
          lastStarted: null,
          lastStopped: null
        });
      }
    } catch (error) {
      console.log('No instances file found or error reading:', error.message);
      // Start with empty instances
    }
  }

  saveInstances() {
    const data = {
      instances: {}
    };
    
    for (const [port, config] of this.instances) {
      data.instances[port] = {
        port: config.port,
        name: config.name,
        description: config.description,
        workspace: config.workspace,
        icon: config.icon,
        color: config.color
      };
    }
    
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(data, null, 2));
  }

  addInstance(instanceData) {
    const { port, name, description, workspace, icon = '⚡', color = '#6b7280' } = instanceData;
    
    if (this.instances.has(port.toString())) {
      throw new Error(`Instance with port ${port} already exists`);
    }

    this.instances.set(port.toString(), {
      port: parseInt(port),
      name,
      description,
      workspace,
      icon,
      color,
      status: 'stopped',
      pid: null,
      lastStarted: null,
      lastStopped: null
    });
    
    this.saveInstances();
    return { success: true, message: `Instance ${name} added successfully` };
  }

  removeInstance(port) {
    if (!this.instances.has(port.toString())) {
      throw new Error(`Instance with port ${port} not found`);
    }

    this.instances.delete(port.toString());
    this.saveInstances();
    return { success: true, message: `Instance on port ${port} removed successfully` };
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
        canStop: status.running
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

    // Create workspace directory if it doesn't exist
    const workspaceDir = instance.workspace;
    if (!fs.existsSync(workspaceDir)) {
      fs.mkdirSync(workspaceDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const args = [
        '--bind-addr', `0.0.0.0:${port}`,
        '--auth', 'none',
        '--extensions-dir', path.join(CODE_SERVER_ROOT, 'master', 'extensions'),
        '--user-data-dir', path.join(CODE_SERVER_ROOT, 'master', 'user-data'),
        workspaceDir
      ];

      const process = spawn('code-server', args, {
        cwd: workspaceDir,
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
          for (const iface of interfaces[wifiName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
              return iface.address;
            }
          }
        }
      }
      
      // Fallback to any non-internal IPv4 address
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
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
