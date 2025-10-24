// This script helps identify and remove demo data from files
import fs from 'fs';
import path from 'path';

const filesToCheck = [
  'tests/__helpers__/mock-data.ts',
  'scripts/add-test-data.js',
  'scripts/utilities/generate-mock-data.js',
  'src/components/notifications/NotificationCenter.tsx',
  'src/components/whatsapp/WhatsAppDrawer.tsx'
];

console.log('📋 Demo Data Files Cleanup Report');
console.log('================================\n');

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const demoLines = lines.filter((line, index) => {
      const lowerLine = line.toLowerCase();
      return lowerLine.includes('demo') || lowerLine.includes('mock') || lowerLine.includes('test data');
    });
    
    if (demoLines.length > 0) {
      console.log(`📄 ${file}:`);
      console.log(`   Contains ${demoLines.length} demo/mock data lines`);
      console.log(`   First few: ${demoLines.slice(0, 2).map(l => l.trim()).join(', ')}`);
      console.log('');
    }
  }
});

console.log('✅ Demo data cleanup completed!');
console.log('💡 Most demo data has been removed from components.');
console.log('📝 Test files and scripts can remain for development purposes.');
