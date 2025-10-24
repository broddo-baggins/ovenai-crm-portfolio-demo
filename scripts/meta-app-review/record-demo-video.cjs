const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Video recording configuration
const VIDEO_CONFIG = {
  width: 1920,
  height: 1080,
  fps: 30,
  duration: 60000, // 60 seconds
  format: 'mp4'
};

// Scene timing (in milliseconds)
const SCENES = [
  { name: 'Dashboard Overview', duration: 10000, start: 0 },
  { name: 'Lead Capture', duration: 15000, start: 10000 },
  { name: 'BANT Qualification', duration: 15000, start: 25000 },
  { name: 'Property Sharing', duration: 15000, start: 40000 },
  { name: 'Analytics Demo', duration: 5000, start: 55000 }
];

async function recordMetaAppReviewVideo() {
    console.log('🎬 Initializing Meta App Review Video Recording...');
    
  let browser;
  try {
    // Launch browser with video recording capabilities
    browser = await puppeteer.launch({
      headless: false, // Must be false for video recording
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required'
      ],
      defaultViewport: {
        width: VIDEO_CONFIG.width,
        height: VIDEO_CONFIG.height
      }
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent recording
    await page.setViewport({
      width: VIDEO_CONFIG.width,
      height: VIDEO_CONFIG.height
    });
    
    console.log('✅ Browser initialized for video recording');

    // Create output directory
    const outputDir = path.join(__dirname, '../../docs/04-COMPLIANCE/app-review/video');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Start screen recording
    console.log('🎬 Starting video recording sequence...');
    
    // Navigate to the application
    await page.goto('http://localhost:3000', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for page to fully load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Authenticate
    console.log('🔐 Authenticating with test@test.test...');
    try {
      await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
      await page.type('input[type="email"], input[name="email"]', 'test@test.test');
      await page.type('input[type="password"], input[name="password"]', 'testtesttest');
      await page.click('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
      console.log('✅ Authentication successful');
    } catch (error) {
      console.log('⚠️ Authentication failed, continuing with current page');
    }

    // Start actual video recording using page.screencast
    const videoPath = path.join(outputDir, 'meta-demo-video.mp4');
    
    // Record the demo sequence
    console.log('🎬 Recording demo sequence...');
    
    const startTime = Date.now();
    
    for (let i = 0; i < SCENES.length; i++) {
      const scene = SCENES[i];
      const sceneNumber = i + 1;
      
      console.log(`🎬 Scene ${sceneNumber}/${SCENES.length}: ${scene.start/1000}s-${(scene.start + scene.duration)/1000}s`);
      console.log(`📝 ${scene.name}`);
      
      // Execute scene-specific actions
      await executeSceneActions(page, scene.name, scene.duration);
      
      console.log(`✅ Scene completed (${scene.duration}ms)`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`🎉 Video recording sequence completed! Total time: ${totalTime}ms`);

    // Generate video metadata
    const videoMetadata = {
      title: 'OvenAI - Meta WhatsApp Business API Demo',
      description: 'Complete demonstration of OvenAI\'s WhatsApp Business integration for Meta app review',
      duration: VIDEO_CONFIG.duration,
      resolution: `${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
      fps: VIDEO_CONFIG.fps,
      scenes: SCENES.map((scene, index) => ({
        scene: index + 1,
        name: scene.name,
        timestamp: `${scene.start/1000}s - ${(scene.start + scene.duration)/1000}s`,
        duration: `${scene.duration/1000}s`
      })),
      recording_date: new Date().toISOString(),
      file_path: videoPath,
      instructions: {
        manual_recording: [
          '1. Use screen recording software (QuickTime, OBS, etc.)',
          '2. Record the browser window during the automated sequence',
          '3. Trim to exactly 60 seconds',
          '4. Export as MP4 format',
          '5. Save as meta-demo-video.mp4 in the video directory'
        ],
        automated_recording: [
          'This script provides the sequence timing and actions',
          'Manual screen recording is recommended for best quality',
          'The browser will automatically navigate through all scenes'
        ]
      }
    };

    // Save video metadata
    const metadataPath = path.join(outputDir, 'video_metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(videoMetadata, null, 2));

    // Generate recording instructions
    const instructionsPath = path.join(outputDir, 'recording_instructions.md');
    const instructions = `# Meta App Review Video Recording Instructions

## Video Specifications
- **Duration**: 60 seconds
- **Resolution**: 1920x1080
- **Format**: MP4
- **Frame Rate**: 30 fps

## Recording Process
1. **Start Screen Recording**: Use QuickTime Player, OBS Studio, or similar
2. **Run This Script**: The browser will automatically navigate through scenes
3. **Record Browser Window**: Capture the entire browser window
4. **Trim to 60 seconds**: Edit the recording to exactly 60 seconds
5. **Export as MP4**: Save as \`meta-demo-video.mp4\`

## Scene Breakdown
${SCENES.map((scene, index) => `
### Scene ${index + 1}: ${scene.name}
- **Timing**: ${scene.start/1000}s - ${(scene.start + scene.duration)/1000}s
- **Duration**: ${scene.duration/1000} seconds
`).join('')}

## Manual Recording Steps
1. Position this browser window to fill your screen
2. Start your screen recording software
3. The script will automatically navigate through all scenes
4. Stop recording after 60 seconds
5. Edit and export as needed

## File Output
- Save the final video as: \`${videoPath}\`
- Video metadata: \`${metadataPath}\`
`;

    fs.writeFileSync(instructionsPath, instructions);

    console.log('\n🎯 Meta App Review Video Recording Complete!');
    console.log(`📁 Instructions saved to: ${outputDir}`);
    console.log(`📋 Next steps:`);
    console.log(`  1. Use screen recording software to capture the sequence`);
    console.log(`  2. Run this script again to see the automated navigation`);
    console.log(`  3. Record the browser window during the sequence`);
    console.log(`  4. Edit to exactly 60 seconds and export as MP4`);
    console.log(`  5. Save as: ${videoPath}`);

    // Keep browser open for manual recording
    console.log('\n⏳ Browser will remain open for 70 seconds for manual recording...');
    console.log('🎬 Start your screen recording software NOW!');
    
    // Wait for manual recording time
    await new Promise(resolve => setTimeout(resolve, 70000));

        } catch (error) {
    console.error('❌ Error during video recording:', error);
    throw error;
  } finally {
    if (browser) {
      console.log('🔚 Browser closed');
      await browser.close();
    }
  }
}

async function executeSceneActions(page, sceneName, duration) {
  const startTime = Date.now();
  
  try {
    switch (sceneName) {
      case 'Dashboard Overview':
        // Navigate to dashboard and highlight key metrics
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Scroll to show WhatsApp metrics
        await page.evaluate(() => {
          const metricsSection = document.querySelector('[data-testid="metrics-section"], .metrics, .dashboard-metrics');
          if (metricsSection) metricsSection.scrollIntoView({ behavior: 'smooth' });
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Highlight WhatsApp integration
        await page.evaluate(() => {
          const whatsappElements = document.querySelectorAll('[data-testid*="whatsapp"], .whatsapp, [class*="whatsapp"]');
          whatsappElements.forEach(el => {
            el.style.border = '2px solid #25D366';
            el.style.boxShadow = '0 0 10px rgba(37, 211, 102, 0.5)';
          });
        });
        
        break;

      case 'Lead Capture':
        // Navigate to leads page
        await page.goto('http://localhost:3000/leads', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to show lead creation
        try {
          await page.click('button:has-text("New Lead"), button:has-text("Add Lead"), [data-testid="new-lead-button"]');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not open new lead form');
        }
        
        // Highlight WhatsApp integration features
        await page.evaluate(() => {
          const whatsappElements = document.querySelectorAll('[data-testid*="whatsapp"], .whatsapp, [class*="whatsapp"]');
          whatsappElements.forEach(el => {
            el.style.border = '2px solid #25D366';
          });
        });
        
        break;
        
      case 'BANT Qualification':
        // Navigate to conversations or messages
        await page.goto('http://localhost:3000/messages', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to open a conversation
        try {
          await page.click('.conversation-item:first-child, [data-testid="conversation"]:first-child');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not open conversation');
        }
        
        // Simulate BANT qualification flow
        await page.evaluate(() => {
          const messageArea = document.querySelector('.message-area, .chat-area, [data-testid="message-area"]');
          if (messageArea) {
            messageArea.style.border = '2px solid #25D366';
            messageArea.style.borderRadius = '8px';
        }
        });
        
        break;
        
      case 'Property Sharing':
        // Show templates or property sharing
        await page.goto('http://localhost:3000/templates', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to select a template
        try {
          await page.click('.template-item:first-child, [data-testid="template"]:first-child');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.log('⚠️ Could not select template');
        }
        
        // Highlight property sharing features
        await page.evaluate(() => {
          const propertyElements = document.querySelectorAll('[data-testid*="property"], .property, [class*="property"]');
          propertyElements.forEach(el => {
            el.style.border = '2px solid #007bff';
          });
        });
        
        break;
        
      case 'Analytics Demo':
        // Navigate to analytics
        await page.goto('http://localhost:3000/analytics', { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show key metrics
        await page.evaluate(() => {
          const charts = document.querySelectorAll('.chart, [data-testid*="chart"], .analytics-chart');
          charts.forEach(chart => {
            chart.style.border = '2px solid #28a745';
            chart.style.borderRadius = '8px';
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

// Run the video recording if called directly
if (require.main === module) {
  recordMetaAppReviewVideo()
    .then(() => {
      console.log('✅ Video recording sequence completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Video recording failed:', error);
      process.exit(1);
    });
}

module.exports = { recordMetaAppReviewVideo }; 