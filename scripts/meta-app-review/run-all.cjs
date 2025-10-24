#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Meta App Review Master Script
 * 
 * Runs all processes needed for Meta WhatsApp Business API submission
 */

const SCRIPTS_DIR = path.join(__dirname);
const BASE_DIR = path.join(__dirname, '..', '..');

console.log('🚀 Meta App Review Master Script');
console.log('================================');
console.log('This script will prepare your complete Meta WhatsApp Business API submission package');
console.log('');

// Check if dev server is running
function checkDevServer() {
  console.log('🔍 Checking if development server is running...');
  
  try {
    const response = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', { 
      encoding: 'utf8',
      timeout: 5000 
    });
    
    if (response.trim() === '200') {
      console.log('✅ Development server is running at http://localhost:3000');
      return true;
    } else {
      console.log('❌ Development server is not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to development server');
    return false;
  }
}

// Start development server
function startDevServer() {
  console.log('🚀 Starting development server...');
  console.log('Please wait for the server to start, then press Enter to continue...');
  
  // Start server in background
  const serverProcess = execSync('npm run dev &', { 
    cwd: BASE_DIR,
    stdio: 'inherit'
  });
  
  // Wait for user confirmation
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', () => {
    process.stdin.setRawMode(false);
    process.stdin.pause();
  });
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing required dependencies...');
  
  try {
    execSync('npm install puppeteer', { 
      cwd: BASE_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Run screenshot capture
function runScreenshotCapture() {
  console.log('\n📸 STEP 1: Capturing Screenshots');
  console.log('================================');
  
  try {
    execSync(`node "${path.join(SCRIPTS_DIR, 'capture-screenshots.cjs')}"`, {
      cwd: BASE_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Screenshots captured successfully');
  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
    console.log('⚠️ Continuing with next step...');
  }
}

// Run video recording
function runVideoRecording() {
  console.log('\n🎬 STEP 2: Recording Demo Video');
  console.log('===============================');
  
  try {
    execSync(`node "${path.join(SCRIPTS_DIR, 'record-demo-video.cjs')}"`, {
      cwd: BASE_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Video recording sequence completed');
  } catch (error) {
    console.error('❌ Video recording failed:', error.message);
    console.log('⚠️ Continuing with next step...');
  }
}

// Create submission package
function createSubmissionPackage() {
  console.log('\n📦 STEP 3: Creating Submission Package');
  console.log('======================================');
  
  try {
    execSync(`node "${path.join(SCRIPTS_DIR, 'create-submission-package.cjs')}"`, {
      cwd: BASE_DIR,
      stdio: 'inherit'
    });
    console.log('✅ Submission package created successfully');
  } catch (error) {
    console.error('❌ Package creation failed:', error.message);
    console.log('⚠️ Continuing with summary...');
  }
}

// Show final summary
function showSummary() {
  console.log('\n🎉 META APP REVIEW PREPARATION COMPLETE!');
  console.log('========================================');
  
  const submissionDir = path.join(BASE_DIR, 'docs', '04-COMPLIANCE', 'app-review', 'submission-package');
  const screenshotsDir = path.join(BASE_DIR, 'docs', '04-COMPLIANCE', 'app-review', 'screenshots');
  const videoDir = path.join(BASE_DIR, 'docs', '04-COMPLIANCE', 'app-review', 'video');
  
  console.log('\n📁 Generated Files:');
  
  // Check screenshots
  if (fs.existsSync(screenshotsDir)) {
    const desktopCount = fs.existsSync(path.join(screenshotsDir, 'desktop')) ? 
      fs.readdirSync(path.join(screenshotsDir, 'desktop')).filter(f => f.endsWith('.png')).length : 0;
    const mobileCount = fs.existsSync(path.join(screenshotsDir, 'mobile')) ? 
      fs.readdirSync(path.join(screenshotsDir, 'mobile')).filter(f => f.endsWith('.png')).length : 0;
    
    console.log(`📸 Screenshots: ${desktopCount + mobileCount} total (${desktopCount} desktop + ${mobileCount} mobile)`);
  } else {
    console.log('❌ Screenshots: Not found');
  }
  
  // Check video
  if (fs.existsSync(videoDir)) {
    const videoFiles = fs.readdirSync(videoDir);
    console.log(`🎬 Video: ${videoFiles.length} files generated`);
  } else {
    console.log('❌ Video: Not found');
  }
  
  // Check submission package
  if (fs.existsSync(submissionDir)) {
    console.log(`📦 Submission Package: ${submissionDir}`);
  } else {
    console.log('❌ Submission Package: Not found');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Review all generated screenshots for quality');
  console.log('2. Record the actual demo video using screen recording software');
  console.log('3. Review the submission package contents');
  console.log('4. Submit to Meta Business Manager');
  console.log('5. Monitor the review process');
  
  console.log('\n📚 Documentation:');
  console.log('- META_COMPLIANCE_ANALYSIS.md: Compliance requirements');
  console.log('- META_TEST_INSTRUCTIONS.md: Testing instructions for Meta');
  console.log('- META_WHATSAPP_SUBMISSION_GUIDE.md: Complete submission guide');
  console.log('- SCREENSHOT_CAPTURE_INSTRUCTIONS.md: Screenshot details');
  console.log('- SCREENSHOT_PLAN.md: Screenshot planning');
  
  console.log('\n🎯 Status: Ready for Meta App Provider Review!');
}

// Main execution
async function main() {
  console.log('Starting Meta App Review preparation...\n');
  
  // Check prerequisites
  if (!checkDevServer()) {
    console.log('\n⚠️ Development server is not running.');
    console.log('Please start the development server with: npm run dev');
    console.log('Then run this script again.');
    process.exit(1);
  }
  
  // Install dependencies
  installDependencies();
  
  // Run all steps
  runScreenshotCapture();
  runVideoRecording();
  createSubmissionPackage();
  
  // Show summary
  showSummary();
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}); 