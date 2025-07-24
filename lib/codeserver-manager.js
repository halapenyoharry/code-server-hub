const { exec, spawn } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);
const ExtensionManager = require('./extension-manager');

// Paths for code-server data and instances
const CODE_SERVER_DATA_ROOT = process.env.CODE_SERVER_DATA_DIR || path.join(require('os').homedir(), 'code-server-data');
const INSTANCES_FILE = path.join(__dirname, '..', 'instances.json');
const SHARED_EXTENSIONS_DIR = path.join(CODE_SERVER_DATA_ROOT, 'shared', 'extensions');
const SHARED_CERTS_DIR = path.join(CODE_SERVER_DATA_ROOT, 'shared', 'certs');
const INSTANCES_DIR = path.join(CODE_SERVER_DATA_ROOT, 'instances');

class CodeServerManager {
  constructor() {
    this.instances = new Map();
    this.processes = new Map();
    this.extensionManager = new ExtensionManager();
    this.loadInstances();
  }

  loadInstances() {
    try {
      const data = fs.readFileSync(INSTANCES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      for (const [port, config] of Object.entries(parsed.instances)) {
        this.instances.set(port, {
          ...config,
          type: config.type || 'code-server', // Default to code-server for backward compatibility
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
    
    // Auto-import disabled - starting fresh with new structure
    // this.importExistingInstances();
  }

  importExistingInstances() {
    try {
      // Check for harold-dev (port 5253)
      const haroldDevDir = path.join(CODE_SERVER_ROOT, 'harold-dev');
      if (fs.existsSync(haroldDevDir) && !this.instances.has('5253')) {
        this.instances.set('5253', {
          port: 5253,
          name: 'Harold Dev',
          description: 'Main development environment with Cline',
          workspace: path.join(haroldDevDir, 'workspace'),
          icon: '🧠',
          color: '#0099ff',
          status: 'stopped',
          pid: null,
          lastStarted: null,
          lastStopped: null
        });
        console.log('Auto-imported harold-dev instance');
      }

      // Check for harold-dev-clone (port 5254 - guessing based on pattern)
      const haroldDevCloneDir = path.join(CODE_SERVER_ROOT, 'harold-dev-clone');
      if (fs.existsSync(haroldDevCloneDir) && !this.instances.has('5254')) {
        this.instances.set('5254', {
          port: 5254,
          name: 'Harold Dev Clone',
          description: 'Clone development environment',
          workspace: path.join(haroldDevCloneDir, 'workspace'),
          icon: '🔄',
          color: '#10b981',
          status: 'stopped',
          pid: null,
          lastStarted: null,
          lastStopped: null
        });
        console.log('Auto-imported harold-dev-clone instance');
      }

      // Check for test instance (instance-5358) - Auto-import existing test
      const testInstanceDir = path.join(CODE_SERVER_ROOT, 'instance-5358');
      if (fs.existsSync(testInstanceDir) && !this.instances.has('5358')) {
        this.instances.set('5358', {
          port: 5358,
          name: 'Test',
          description: 'Test development environment (Claude API)',
          workspace: path.join(testInstanceDir, 'workspace'),
          icon: '🧪',
          color: '#f59e0b',
          status: 'stopped',
          pid: null,
          lastStarted: null,
          lastStopped: null
        });
        console.log('Auto-imported test instance (5358)');
      }

      // Auto-detect any other instance-* directories
      const instanceDirs = fs.readdirSync(CODE_SERVER_ROOT)
        .filter(dir => dir.startsWith('instance-') && dir !== 'instance-5358')
        .map(dir => ({
          name: dir,
          port: dir.replace('instance-', ''),
          path: path.join(CODE_SERVER_ROOT, dir)
        }));

      instanceDirs.forEach(({ name, port, path: instancePath }) => {
        if (!this.instances.has(port) && fs.existsSync(instancePath)) {
          this.instances.set(port, {
            port: parseInt(port),
            name: `Instance ${port}`,
            description: 'Auto-imported instance',
            workspace: path.join(instancePath, 'workspace'),
            icon: '⚡',
            color: '#6b7280',
            status: 'stopped',
            pid: null,
            lastStarted: null,
            lastStopped: null
          });
          console.log(`Auto-imported instance: ${name}`);
        }
      });

      // Save imported instances
      if (this.instances.size > 0) {
        this.saveInstances();
      }
    } catch (error) {
      console.log('Error importing existing instances:', error.message);
    }
  }

  saveInstances() {
    const data = {
      instances: {}
    };
    
    for (const [port, config] of this.instances) {
      data.instances[port] = {
        type: config.type || 'code-server',
        port: config.port,
        name: config.name,
        description: config.description,
        icon: config.icon,
        color: config.color
      };
      
      // Add type-specific fields
      if (config.type === 'gotty') {
        data.instances[port].command = config.command;
      } else {
        data.instances[port].workspace = config.workspace;
      }
    }
    
    fs.writeFileSync(INSTANCES_FILE, JSON.stringify(data, null, 2));
  }

  addInstance(instanceData) {
    const { 
      type = 'code-server',
      port, 
      name, 
      description, 
      workspace, 
      command,
      icon = '⚡', 
      color = '#6b7280' 
    } = instanceData;
    
    if (this.instances.has(port.toString())) {
      throw new Error(`Instance with port ${port} already exists`);
    }

    const instance = {
      type,
      port: parseInt(port),
      name,
      description,
      icon,
      color,
      status: 'stopped',
      pid: null,
      lastStarted: null,
      lastStopped: null
    };

    // Add type-specific fields
    if (type === 'gotty') {
      instance.command = command;
    } else {
      instance.workspace = workspace;
    }

    this.instances.set(port.toString(), instance);
    
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

  async startGoTTYInstance(port, instance) {
    try {
      // Check if ttyd is installed (ARM-compatible alternative to gotty)
      try {
        await execPromise('which ttyd');
      } catch (error) {
        throw new Error('ttyd is not installed. Install it with: brew install ttyd');
      }

      // Build ttyd command
      const command = instance.command || 'bash';
      const ttydCmd = `ttyd -p ${port} -W ${command}`;
      
      console.log(`Starting ttyd on port ${port} with command: ${command}`);
      
      // Start ttyd in background
      const { stdout } = await execPromise(`nohup ${ttydCmd} > /tmp/ttyd-${port}.log 2>&1 & echo $!`);
      const pid = stdout.trim();
      
      // Update instance
      instance.status = 'running';
      instance.pid = pid;
      instance.lastStarted = new Date();
      
      return {
        success: true,
        message: `Terminal instance started on port ${port}`,
        pid
      };
    } catch (error) {
      throw new Error(`Failed to start terminal instance: ${error.message}`);
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
      const protocol = config.type === 'gotty' ? 'http' : 'https';
      instances.push({
        ...config,
        status: status.running ? 'running' : 'stopped',
        pid: status.pid,
        url: `${protocol}://${this.getHostname()}:${port}`,
        lanUrl: `${protocol}://${this.getHostname()}:${port}`,
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

    // Handle GoTTY instances differently
    if (instance.type === 'gotty') {
      return this.startGoTTYInstance(port, instance);
    }

    // Create instance directory if it doesn't exist
    const instanceDir = path.join(INSTANCES_DIR, `instance-${port}`);
    const dataDir = path.join(instanceDir, 'data');
    const configPath = path.join(instanceDir, 'config.yaml');
    
    // Create instance directories
    [instanceDir, dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Use the workspace path directly - NO COPYING!
    const workspaceDir = instance.workspace || '/Users/harold/servers';
    
    // Ensure workspace exists
    if (!fs.existsSync(workspaceDir)) {
      throw new Error(`Workspace directory does not exist: ${workspaceDir}`);
    }

      // Use shared certificates directory
      const userCertsDir = '/Users/harold/servers/code-server/certificates';
      
      // Copy certificates to shared directory if not already there
      if (!fs.existsSync(path.join(SHARED_CERTS_DIR, 'code-server.pem'))) {
        // Ensure shared certs directory exists
        if (!fs.existsSync(SHARED_CERTS_DIR)) {
          fs.mkdirSync(SHARED_CERTS_DIR, { recursive: true });
        }
        
        // Try to copy user certificates to shared directory
        if (fs.existsSync(userCertsDir)) {
          try {
            await execPromise(`cp "${userCertsDir}/code-server.pem" "${SHARED_CERTS_DIR}/" && cp "${userCertsDir}/code-server.key" "${SHARED_CERTS_DIR}/"`);
            console.log(`Copied HTTPS certificates to shared directory`);
          } catch (error) {
            console.log(`Could not copy certificates: ${error.message}`);
          }
        }
      }

    // Ensure default extensions are installed
    await this.extensionManager.ensureDefaultExtensions();
    
    // Check if certificates exist
    const hasUserSSL = fs.existsSync(path.join(SHARED_CERTS_DIR, 'code-server.pem')) && 
                       fs.existsSync(path.join(SHARED_CERTS_DIR, 'code-server.key'));
    
    // Create config.yaml file with HTTPS enabled using shared resources
    const configContent = `bind-addr: 0.0.0.0:${port}
auth: none
${hasUserSSL ? `cert: ${path.join(SHARED_CERTS_DIR, 'code-server.pem')}
cert-key: ${path.join(SHARED_CERTS_DIR, 'code-server.key')}` : 'cert: false'}
user-data-dir: ${dataDir}
extensions-dir: ${SHARED_EXTENSIONS_DIR}
disable-telemetry: true
disable-update-check: true
disable-workspace-trust: true
app-name: "${instance.name || `Instance ${port}`}"
`;
    
    fs.writeFileSync(configPath, configContent);

    return new Promise((resolve, reject) => {
      // Use config file and workspace directory like harold-dev
      const args = [
        '--config', configPath,
        workspaceDir
      ];

      // Create log files for this instance
      const logDir = path.join(CODE_SERVER_DATA_ROOT, 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, `instance-${port}.log`);
      const errorFile = path.join(logDir, `instance-${port}-error.log`);
      
      const out = fs.openSync(logFile, 'a');
      const err = fs.openSync(errorFile, 'a');
      
      const codeServerBin = process.env.CODE_SERVER_BIN || 'code-server';
      const process = spawn(codeServerBin, args, {
        cwd: instanceDir,
        detached: false,
        stdio: ['ignore', out, err]
      });
      
      // Store the process
      this.processes.set(port.toString(), process);
      
      // Handle process exit
      process.on('exit', (code, signal) => {
        console.log(`Code-server instance ${port} exited with code ${code} and signal ${signal}`);
        this.processes.delete(port.toString());
        const instance = this.instances.get(port.toString());
        if (instance) {
          instance.status = 'stopped';
          instance.pid = null;
        }
      });
      
      process.on('error', (error) => {
        console.error(`Code-server instance ${port} error:`, error);
      });
      
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
      // Fallback to hostname
    }
    return require('os').hostname();
  }

  getHostname() {
    try {
      return require('os').hostname();
    } catch (error) {
      // Even if hostname fails, use machine's local name
      return 'lothal.local';
    }
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
