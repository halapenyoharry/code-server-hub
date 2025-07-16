module.exports.setupRoutes = (app, state) => {
  // API endpoints
  app.get('/api/services', (req, res) => {
    res.json({
      services: Array.from(state.services.values()),
      codeServers: Array.from(state.codeServers.values()),
      timestamp: new Date()
    });
  });

  app.get('/api/services/:id', (req, res) => {
    const service = state.services.get(req.params.id);
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ error: 'Service not found' });
    }
  });

  app.post('/api/services/:id/control', async (req, res) => {
    const { action } = req.body;
    const serviceId = req.params.id;
    
    try {
      const result = await require('./discovery').manageCodeServers.controlService(serviceId, action);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Code Server Instance Management
  app.get('/api/instances', async (req, res) => {
    try {
      const instances = await state.codeServerManager.getAllInstances();
      res.json({ instances });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/instances/:port/start', async (req, res) => {
    try {
      const result = await state.codeServerManager.startInstance(req.params.port);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/instances/:port/stop', async (req, res) => {
    try {
      const result = await state.codeServerManager.stopInstance(req.params.port);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/instances/:port/restart', async (req, res) => {
    try {
      const result = await state.codeServerManager.restartInstance(req.params.port);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/instances/start-all', async (req, res) => {
    try {
      const results = await state.codeServerManager.startAllInstances();
      res.json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/instances/stop-all', async (req, res) => {
    try {
      const results = await state.codeServerManager.stopAllInstances();
      res.json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // System info endpoint
  app.get('/api/system', async (req, res) => {
    const si = require('systeminformation');
    
    try {
      const [cpu, mem, network] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.networkInterfaces()
      ]);
      
      // Prefer Wi-Fi interfaces for iPad access
      const wifiNetwork = network.find(n => 
        n.ip4 && n.ip4 !== '127.0.0.1' && 
        (n.ifaceName.includes('Wi-Fi') || n.ifaceName.includes('en0') || n.ifaceName.includes('wlan'))
      );
      
      const filteredNetwork = wifiNetwork ? [wifiNetwork] : network.filter(n => n.ip4 && n.ip4 !== '127.0.0.1');
      
      res.json({
        cpu: {
          usage: cpu.currentLoad,
          cores: cpu.cpus.length
        },
        memory: {
          total: mem.total,
          used: mem.used,
          percentage: (mem.used / mem.total) * 100
        },
        network: filteredNetwork
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy',
      uptime: process.uptime(),
      version: '0.1.0'
    });
  });
};
