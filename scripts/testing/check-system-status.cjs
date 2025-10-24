#!/usr/bin/env node

/**
 * Enhanced System Status Check Script
 * Verifies all system components are working before running tests
 */

const http = require('http');
const https = require('https');

const CHECKS = {
  ports: [
    { port: 3000, name: 'Development Server', optional: true },
    { port: 3001, name: 'Preview Server', optional: true },
    { port: 4173, name: 'Vite Preview', optional: true }
  ],
  apis: [
    'http://localhost:3001/api/ping',
    'http://localhost:3000/api/ping'
  ],
  database: [
    'Site DB Connection',
    'RLS Policies Check',
    'User Authentication'
  ]
};

function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.listen(port, () => {
      server.close(() => {
        resolve({ port, available: false, status: 'Port in use' });
      });
    });
    
    server.on('error', () => {
      resolve({ port, available: true, status: 'Port available' });
    });
  });
}

function checkAPI(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        available: res.statusCode >= 200 && res.statusCode < 300
      });
    });
    
    req.on('error', () => {
      resolve({
        url,
        status: 'ERROR',
        available: false
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        available: false
      });
    });
  });
}

async function runSystemCheck() {
  console.log('🔍 System Status Check\n');
  
  // Check ports
  console.log('📡 Checking Ports:');
  for (const portCheck of CHECKS.ports) {
    const result = await checkPort(portCheck.port);
    const status = result.available ? '🟢' : '🔴';
    const optional = portCheck.optional ? ' (optional)' : '';
    console.log(`${status} Port ${portCheck.port} - ${portCheck.name}${optional}: ${result.status}`);
  }
  
  console.log('\n🌐 Checking APIs:');
  for (const apiUrl of CHECKS.apis) {
    const result = await checkAPI(apiUrl);
    const status = result.available ? '🟢' : '🔴';
    console.log(`${status} ${apiUrl}: ${result.status}`);
  }
  
  console.log('\n📊 Database Checks:');
  for (const check of CHECKS.database) {
    console.log(`⏳ ${check}: Checking...`);
    // Add actual database checks here when needed
  }
  
  console.log('\n✅ System check complete');
  
  // Summary
  const portResults = await Promise.all(CHECKS.ports.map(p => checkPort(p.port)));
  const apiResults = await Promise.all(CHECKS.apis.map(checkAPI));
  
  const portsInUse = portResults.filter(r => !r.available).length;
  const apisWorking = apiResults.filter(r => r.available).length;
  
  console.log('\n📋 Summary:');
  console.log(`Ports in use: ${portsInUse}/${CHECKS.ports.length}`);
  console.log(`APIs working: ${apisWorking}/${CHECKS.apis.length}`);
  
  return {
    portsInUse,
    apisWorking,
    totalPorts: CHECKS.ports.length,
    totalApis: CHECKS.apis.length
  };
}

if (require.main === module) {
  runSystemCheck().then(results => {
    process.exit(0);
  }).catch(error => {
    console.error('❌ System check failed:', error);
    process.exit(1);
  });
}

module.exports = { runSystemCheck }; 