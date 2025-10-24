const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Fully Automated Video Recording for Meta App Review
 * 
 * This script creates a 60-second MP4 video automatically without manual intervention
 * Uses FFmpeg + Puppeteer for automated screen capture
 */

const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60, // 60 seconds
  format: 'mp4',
  quality: 'high'
};

const SCENES = [
  { name: 'Dashboard Overview', duration: 10000, start: 0 },
  { name: 'Lead Capture', duration: 15000, start: 10000 },
  { name: 'BANT Qualification', duration: 15000, start: 25000 },
  { name: 'Property Sharing', duration: 15000, start: 40000 },
  { name: 'Analytics Demo', duration: 5000, start: 55000 }
];

const OUTPUT_PATH = 'docs/04-COMPLIANCE/app-review/video/meta-demo-video.mp4';

async function recordVideoAutomatically() {
  console.log('🎬 Starting Automated Video Recording...');
  console.log('🎯 Target: 60-second Meta App Review Demo');
  
  let browser;
  let ffmpegProcess;
  
  try {
    // Launch browser with specific video recording settings
    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--enable-usermedia-screen-capture',
        '--allow-http-screen-capture',
        '--auto-select-desktop-capture-source=Entire screen',
        '--enable-experimental-web-platform-features'
      ],
      defaultViewport: {
        width: VIDEO_CONFIG.width,
        height: VIDEO_CONFIG.height
      }
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: VIDEO_CONFIG.width,
      height: VIDEO_CONFIG.height
    });

    // Start FFmpeg screen recording
    console.log('🎥 Starting FFmpeg screen recording...');
    ffmpegProcess = await startFFmpegRecording();
    
    // Wait for FFmpeg to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Authenticate
    console.log('🔐 Authenticating...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle0' });
    await page.type('[data-testid="email-input"]', 'test@test.test');
    await page.type('[data-testid="password-input"]', 'testtesttest');
    await page.click('[data-testid="login-button"]');
    
    try {
      await page.waitForURL('**/dashboard', { timeout: 10000 });
      console.log('✅ Authentication successful');
    } catch (error) {
      console.log('⚠️ Authentication timeout, continuing...');
    }
    
    // Record each scene
    console.log('🎬 Recording scenes...');
    const startTime = Date.now();
    
    for (let i = 0; i < SCENES.length; i++) {
      const scene = SCENES[i];
      const sceneStartTime = Date.now();
      
      console.log(`🎬 Scene ${i + 1}/${SCENES.length}: ${scene.name} (${scene.duration}ms)`);
      
      await recordScene(page, scene.name, scene.duration);
      
      const sceneElapsed = Date.now() - sceneStartTime;
      console.log(`✅ Scene ${i + 1} completed in ${sceneElapsed}ms`);
    }
    
    const totalElapsed = Date.now() - startTime;
    console.log(`🎉 All scenes completed in ${totalElapsed}ms`);
    
    // Wait a bit more to ensure we have exactly 60 seconds
    const remainingTime = 60000 - totalElapsed;
    if (remainingTime > 0) {
      console.log(`⏳ Waiting ${remainingTime}ms to complete 60 seconds...`);
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    // Stop FFmpeg recording
    console.log('🛑 Stopping screen recording...');
    await stopFFmpegRecording(ffmpegProcess);
    
    console.log('✅ Video recording completed successfully!');
    console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
    
  } catch (error) {
    console.error('❌ Video recording failed:', error);
    throw error;
  } finally {
    if (ffmpegProcess) {
      ffmpegProcess.kill('SIGINT');
    }
    if (browser) {
      await browser.close();
    }
  }
}

