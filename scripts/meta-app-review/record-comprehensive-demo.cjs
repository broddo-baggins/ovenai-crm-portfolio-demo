const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Meta App Review Video Recording
 * 
 * This script creates a complete feature demonstration video showing:
 * 1. Dashboard, 2. Leads, 3. Messages, 4. Templates, 5. Projects,
 * 6. Reports, 7. Settings, 8. Admin, 9. Help, 10. Calendar, 11. Queue
 * 
 * Total duration: 120 seconds (2 minutes) - 10-11 seconds per feature
 */

const VIDEO_CONFIG = {
  duration: 120, // 2 minutes to cover all features properly
  fps: 30,
  width: 1920,
  height: 1080,
  format: 'mp4'
};

const OUTPUT_DIR = 'docs/04-COMPLIANCE/app-review/video';
const OUTPUT_FILE = 'meta-comprehensive-demo.mp4';
const OUTPUT_PATH = path.join(OUTPUT_DIR, OUTPUT_FILE);

// Comprehensive feature demonstration plan
const DEMO_SEQUENCE = [
  { feature: 'Login & Authentication', duration: 10, start: 0 },
  { feature: 'Dashboard Overview', duration: 10, start: 10 },
  { feature: 'Lead Management', duration: 12, start: 20 },
  { feature: 'Messages & WhatsApp', duration: 12, start: 32 },
  { feature: 'Templates', duration: 10, start: 44 },
  { feature: 'Projects', duration: 10, start: 54 },
  { feature: 'Reports & Analytics', duration: 10, start: 64 },
  { feature: 'Calendar Integration', duration: 12, start: 74 },
  { feature: 'Queue Management', duration: 12, start: 86 },
  { feature: 'Settings & Integrations', duration: 12, start: 98 },
  { feature: 'Admin Console', duration: 10, start: 110 }
];

async function createVideoDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }
}

async function recordVideo() {
  console.log('🎬 Meta App Review - Comprehensive Feature Demo');
  console.log('==================================================');
  console.log(`📁 Output: ${OUTPUT_PATH}`);
  console.log(`⏱️ Duration: ${VIDEO_CONFIG.duration} seconds (2 minutes)`);
  console.log(`🎯 Resolution: ${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`);
  console.log('');
  console.log('📋 Demo Sequence (2 minutes - all features):');
  console.log('   1. Dashboard Overview (0-10s)');
  console.log('   2. Leads Management (10-20s)'); 
  console.log('   3. Messages & WhatsApp (20-30s)');
  console.log('   4. Templates System (30-40s)');
  console.log('   5. Projects Management (40-50s)');
  console.log('   6. Reports & Analytics (50-60s)');
  console.log('   7. Settings & Integrations (60-70s)');
  console.log('   8. Admin Console (70-80s)');
  console.log('   9. FAQ & Help (80-90s)');
  console.log('  10. Calendar Integration (90-100s)');
  console.log('  11. Queue Management (100-120s)');
  console.log('');
  console.log('🎬 Recording will automatically stop after 2 minutes...');
  console.log('');
  
  // Start FFmpeg recording with automatic stop after duration
  const ffmpeg = spawn('ffmpeg', [
    '-y', // Overwrite output file
    '-f', 'avfoundation', // macOS screen capture
    '-framerate', VIDEO_CONFIG.fps.toString(),
    '-i', '1:none', // Capture main display, no audio
    '-t', VIDEO_CONFIG.duration.toString(), // Record for exactly 120 seconds
    '-vf', `scale=${VIDEO_CONFIG.width}:${VIDEO_CONFIG.height}`, // Scale to resolution
    '-c:v', 'libx264', // H.264 codec
    '-preset', 'medium', // Balance quality/speed
    '-crf', '23', // Quality (lower = better, 23 is good)
    '-pix_fmt', 'yuv420p', // Compatibility
    OUTPUT_PATH
  ]);

  ffmpeg.stdout.on('data', (data) => {
    console.log(`📹 ${data}`);
  });

  ffmpeg.stderr.on('data', (data) => {
    // FFmpeg outputs progress to stderr
    const output = data.toString();
    if (output.includes('frame=')) {
      process.stdout.write('\r🎬 Recording progress: ' + output.trim());
    }
  });

  ffmpeg.on('close', (code) => {
    console.log('');
    if (code === 0) {
      console.log('✅ Recording completed successfully!');
      console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
      
      // Get file size
      const stats = fs.statSync(OUTPUT_PATH);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`📊 File size: ${fileSizeInMB} MB`);
      
      console.log('');
      console.log('🎯 Next Steps:');
      console.log('1. Review the video to ensure all features are shown');
      console.log('2. Upload to Meta App Review dashboard');
      console.log('3. Submit for review');
    } else {
      console.error(`❌ Recording failed with code ${code}`);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure FFmpeg is installed: brew install ffmpeg');
      console.log('2. Grant screen recording permissions in System Preferences');
      console.log('3. Try running with sudo if permission denied');
    }
    
    process.exit(code);
  });

  ffmpeg.on('error', (err) => {
    console.error('❌ FFmpeg error:', err.message);
    if (err.message.includes('ENOENT')) {
      console.log('');
      console.log('🔧 FFmpeg not found. Install it with:');
      console.log('   brew install ffmpeg');
    }
    process.exit(1);
  });

  // Show demo instructions while recording
  console.log('');
  console.log('🎯 DEMO INSTRUCTIONS:');
  console.log('====================');
  
  for (const scene of DEMO_SEQUENCE) {
    setTimeout(() => {
      console.log(`\n⏰ [${scene.start/1000}s] Navigate to: ${scene.feature}`);
      console.log(`   Actions: ${scene.feature} ✓`);
    }, scene.start);
  }
}

async function main() {
  try {
    await recordVideo();
    
    console.log('');
    console.log('🎉 SUCCESS: Comprehensive demo video completed!');
    console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
    console.log('');
    console.log('✅ Features demonstrated:');
    DEMO_SEQUENCE.forEach((scene, index) => {
      console.log(`   ${index + 1}. ${scene.feature} ✓`);
    });
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Review the video quality and content');
    console.log('  2. Upload to Meta Business Manager');
    console.log('  3. Submit app for review');
    console.log('');
    console.log('🎬 Video ready for Meta app review submission!');
    
  } catch (error) {
    console.error('❌ Recording failed:', error.message);
    process.exit(1);
  }
}

// Run the recording if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { recordVideo, DEMO_SEQUENCE }; 