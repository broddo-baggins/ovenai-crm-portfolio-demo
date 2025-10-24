#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🎨 Starting Dark Mode Color Audit Fix...\n');

// Color mappings as specified in beautificationV1.md
const colorMappings = {
  // Background colors
  'dark:bg-gray-900': 'dark:bg-slate-900',
  'dark:bg-gray-800': 'dark:bg-slate-800',
  'dark:bg-gray-700': 'dark:bg-slate-700',
  'dark:bg-gray-600': 'dark:bg-slate-600',
  'dark:bg-gray-500': 'dark:bg-slate-500',
  'dark:bg-gray-400': 'dark:bg-slate-400',
  'dark:bg-gray-300': 'dark:bg-slate-300',
  'dark:bg-gray-200': 'dark:bg-slate-200',
  'dark:bg-gray-100': 'dark:bg-slate-100',
  'dark:bg-gray-50': 'dark:bg-slate-50',
  
  // Text colors  
  'dark:text-gray-900': 'dark:text-slate-900',
  'dark:text-gray-800': 'dark:text-slate-800',
  'dark:text-gray-700': 'dark:text-slate-700',
  'dark:text-gray-600': 'dark:text-slate-600',
  'dark:text-gray-500': 'dark:text-slate-500',
  'dark:text-gray-400': 'dark:text-slate-400',
  'dark:text-gray-300': 'dark:text-slate-300',
  'dark:text-gray-200': 'dark:text-slate-200',
  'dark:text-gray-100': 'dark:text-slate-100',
  
  // Border colors
  'dark:border-gray-900': 'dark:border-slate-900',
  'dark:border-gray-800': 'dark:border-slate-800',
  'dark:border-gray-700': 'dark:border-slate-700',
  'dark:border-gray-600': 'dark:border-slate-600',
  'dark:border-gray-500': 'dark:border-slate-500',
  'dark:border-gray-400': 'dark:border-slate-400',
  'dark:border-gray-300': 'dark:border-slate-300',
  'dark:border-gray-200': 'dark:border-slate-200',
  
  // Hover colors
  'dark:hover:bg-gray-900': 'dark:hover:bg-slate-900',
  'dark:hover:bg-gray-800': 'dark:hover:bg-slate-800',
  'dark:hover:bg-gray-700': 'dark:hover:bg-slate-700',
  'dark:hover:bg-gray-600': 'dark:hover:bg-slate-600',
  'dark:hover:bg-gray-500': 'dark:hover:bg-slate-500',
  
  // Focus colors
  'dark:focus:bg-gray-800': 'dark:focus:bg-slate-800',
  'dark:focus:bg-gray-700': 'dark:focus:bg-slate-700',
  
  // Ring colors
  'dark:ring-gray-700': 'dark:ring-slate-700',
  'dark:ring-gray-600': 'dark:ring-slate-600',
  
  // Divide colors
  'dark:divide-gray-700': 'dark:divide-slate-700',
  'dark:divide-gray-600': 'dark:divide-slate-600'
};

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let changes = [];

  for (const [oldColor, newColor] of Object.entries(colorMappings)) {
    const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    
    if (matches) {
      content = content.replace(regex, newColor);
      modified = true;
      changes.push({ old: oldColor, new: newColor, count: matches.length });
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
    changes.forEach(change => {
      console.log(`   ${change.old} → ${change.new} (${change.count} occurrences)`);
    });
    console.log('');
  }

  return { modified, changes };
}

function processFiles() {
  // Target TypeScript/JavaScript files in src directory
  const patterns = [
    'src/**/*.{tsx,ts,jsx,js}',
    'src/**/*.css',
    'src/**/*.md'
  ];

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalChanges = 0;

  patterns.forEach(pattern => {
    const files = glob.sync(pattern, {
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '.git/**',
        '**/*.min.*'
      ]
    });

    files.forEach(file => {
      totalFiles++;
      const result = replaceColorsInFile(file);
      
      if (result.modified) {
        modifiedFiles++;
        totalChanges += result.changes.reduce((sum, change) => sum + change.count, 0);
      }
    });
  });

  console.log('🎉 Color Audit Fix Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Files processed: ${totalFiles}`);
  console.log(`   - Files modified: ${modifiedFiles}`);
  console.log(`   - Total color changes: ${totalChanges}`);
  console.log('\n✨ Dark mode now uses slate colors instead of grey!');
  console.log('\n⚠️  Please review the changes and test the application before committing.');
}

// Run the fix
try {
  processFiles();
} catch (error) {
  console.error('❌ Error during color audit fix:', error.message);
  process.exit(1);
} 