async function startFFmpegRecording() {
  return new Promise((resolve, reject) => {
    // FFmpeg command for screen recording on macOS
    const ffmpegArgs = [
      '-f', 'avfoundation',
      '-i', '1:0', // Capture display 1 and audio device 0
      '-r', VIDEO_CONFIG.fps.toString(),
      '-s', `${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-t', VIDEO_CONFIG.duration.toString(),
      '-y', // Overwrite output file
      OUTPUT_PATH
    ];
    
    console.log('🎥 FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Press [q] to stop')) {
        console.log('✅ FFmpeg recording started');
        resolve(ffmpeg);
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error('❌ FFmpeg error:', error);
      reject(error);
    });
    
    // Timeout after 5 seconds if FFmpeg doesn't start
    setTimeout(() => {
      if (!ffmpeg.killed) {
        resolve(ffmpeg);
      }
    }, 5000);
  });
}

async function stopFFmpegRecording(ffmpegProcess) {
  return new Promise((resolve) => {
    if (ffmpegProcess && !ffmpegProcess.killed) {
      ffmpegProcess.on('close', () => {
        console.log('✅ FFmpeg recording stopped');
        resolve();
      });
      
      // Send 'q' to quit FFmpeg gracefully
      ffmpegProcess.stdin.write('q');
      
      // Force kill after 3 seconds if it doesn't quit
      setTimeout(() => {
        if (!ffmpegProcess.killed) {
          ffmpegProcess.kill('SIGINT');
        }
        resolve();
      }, 3000);
    } else {
      resolve();
    }
  });
}

async function recordScene(page, sceneName, duration) {
  const startTime = Date.now();
  
  try {
    switch (sceneName) {
      case 'Dashboard Overview':
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Highlight key dashboard elements
        await page.evaluate(() => {
          const elements = document.querySelectorAll('.metric-card, .chart, .dashboard-widget');
          elements.forEach(el => {
            el.style.boxShadow = '0 0 15px rgba(0, 123, 255, 0.5)';
          });
        });
        break;
        
      case 'Lead Capture':
        await page.goto('http://localhost:3000/leads', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to click new lead button
        try {
          await page.click('[data-testid="new-lead-button"], .new-lead-btn, button:contains("New Lead")');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not open new lead form');
        }
        
        // Highlight lead-related elements
        await page.evaluate(() => {
          const elements = document.querySelectorAll('.lead-card, .lead-item, [data-testid*="lead"]');
          elements.forEach(el => {
            el.style.border = '2px solid #28a745';
          });
        });
        break;
        
      case 'BANT Qualification':
        await page.goto('http://localhost:3000/messages', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to open a conversation
        try {
          await page.click('.conversation-item:first-child, .message-thread:first-child');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not open conversation');
        }
        
        // Highlight BANT elements
        await page.evaluate(() => {
          const elements = document.querySelectorAll('.bant, .qualification, [data-testid*="bant"]');
          elements.forEach(el => {
            el.style.backgroundColor = 'rgba(255, 193, 7, 0.2)';
          });
        });
        break;
        
      case 'Property Sharing':
        await page.goto('http://localhost:3000/templates', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to select a template
        try {
          await page.click('.template-card:first-child, .template-item:first-child');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not select template');
        }
        
        // Highlight property sharing features
        await page.evaluate(() => {
          const elements = document.querySelectorAll('.property, .template, [data-testid*="property"]');
          elements.forEach(el => {
            el.style.border = '2px solid #007bff';
          });
        });
        break;
        
      case 'Analytics Demo':
        await page.goto('http://localhost:3000/analytics', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Highlight analytics charts
        await page.evaluate(() => {
          const elements = document.querySelectorAll('.chart, [data-testid*="chart"], .analytics-chart');
          elements.forEach(el => {
            el.style.border = '2px solid #28a745';
            el.style.borderRadius = '8px';
          });
        });
        break;
    }
    
    // Wait for remaining scene time
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
    
  } catch (error) {
    console.log(`⚠️ Error in scene ${sceneName}:`, error.message);
    // Continue with remaining time
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }
  }
}

// Check if FFmpeg is installed
function checkFFmpeg() {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('error', () => {
      console.error('❌ FFmpeg not found. Please install FFmpeg:');
      console.error('   macOS: brew install ffmpeg');
      console.error('   Linux: sudo apt-get install ffmpeg');
      console.error('   Windows: Download from https://ffmpeg.org/download.html');
      resolve(false);
    });
    ffmpeg.on('close', () => {
      resolve(true);
    });
  });
}

// Run the automated video recording
if (require.main === module) {
  (async () => {
    console.log('🎬 Meta App Review - Automated Video Recording');
    console.log('🎯 Creating 60-second demo video automatically...');
    
    // Check if FFmpeg is installed
    const ffmpegInstalled = await checkFFmpeg();
    if (!ffmpegInstalled) {
      process.exit(1);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      await recordVideoAutomatically();
      console.log('🎉 SUCCESS: Video recording completed!');
      console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
      console.log('📋 Next steps:');
      console.log('  1. Review the video quality');
      console.log('  2. Upload to Meta Business Manager');
      console.log('  3. Submit app for review');
      process.exit(0);
    } catch (error) {
      console.error('❌ FAILED: Video recording failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { recordVideoAutomatically }; 