const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Simple Meta App Review Video Recording
 * 
 * This script creates a 60-second screen recording for Meta app review
 * Shows the Calendly OAuth integration in action
 */

const VIDEO_CONFIG = {
  duration: 60, // 60 seconds
  fps: 30,
  width: 1920,
  height: 1080,
  format: 'mp4'
};

const OUTPUT_DIR = 'docs/04-COMPLIANCE/app-review/video';
const OUTPUT_FILE = 'meta-demo-video.mp4';
const OUTPUT_PATH = path.join(OUTPUT_DIR, OUTPUT_FILE);

async function createVideoDirectory() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created directory: ${OUTPUT_DIR}`);
  }
}

async function recordVideo() {
  console.log('🎬 Meta App Review - Simple Video Recording');
  console.log('='.repeat(50));
  
  // Create output directory
  await createVideoDirectory();
  
  // Remove existing video if it exists
  if (fs.existsSync(OUTPUT_PATH)) {
    fs.unlinkSync(OUTPUT_PATH);
    console.log('🗑️ Removed existing video file');
  }
  
  console.log('🎥 Starting screen recording...');
  console.log(`📁 Output: ${OUTPUT_PATH}`);
  console.log(`⏱️ Duration: ${VIDEO_CONFIG.duration} seconds`);
  console.log(`🎯 Resolution: ${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`);
  console.log('');
  
  // FFmpeg command for macOS screen recording
  const ffmpegArgs = [
    '-f', 'avfoundation',
    '-i', '1:0', // Screen capture (1) + audio (0)
    '-r', VIDEO_CONFIG.fps.toString(),
    '-s', `${VIDEO_CONFIG.width}x${VIDEO_CONFIG.height}`,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-t', VIDEO_CONFIG.duration.toString(),
    '-y', // Overwrite output file
    OUTPUT_PATH
  ];
  
  console.log('🎬 Recording started! Please demonstrate the following:');
  console.log('');
  console.log('   1. 🏠 Dashboard Overview (0-10s)');
  console.log('   2. ⚙️ Settings → API Integrations (10-20s)');
  console.log('   3. 📅 Calendly OAuth Connection (20-35s)');
  console.log('   4. ✅ Connection Success (35-45s)');
  console.log('   5. 🎯 Feature Demonstration (45-60s)');
  console.log('');
  console.log('🎬 Recording will automatically stop after 60 seconds...');
  console.log('');
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    
    let output = '';
    let errorOutput = '';
    
    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
      // Show progress if available
      if (data.toString().includes('time=')) {
        process.stdout.write('⏱️ Recording in progress...\r');
      }
    });
    
    ffmpeg.on('close', (code) => {
      console.log('');
      
      if (code === 0) {
        console.log('✅ Video recording completed successfully!');
        console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
        
        // Check if file was created and get its size
        if (fs.existsSync(OUTPUT_PATH)) {
          const stats = fs.statSync(OUTPUT_PATH);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`📊 File size: ${sizeInMB} MB`);
        }
        
        resolve();
      } else {
        console.log('❌ Video recording failed');
        console.log(`Exit code: ${code}`);
        console.log(`Error: ${errorOutput}`);
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.log('❌ FFmpeg error:', error.message);
      reject(error);
    });
  });
}

async function main() {
  try {
    await recordVideo();
    
    console.log('');
    console.log('🎉 SUCCESS: Video recording completed!');
    console.log(`📁 Video saved to: ${OUTPUT_PATH}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Review the video quality');
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

module.exports = { recordVideo }; 