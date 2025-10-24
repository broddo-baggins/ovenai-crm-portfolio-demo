const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressImages() {
  console.log('🖼️  Compressing large images with Sharp...');
  
  const imagesToCompress = [
    'src/assets/images/avatars/michal-profile.jpg',
    'src/assets/michal-avatar.jpg'
  ];

  try {
    for (const imagePath of imagesToCompress) {
      if (!fs.existsSync(imagePath)) {
        console.log(`⚠️  Image not found: ${imagePath}`);
        continue;
      }

      const originalSize = fs.statSync(imagePath).size;
      console.log(`📸 Processing ${path.basename(imagePath)} (${(originalSize/1024/1024).toFixed(2)}MB)...`);
      
      // Create compressed version
      const tempPath = imagePath + '.compressed';
      await sharp(imagePath)
        .jpeg({ 
          quality: 75, 
          progressive: true,
          mozjpeg: true 
        })
        .toFile(tempPath);
      
      const compressedSize = fs.statSync(tempPath).size;
      const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
      
      // Replace original with compressed version
      fs.renameSync(tempPath, imagePath);
      
      console.log(`   ✅ ${path.basename(imagePath)}: ${(originalSize/1024/1024).toFixed(2)}MB → ${(compressedSize/1024/1024).toFixed(2)}MB (${savings}% smaller)`);
    }
    
    console.log('🎉 Image compression completed successfully!');
    
  } catch (error) {
    console.error('❌ Error compressing images:', error);
    process.exit(1);
  }
}

compressImages(); 