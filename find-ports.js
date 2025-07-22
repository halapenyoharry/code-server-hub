#!/usr/bin/env node

const net = require('net');
const { promisify } = require('util');

// Common port ranges for development
const PORT_RANGES = [
  { start: 3000, end: 3010, name: 'Node.js' },
  { start: 4000, end: 4010, name: 'Alternative Node' },
  { start: 5000, end: 5010, name: 'Python/Flask' },
  { start: 8000, end: 8010, name: 'Django/Python' },
  { start: 8080, end: 8090, name: 'Alternative HTTP' },
  { start: 9000, end: 9010, name: 'PHP/Other' },
];

async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port, '127.0.0.1');
  });
}

async function findAvailablePorts() {
  console.log('🔍 Finding available ports for development...\n');
  
  const available = [];
  
  for (const range of PORT_RANGES) {
    console.log(`Checking ${range.name} ports (${range.start}-${range.end})...`);
    
    for (let port = range.start; port <= range.end; port++) {
      if (await isPortAvailable(port)) {
        available.push({ port, category: range.name });
      }
    }
  }
  
  console.log('\n✅ Available ports:\n');
  
  if (available.length === 0) {
    console.log('No available ports found in common ranges!');
    return;
  }
  
  // Group by category
  const grouped = available.reduce((acc, { port, category }) => {
    if (!acc[category]) acc[category] = [];
    acc[category].push(port);
    return acc;
  }, {});
  
  // Display grouped results
  for (const [category, ports] of Object.entries(grouped)) {
    console.log(`${category}:`);
    console.log(`  ${ports.join(', ')}`);
    console.log();
  }
  
  // Suggest a random available port
  const randomIndex = Math.floor(Math.random() * available.length);
  const suggestion = available[randomIndex];
  
  console.log(`💡 Random suggestion: Port ${suggestion.port} (${suggestion.category})`);
  console.log(`\nTo use: specify port ${suggestion.port} when creating a new instance`);
}

// Run if called directly
if (require.main === module) {
  findAvailablePorts().catch(console.error);
}

module.exports = { isPortAvailable, findAvailablePorts };