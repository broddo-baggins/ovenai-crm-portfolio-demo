#!/usr/bin/env node

/**
 * Automated Screenshot Capture for Meta WhatsApp Business Submission
 * Captures all required screenshots with proper annotations
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const CONFIG = {
  BASE_URL: process.env.VITE_APP_URL || 'http://localhost:3001',
  OUTPUT_DIR: './docs/app-review/screenshots',
  TEST_USER: {
    email: process.env.TEST_USER_EMAIL || 'test@test.test',
    password: process.env.TEST_USER_PASSWORD || 'testtesttest'
  },
  SCREENSHOT_OPTIONS: {
    fullPage: true,
    quality: 90,
    type: 'png'
  },
  VIEWPORT: {
    width: 1920,
    height: 1080
  }
};

// Screenshot definitions for Meta submission
const SCREENSHOT_REQUIREMENTS = [
  {
    name: 'dashboard-overview',
    title: 'Application Dashboard Overview',
    description: 'Main dashboard showing lead metrics and WhatsApp integration',
    path: '/dashboard',
    annotations: [
      'WhatsApp integration status in header',
      'Lead metrics showing WhatsApp engagement',
      'Recent WhatsApp conversations',
      'Queue processing indicators'
    ]
  },
  {
    name: 'whatsapp-templates',
    title: 'WhatsApp Template Management',
    description: 'Template library with approved WhatsApp templates',
    path: '/admin/templates',
    annotations: [
      'Approved template status indicators',
      'Template categories for different use cases',
      'Hebrew language support',
      'Template preview functionality'
    ]
  },
  {
    name: 'lead-conversation',
    title: 'Lead Conversation View',
    description: 'WhatsApp conversation thread with lead details',
    path: '/leads',
    actions: ['click-first-lead', 'open-whatsapp-tab'],
    annotations: [
      'WhatsApp conversation history',
      'Lead qualification status',
      'Message delivery confirmations',
      'BANT scoring integration'
    ]
  },
  {
    name: 'bant-qualification',
    title: 'BANT Qualification Interface',
    description: 'BANT assessment with WhatsApp integration',
    path: '/leads',
    actions: ['click-first-lead', 'open-bant-tab'],
    annotations: [
      'Automated qualification questions',
      'WhatsApp conversation analysis',
      'Real-time scoring updates',
      'Lead classification system'
    ]
  },
  {
    name: 'whatsapp-analytics',
    title: 'WhatsApp Analytics Dashboard',
    description: 'Message analytics and performance metrics',
    path: '/analytics',
    annotations: [
      'Message delivery rates',
      'Response time metrics',
      'Conversion tracking',
      'Template performance statistics'
    ]
  },
  {
    name: 'template-composer',
    title: 'Template Message Composer',
    description: 'Interface for sending WhatsApp templates',
    path: '/leads',
    actions: ['click-first-lead', 'open-compose-message'],
    annotations: [
      'Template selection interface',
      'Variable substitution preview',
      'Send confirmation dialog',
      'Delivery status tracking'
    ]
  },
  {
    name: 'lead-management',
    title: 'Lead Management with WhatsApp',
    description: 'Lead table with WhatsApp contact options',
    path: '/leads',
    annotations: [
      'WhatsApp status indicators',
      'Quick action buttons',
      'Processing state visualization',
      'Contact history overview'
    ]
  },
  {
    name: 'queue-management',
    title: 'Queue Management System',
    description: 'Lead processing queue with WhatsApp automation',
    path: '/queue-management',
    annotations: [
      'Business day automation settings',
      'Processing status indicators',
      'Performance metrics',
      'Rate limiting controls'
    ]
  }
];

class ScreenshotCapture {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      total_screenshots: SCREENSHOT_REQUIREMENTS.length,
      successful_captures: 0,
      failed_captures: 0,
      captures: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Initialize browser and page
   */
  async initialize() {
    console.log('🚀 Initializing browser for screenshot capture...');
    
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      viewport: CONFIG.VIEWPORT
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewportSize(CONFIG.VIEWPORT);
    
    // Set longer timeout for complex pages
    this.page.setDefaultTimeout(30000);
    
    console.log('✅ Browser initialized');
  }

  /**
   * Login to the application
   */
  async login() {
    console.log('🔐 Logging in to application...');
    
    try {
      await this.page.goto(`${CONFIG.BASE_URL}/auth/login`);
      
      // Wait for login form
      await this.page.waitForSelector('input[type="email"]');
      
      // Fill login form
      await this.page.fill('input[type="email"]', CONFIG.TEST_USER.email);
      await this.page.fill('input[type="password"]', CONFIG.TEST_USER.password);
      
      // Submit form
      await this.page.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await this.page.waitForURL('**/dashboard');
      await this.page.waitForLoadState('networkidle');
      
      console.log('✅ Successfully logged in');
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  /**
   * Execute page actions before screenshot
   */
  async executeActions(actions) {
    if (!actions || actions.length === 0) return;
    
    console.log(`🔄 Executing ${actions.length} actions...`);
    
    for (const action of actions) {
      switch (action) {
        case 'click-first-lead':
          await this.page.click('table tbody tr:first-child');
          await this.page.waitForTimeout(1000);
          break;
          
        case 'open-whatsapp-tab':
          await this.page.click('[data-testid="whatsapp-tab"]');
          await this.page.waitForTimeout(1000);
          break;
          
        case 'open-bant-tab':
          await this.page.click('[data-testid="bant-tab"]');
          await this.page.waitForTimeout(1000);
          break;
          
        case 'open-compose-message':
          await this.page.click('[data-testid="compose-message-btn"]');
          await this.page.waitForTimeout(1000);
          break;
          
        default:
          console.warn(`⚠️  Unknown action: ${action}`);
      }
    }
    
    console.log('✅ Actions executed');
  }

  /**
   * Add annotations to screenshot
   */
  async addAnnotations(imagePath, annotations) {
    // For now, we'll just save annotations as metadata
    // In a full implementation, you could use image processing libraries
    // to add visual annotations to the screenshots
    
    const annotationsPath = imagePath.replace('.png', '-annotations.json');
    await fs.writeFile(annotationsPath, JSON.stringify({
      image: path.basename(imagePath),
      annotations: annotations,
      timestamp: new Date().toISOString()
    }, null, 2));
  }

  /**
   * Capture a single screenshot
   */
  async captureScreenshot(requirement) {
    console.log(`\n📸 Capturing: ${requirement.title}`);
    console.log(`📝 Description: ${requirement.description}`);
    
    try {
      // Navigate to page
      const fullUrl = `${CONFIG.BASE_URL}${requirement.path}`;
      console.log(`🌐 Navigating to: ${fullUrl}`);
      
      await this.page.goto(fullUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Execute any required actions
      if (requirement.actions) {
        await this.executeActions(requirement.actions);
      }
      
      // Wait for page to be fully loaded
      await this.page.waitForTimeout(2000);
      
      // Ensure output directory exists
      await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
      
      // Take screenshot
      const screenshotPath = path.join(CONFIG.OUTPUT_DIR, `${requirement.name}.png`);
      await this.page.screenshot({
        path: screenshotPath,
        ...CONFIG.SCREENSHOT_OPTIONS
      });
      
      // Add annotations
      await this.addAnnotations(screenshotPath, requirement.annotations);
      
      console.log(`✅ Screenshot saved: ${screenshotPath}`);
      
      this.results.captures.push({
        name: requirement.name,
        title: requirement.title,
        description: requirement.description,
        path: requirement.path,
        screenshot_path: screenshotPath,
        annotations: requirement.annotations,
        success: true,
        timestamp: new Date().toISOString()
      });
      
      this.results.successful_captures++;
      
    } catch (error) {
      console.error(`❌ Failed to capture ${requirement.name}:`, error);
      
      this.results.captures.push({
        name: requirement.name,
        title: requirement.title,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      this.results.failed_captures++;
    }
  }

  /**
   * Capture all required screenshots
   */
  async captureAllScreenshots() {
    console.log('📸 Starting screenshot capture for Meta submission');
    console.log(`📋 Capturing ${SCREENSHOT_REQUIREMENTS.length} screenshots`);
    console.log('=' * 60);
    
    for (const requirement of SCREENSHOT_REQUIREMENTS) {
      await this.captureScreenshot(requirement);
      
      // Wait between screenshots to avoid overwhelming the server
      await this.page.waitForTimeout(1000);
    }
    
    console.log('\n📊 Screenshot Capture Complete!');
    console.log(`✅ Successful: ${this.results.successful_captures}`);
    console.log(`❌ Failed: ${this.results.failed_captures}`);
    console.log(`📈 Success Rate: ${((this.results.successful_captures / this.results.total_screenshots) * 100).toFixed(1)}%`);
  }

  /**
   * Generate demo metadata for screenshots
   */
  generateDemoMetadata() {
    return {
      submission_info: {
        app_name: 'OvenAI - Real Estate Lead Management',
        submission_date: new Date().toISOString(),
        platform: 'WhatsApp Business API',
        version: '1.0.0'
      },
      screenshots: this.results.captures.map(capture => ({
        filename: path.basename(capture.screenshot_path || ''),
        title: capture.title,
        description: capture.description,
        annotations: capture.annotations,
        use_case: this.getUseCaseForScreenshot(capture.name)
      })),
      technical_specs: {
        resolution: `${CONFIG.VIEWPORT.width}x${CONFIG.VIEWPORT.height}`,
        format: 'PNG',
        browser: 'Chromium',
        capture_date: this.results.timestamp
      }
    };
  }

  /**
   * Get use case for screenshot
   */
  getUseCaseForScreenshot(screenshotName) {
    const useCases = {
      'dashboard-overview': 'System Overview and Navigation',
      'whatsapp-templates': 'Template Management and Compliance',
      'lead-conversation': 'Customer Communication',
      'bant-qualification': 'Lead Qualification Process',
      'whatsapp-analytics': 'Performance Monitoring',
      'template-composer': 'Message Composition',
      'lead-management': 'Customer Relationship Management',
      'queue-management': 'Automated Processing'
    };
    
    return useCases[screenshotName] || 'General Functionality';
  }

  /**
   * Save capture results
   */
  async saveResults() {
    try {
      const metadata = this.generateDemoMetadata();
      
      // Save detailed results
      const resultsPath = path.join(CONFIG.OUTPUT_DIR, 'capture-results.json');
      await fs.writeFile(resultsPath, JSON.stringify({
        ...this.results,
        metadata: metadata
      }, null, 2));

      // Save Meta submission summary
      const summaryPath = path.join(CONFIG.OUTPUT_DIR, 'META_SUBMISSION_ASSETS.md');
      const summary = `# Meta WhatsApp Business Submission Assets

## Screenshot Summary
- **Total Screenshots:** ${this.results.total_screenshots}
- **Successfully Captured:** ${this.results.successful_captures}
- **Failed Captures:** ${this.results.failed_captures}
- **Success Rate:** ${((this.results.successful_captures / this.results.total_screenshots) * 100).toFixed(1)}%
- **Capture Date:** ${new Date(this.results.timestamp).toLocaleString()}

## Screenshot Details

${this.results.captures.filter(c => c.success).map(capture => `
### ${capture.title}
- **Filename:** \`${path.basename(capture.screenshot_path || '')}\`
- **Description:** ${capture.description}
- **Use Case:** ${this.getUseCaseForScreenshot(capture.name)}
- **Annotations:**
${capture.annotations.map(annotation => `  - ${annotation}`).join('\n')}
`).join('')}

## Technical Specifications
- **Resolution:** ${CONFIG.VIEWPORT.width}x${CONFIG.VIEWPORT.height}
- **Format:** PNG (High Quality)
- **Browser:** Chromium
- **Viewport:** Desktop

## Submission Checklist
${this.results.captures.map(capture => `- [${capture.success ? 'x' : ' '}] ${capture.title}`).join('\n')}

## Usage Instructions
1. Review all captured screenshots for quality and completeness
2. Ensure annotations are clearly visible and relevant
3. Include these assets in your Meta Business Manager submission
4. Reference the use cases when describing app functionality

*Generated automatically for Meta WhatsApp Business API submission*
`;

      await fs.writeFile(summaryPath, summary);

      console.log(`📁 Results saved to: ${CONFIG.OUTPUT_DIR}`);
      console.log(`📄 Detailed results: ${resultsPath}`);
      console.log(`📋 Submission summary: ${summaryPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }

  /**
   * Cleanup browser resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🧹 Browser cleanup complete');
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('📸 Meta WhatsApp Business Screenshot Capture');
  console.log('============================================');
  
  const capturer = new ScreenshotCapture();
  
  try {
    // Initialize browser
    await capturer.initialize();
    
    // Login to application
    await capturer.login();
    
    // Capture all screenshots
    await capturer.captureAllScreenshots();
    
    // Save results
    await capturer.saveResults();
    
    console.log('\n🎉 Screenshot Capture Complete!');
    console.log('📦 Demo assets ready for Meta submission');
    
    if (capturer.results.successful_captures === capturer.results.total_screenshots) {
      console.log('✅ All screenshots captured successfully!');
      process.exit(0);
    } else {
      console.log('⚠️  Some screenshots failed - Review results');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Screenshot capture failed:', error);
    process.exit(1);
  } finally {
    await capturer.cleanup();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ScreenshotCapture, SCREENSHOT_REQUIREMENTS }; 