const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);

const SHARED_EXTENSIONS_DIR = path.join(
  process.env.CODE_SERVER_DATA_DIR || path.join(require('os').homedir(), 'code-server-data'),
  'shared',
  'extensions'
);
const DEFAULT_EXTENSIONS_FILE = path.join(__dirname, '..', 'default-extensions.json');

class ExtensionManager {
  constructor() {
    this.defaultExtensions = this.loadDefaultExtensions();
  }

  loadDefaultExtensions() {
    try {
      const data = fs.readFileSync(DEFAULT_EXTENSIONS_FILE, 'utf8');
      const config = JSON.parse(data);
      return config.defaultExtensions || [];
    } catch (error) {
      console.log('Could not load default extensions:', error.message);
      return [];
    }
  }

  async ensureDefaultExtensions() {
    console.log('Checking default extensions...');
    
    // Ensure extensions directory exists
    if (!fs.existsSync(SHARED_EXTENSIONS_DIR)) {
      fs.mkdirSync(SHARED_EXTENSIONS_DIR, { recursive: true });
    }

    // Get list of installed extensions
    const installed = await this.getInstalledExtensions();
    
    // Install missing default extensions
    for (const ext of this.defaultExtensions) {
      if (!installed.includes(ext.id.toLowerCase())) {
        console.log(`Installing ${ext.name} (${ext.id})...`);
        await this.installExtension(ext.id);
      }
    }
    
    console.log('Default extensions ready');
  }

  async getInstalledExtensions() {
    try {
      const { stdout } = await execPromise(
        `/opt/homebrew/bin/code-server --extensions-dir "${SHARED_EXTENSIONS_DIR}" --list-extensions`
      );
      return stdout.trim().split('\n').map(e => e.toLowerCase());
    } catch (error) {
      console.log('Could not list extensions:', error.message);
      return [];
    }
  }

  async installExtension(extensionId) {
    try {
      await execPromise(
        `/opt/homebrew/bin/code-server --extensions-dir "${SHARED_EXTENSIONS_DIR}" --install-extension ${extensionId}`
      );
      console.log(`✓ Installed ${extensionId}`);
      return true;
    } catch (error) {
      console.log(`✗ Failed to install ${extensionId}:`, error.message);
      return false;
    }
  }

  async installExtensionForInstance(instancePort, extensionId) {
    // Since we use shared extensions, just install to shared directory
    return this.installExtension(extensionId);
  }

  async listExtensions() {
    const installed = await this.getInstalledExtensions();
    return {
      default: this.defaultExtensions,
      installed: installed
    };
  }
}

module.exports = ExtensionManager;