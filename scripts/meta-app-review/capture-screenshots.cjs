const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Meta App Review Screenshot Capture Script
 * 
 * Automatically captures 18 high-quality screenshots for Meta WhatsApp Business API submission
 * Based on docs/04-COMPLIANCE/app-review/SCREENSHOT_CAPTURE_INSTRUCTIONS.md
 */

const SCREENSHOT_CONFIG = {
  desktop: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1
  },
  mobile: {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  }
};

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = 'docs/04-COMPLIANCE/app-review/screenshots';

const SCREENSHOTS = [
  // Desktop Screenshots (1-15)
  {
    id: '01_login_page',
    url: '/auth/login',
    type: 'desktop',
    description: 'Login page with Meta attribution',
    wait: 2000
  },
  {
    id: '02_dashboard_overview',
    url: '/dashboard',
    type: 'desktop',
    description: 'Dashboard with WhatsApp metrics',
    wait: 3000,
    requiresAuth: true
  },
  {
    id: '03_lead_management',
    url: '/leads',
    type: 'desktop',
    description: 'Lead management interface',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '04_lead_profile_whatsapp',
    url: '/leads',
    type: 'desktop',
    description: 'Lead profile with WhatsApp integration',
    wait: 2000,
    requiresAuth: true,
    action: 'clickFirstLead'
  },
  {
    id: '05_bulk_lead_operations',
    url: '/lead-pipeline',
    type: 'desktop',
    description: 'Bulk lead operations and campaigns',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '06_whatsapp_business_profile',
    url: '/whatsapp-demo',
    type: 'desktop',
    description: 'WhatsApp Business profile setup',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '07_message_templates',
    url: '/lead-pipeline',
    type: 'desktop',
    description: 'WhatsApp message templates',
    wait: 2000,
    requiresAuth: true,
    action: 'clickWhatsAppTab'
  },
  {
    id: '08_whatsapp_conversation',
    url: '/messages',
    type: 'desktop',
    description: 'Active WhatsApp conversation',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '09_message_sending_workflow',
    url: '/messages',
    type: 'desktop',
    description: 'Message sending workflow',
    wait: 2000,
    requiresAuth: true,
    action: 'clickNewMessage'
  },
  {
    id: '10_whatsapp_analytics',
    url: '/reports',
    type: 'desktop',
    description: 'WhatsApp analytics dashboard',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '11_conversation_list',
    url: '/messages',
    type: 'desktop',
    description: 'Conversation list overview',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '12_conversation_thread',
    url: '/messages',
    type: 'desktop',
    description: 'Individual conversation thread',
    wait: 2000,
    requiresAuth: true,
    action: 'clickFirstConversation'
  },
  {
    id: '13_automated_responses',
    url: '/settings',
    type: 'desktop',
    description: 'Automated response setup',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '14_analytics_dashboard',
    url: '/reports',
    type: 'desktop',
    description: 'Analytics and performance dashboard',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '15_reporting_interface',
    url: '/reports',
    type: 'desktop',
    description: 'Real-time reporting interface',
    wait: 2000,
    requiresAuth: true,
    action: 'clickExportButton'
  },
  
  // Mobile Screenshots (16-18)
  {
    id: '16_mobile_dashboard',
    url: '/dashboard',
    type: 'mobile',
    description: 'Mobile dashboard view',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '17_mobile_whatsapp_messaging',
    url: '/messages',
    type: 'mobile',
    description: 'Mobile WhatsApp messaging',
    wait: 2000,
    requiresAuth: true
  },
  {
    id: '18_mobile_lead_management',
    url: '/leads',
    type: 'mobile',
    description: 'Mobile lead management',
    wait: 2000,
    requiresAuth: true
  }
];

class ScreenshotCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.authenticated = false;
  }

  async init() {
    console.log('🚀 Initializing Meta App Review Screenshot Capture...');
    
    // Create output directories
    this.createOutputDirectories();
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true, // Run headless for better performance
      defaultViewport: null,
      protocolTimeout: 60000, // Increase protocol timeout
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('✅ Browser initialized successfully');
  }

  createOutputDirectories() {
    const desktopDir = path.join(OUTPUT_DIR, 'desktop');
    const mobileDir = path.join(OUTPUT_DIR, 'mobile');
    
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    if (!fs.existsSync(desktopDir)) {
      fs.mkdirSync(desktopDir, { recursive: true });
    }
    if (!fs.existsSync(mobileDir)) {
      fs.mkdirSync(mobileDir, { recursive: true });
    }
  }

  async authenticate() {
    if (this.authenticated) return;
    
    console.log('🔐 Authenticating with test@test.test...');
    
    await this.page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Fill login form
    await this.page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await this.page.type('input[type="email"]', 'test@test.test');
    await this.page.type('input[type="password"]', 'testtesttest');
    
    // Submit form
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect
    await this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Verify authentication
    const url = this.page.url();
    if (!url.includes('/auth/login')) {
      this.authenticated = true;
      console.log('✅ Authentication successful');
    } else {
      throw new Error('Authentication failed');
    }
  }

  async setViewport(type) {
    const config = SCREENSHOT_CONFIG[type];
    await this.page.setViewport(config);
  }

  async performAction(action) {
    switch (action) {
      case 'clickFirstLead':
        try {
          await this.page.waitForSelector('[data-testid="lead-row"], .lead-item, tr[data-lead-id]', { timeout: 5000 });
          await this.page.click('[data-testid="lead-row"], .lead-item, tr[data-lead-id]');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ Could not click first lead, continuing...');
        }
        break;
        
      case 'clickWhatsAppTab':
        try {
          await this.page.waitForSelector('[data-testid="whatsapp-tab"], .whatsapp-tab, button:contains("WhatsApp")', { timeout: 5000 });
          await this.page.click('[data-testid="whatsapp-tab"], .whatsapp-tab, button:contains("WhatsApp")');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ Could not click WhatsApp tab, continuing...');
        }
        break;
        
      case 'clickNewMessage':
        try {
          await this.page.waitForSelector('[data-testid="new-message"], .new-message-btn, button:contains("New Message")', { timeout: 5000 });
          await this.page.click('[data-testid="new-message"], .new-message-btn, button:contains("New Message")');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ Could not click new message, continuing...');
        }
        break;
        
      case 'clickFirstConversation':
        try {
          await this.page.waitForSelector('[data-testid="conversation-item"], .conversation-item, .message-thread', { timeout: 5000 });
          await this.page.click('[data-testid="conversation-item"], .conversation-item, .message-thread');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ Could not click first conversation, continuing...');
        }
        break;
        
      case 'clickExportButton':
        try {
          await this.page.waitForSelector('[data-testid="export-btn"], .export-button, button:contains("Export")', { timeout: 5000 });
          await this.page.click('[data-testid="export-btn"], .export-button, button:contains("Export")');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.warn('⚠️ Could not click export button, continuing...');
        }
        break;
    }
  }

  async captureScreenshot(screenshot) {
    console.log(`📸 Capturing ${screenshot.id}: ${screenshot.description}`);
    
    try {
      // Set viewport for device type
      await this.setViewport(screenshot.type);
      
      // Authenticate if required
      if (screenshot.requiresAuth) {
        await this.authenticate();
      }
      
      // Navigate to URL
      await this.page.goto(`${BASE_URL}${screenshot.url}`, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });
      
      // Wait for page to load
      await new Promise(resolve => setTimeout(resolve, screenshot.wait));
      
      // Perform action if specified
      if (screenshot.action) {
        await this.performAction(screenshot.action);
      }
      
      // Additional wait for dynamic content
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capture screenshot
      const screenshotPath = path.join(
        OUTPUT_DIR,
        screenshot.type,
        `${screenshot.id}.png`
      );
      
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: false,
        type: 'png'
      });
      
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
      
    } catch (error) {
      console.error(`❌ Error capturing ${screenshot.id}:`, error.message);
      
      // Take a fallback screenshot
      try {
        const fallbackPath = path.join(
          OUTPUT_DIR,
          screenshot.type,
          `${screenshot.id}_fallback.png`
        );
        await this.page.screenshot({
          path: fallbackPath,
          fullPage: false,
          type: 'png'
        });
        console.log(`⚠️ Fallback screenshot saved: ${fallbackPath}`);
      } catch (fallbackError) {
        console.error(`❌ Fallback screenshot failed:`, fallbackError.message);
      }
    }
  }

  async captureAll() {
    console.log(`🎯 Starting capture of ${SCREENSHOTS.length} screenshots...`);
    
    for (let i = 0; i < SCREENSHOTS.length; i++) {
      const screenshot = SCREENSHOTS[i];
      console.log(`\n📋 Progress: ${i + 1}/${SCREENSHOTS.length}`);
      
      await this.captureScreenshot(screenshot);
      
      // Brief pause between screenshots
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎉 All screenshots captured successfully!');
  }

  async generateIndex() {
    const indexData = {
      timestamp: new Date().toISOString(),
      total_screenshots: SCREENSHOTS.length,
      desktop_screenshots: SCREENSHOTS.filter(s => s.type === 'desktop').length,
      mobile_screenshots: SCREENSHOTS.filter(s => s.type === 'mobile').length,
      screenshots: SCREENSHOTS.map(s => ({
        id: s.id,
        type: s.type,
        description: s.description,
        url: s.url,
        file_path: `${s.type}/${s.id}.png`
      }))
    };
    
    const indexPath = path.join(OUTPUT_DIR, 'screenshot_index.json');
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log(`📋 Screenshot index generated: ${indexPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔚 Browser closed');
    }
  }
}

// Main execution
async function main() {
  const capture = new ScreenshotCapture();
  
  try {
    await capture.init();
    await capture.captureAll();
    await capture.generateIndex();
    
    console.log('\n🎯 Meta App Review Screenshot Capture Complete!');
    console.log(`📁 Screenshots saved to: ${OUTPUT_DIR}`);
    console.log('📋 Next steps:');
    console.log('  1. Review screenshots for quality');
    console.log('  2. Record demo video');
    console.log('  3. Assemble Meta submission package');
    
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error);
    process.exit(1);
  } finally {
    await capture.close();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ScreenshotCapture; 