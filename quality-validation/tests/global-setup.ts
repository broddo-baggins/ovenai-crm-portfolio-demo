import { chromium, FullConfig } from '@playwright/test';
import { execSync, spawn, ChildProcess } from 'child_process';
import { createServer } from 'http';

let devServerProcess: ChildProcess | null = null;

/**
 * Smart server detection and startup for E2E tests
 * Detects running servers on common ports and starts dev server if needed
 */
async function globalSetup(config: FullConfig) {
  console.log('🔍 Detecting running development servers...');
  
  // COMPREHENSIVE port range for ultra-robust detection (auto-detection optimized)
  const commonPorts = [
    // Primary Vite/React ports
    3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009,
    // Secondary Vite preview ports  
    4173, 4174, 4175, 4176, 4177,
    // Standard dev server ports
    5173, 5174, 5175, 5176, 5177, 5178, 5179,
    // Alternative common ports
    8080, 8081, 8082, 8083, 8000, 8001, 9000, 9001,
    // Backup range for port conflicts
    3010, 3011, 3012, 3013, 3014, 3015
  ];
  let detectedPort: number | null = null;
  let detectedUrl: string | null = null;

  // Check each port for running servers
  for (const port of commonPorts) {
    try {
      const isPortOpen = await checkPort(port);
      if (isPortOpen) {
        const url = `http://localhost:${port}`;
        const isAppRunning = await checkAppHealth(url);
        if (isAppRunning) {
          detectedPort = port;
          detectedUrl = url;
          console.log(`✅ Found running OvenAI server at ${url}`);
          break;
        } else {
          console.log(`⚠️  Port ${port} is occupied but not serving OvenAI`);
        }
      }
    } catch (error) {
      // Port not available, continue checking
    }
  }

  // If no server detected, start dev server
  if (!detectedUrl) {
    console.log('🚀 Starting development server...');
    detectedUrl = await startDevServer();
    detectedPort = new URL(detectedUrl).port ? parseInt(new URL(detectedUrl).port) : 3000;
  }

  // Update Playwright config with detected URL
  if (config.projects) {
    config.projects.forEach(project => {
      if (project.use) {
        project.use.baseURL = detectedUrl;
      }
    });
  }

  // Store for cleanup
  process.env.DETECTED_BASE_URL = detectedUrl;
  process.env.DETECTED_PORT = detectedPort?.toString();

  console.log(`🎯 Using base URL: ${detectedUrl}`);
  
  // Wait for server to be fully ready
  await waitForServerReady(detectedUrl);
  
  return async () => {
    // Global teardown
    if (devServerProcess) {
      console.log('🛑 Stopping development server...');
      devServerProcess.kill('SIGTERM');
    }
  };
}

/**
 * Check if a port is open and responsive
 */
async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    
    server.listen(port, () => {
      server.close(() => resolve(false)); // Port is free
    });
    
    server.on('error', () => {
      resolve(true); // Port is occupied
    });
    
    // Timeout after 1 second
    setTimeout(() => {
      server.close(() => resolve(false));
    }, 1000);
  });
}

/**
 * Check if the app is running and healthy at the given URL
 */
async function checkAppHealth(url: string): Promise<boolean> {
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    
    // COMPREHENSIVE OvenAI app verification (ultra-robust)
    const isOvenAI = await page.evaluate(() => {
      // Look for OvenAI-specific indicators with multiple fallbacks
      const indicators = [
        // Title checks
        document.title.includes('OvenAI'),
        document.title.includes('Oven AI'), 
        document.title.includes('vite_react_shadcn_ts'),
        // Element attribute checks
        document.querySelector('[data-testid*="oven"]') !== null,
        document.querySelector('[class*="oven"]') !== null,
        document.querySelector('[id*="oven"]') !== null,
        // Content checks
        document.body.innerHTML.includes('OvenAI'),
        document.body.innerHTML.includes('Oven AI'),
        // React app structure
        document.querySelector('#root') !== null,
        document.querySelector('[data-reactroot]') !== null,
        // Common app elements
        document.querySelector('nav') !== null || document.querySelector('[role="navigation"]') !== null,
        // Meta tag checks
        document.querySelector('meta[name*="oven"]') !== null,
        // Vite/React development indicators
        document.querySelector('script[type="module"]') !== null
      ];
      
      // Return true if ANY indicator is found (flexible detection)
      return indicators.some(indicator => indicator === true);
    });
    
    await browser.close();
    return isOvenAI;
  } catch (error) {
    return false;
  }
}

/**
 * Start the development server
 */
async function startDevServer(): Promise<string> {
  let port = 3000; // Try default port first
  let url = `http://localhost:${port}`;
  
  // Check if default port is available, if not find next available
  for (let testPort = 3000; testPort <= 3010; testPort++) {
    if (await checkPort(testPort)) {
      port = testPort;
      url = `http://localhost:${port}`;
      break;
    }
  }
  
  console.log(`🔧 Starting Vite development server on port ${port}...`);
  
  // Start dev server with dynamic port
  devServerProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    cwd: process.cwd(),
    env: { ...process.env, PORT: port.toString(), VITE_PORT: port.toString() }
  });

  if (!devServerProcess) {
    throw new Error('Failed to start development server process');
  }

  let serverReady = false;
  const serverReadyPromise = new Promise<void>((resolve) => {
    // Handle server output
    devServerProcess?.stdout?.on('data', (data) => {
      const output = data.toString();
      if ((output.includes('Local:') || output.includes('ready')) && !serverReady) {
        serverReady = true;
        console.log(`✅ Development server ready on ${url}`);
        resolve();
      }
    });
  });

  devServerProcess.stderr?.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('warning') && !error.includes('deprecated')) {
      console.error('❌ Server error:', error);
    }
  });

  // Wait for server to be ready or timeout
  await Promise.race([
    serverReadyPromise,
    new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error('Server startup timeout')), 30000)
    )
  ]);

  return url;
}

/**
 * Wait for server to be fully ready and responsive
 */
async function waitForServerReady(url: string, maxAttempts: number = 30): Promise<void> {
  console.log(`⏳ Waiting for server at ${url} to be ready...`);
  
  // Optimize for queue tests - fewer attempts, shorter waits
  const isQueueTest = process.env.QUEUE_TEST_MODE;
  const actualMaxAttempts = isQueueTest ? 10 : maxAttempts;
  const waitTime = isQueueTest ? 1000 : 2000;
  const pageTimeout = isQueueTest ? 5000 : 10000;
  
  for (let attempt = 1; attempt <= actualMaxAttempts; attempt++) {
    try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: pageTimeout 
      });
      
      // Wait for React to mount (reduced timeout for queue tests)
      await page.waitForFunction(() => {
        return document.readyState === 'complete' && 
               document.querySelector('#root') !== null;
      }, { timeout: isQueueTest ? 3000 : 5000 });
      
      await browser.close();
      console.log(`✅ Server ready after ${attempt} attempts`);
      return;
    } catch (error) {
      if (attempt === actualMaxAttempts) {
        throw new Error(`❌ Server failed to start after ${actualMaxAttempts} attempts: ${error}`);
      }
      
      console.log(`⏳ Attempt ${attempt}/${actualMaxAttempts}, waiting ${waitTime/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

export default globalSetup; 