#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Test Migration Safety Analysis Script
 * Analyzes whether moving Playwright files from root to tests/Validation is safe
 */

console.log('🔍 ANALYZING TEST FILE MIGRATION SAFETY');
console.log('=' .repeat(50));

// Files that could be moved to tests/Validation
const testFilesToAnalyze = [
  'playwright.config.ts',
  'playwright.config.admin.ts', 
  'playwright.queue.config.ts',
  'playwright.mobile.config.ts',
  'test-results/',
  'test-results-mobile/',
  'test-outputs/',
  'playwright-report-mobile/',
  'playwright-report-queue/',
  'e2e-test-results.json',
  'e2e-regression-results.log',
  'test-failures.log',
  'vitest.config.ts'
];

// Critical files that should NOT be moved
const criticalFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'tailwind.config.ts',
  'eslint.config.js',
  '.gitignore'
];

function analyzeDependencies() {
  console.log('\n📦 ANALYZING DEPENDENCIES');
  console.log('-'.repeat(30));

  // Check package.json scripts
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts || {};
    
    console.log('🔍 Package.json scripts that reference test files:');
    Object.entries(scripts).forEach(([name, script]) => {
      testFilesToAnalyze.forEach(file => {
        if (script.includes(file.replace('/', ''))) {
          console.log(`  ⚠️  ${name}: ${script}`);
        }
      });
    });
  } catch (error) {
    console.log('❌ Error reading package.json:', error.message);
  }
}

function analyzeConfigReferences() {
  console.log('\n🔧 ANALYZING CONFIG FILE REFERENCES');
  console.log('-'.repeat(40));

  const configFiles = [
    'vite.config.ts',
    'tsconfig.json',
    'tsconfig.app.json', 
    'tsconfig.node.json',
    'eslint.config.js',
    '.eslintrc.json'
  ];

  configFiles.forEach(configFile => {
    if (fs.existsSync(configFile)) {
      try {
        const content = fs.readFileSync(configFile, 'utf8');
        
        testFilesToAnalyze.forEach(testFile => {
          if (content.includes(testFile.replace('/', ''))) {
            console.log(`  ⚠️  ${configFile} references ${testFile}`);
          }
        });
      } catch (error) {
        console.log(`❌ Error reading ${configFile}:`, error.message);
      }
    }
  });
}

function analyzeGitHubWorkflows() {
  console.log('\n🔄 ANALYZING GITHUB WORKFLOWS');
  console.log('-'.repeat(30));

  const workflowDir = '.github/workflows';
  if (fs.existsSync(workflowDir)) {
    const workflows = fs.readdirSync(workflowDir);
    
    workflows.forEach(workflow => {
      try {
        const content = fs.readFileSync(path.join(workflowDir, workflow), 'utf8');
        
        testFilesToAnalyze.forEach(testFile => {
          if (content.includes(testFile.replace('/', ''))) {
            console.log(`  ⚠️  ${workflow} references ${testFile}`);
          }
        });
      } catch (error) {
        console.log(`❌ Error reading ${workflow}:`, error.message);
      }
    });
  } else {
    console.log('  ℹ️  No GitHub workflows found');
  }
}

function analyzePlaywrightConfigs() {
  console.log('\n🎭 ANALYZING PLAYWRIGHT CONFIGURATIONS');
  console.log('-'.repeat(40));

  const playwrightConfigs = testFilesToAnalyze.filter(f => f.includes('playwright') && f.includes('.ts'));
  
  playwrightConfigs.forEach(config => {
    if (fs.existsSync(config)) {
      try {
        const content = fs.readFileSync(config, 'utf8');
        
        // Check for relative path references
        const relativePathPattern = /['"]\.\.?\//g;
        const matches = content.match(relativePathPattern);
        
        if (matches) {
          console.log(`  📁 ${config} uses relative paths:`, matches);
        }
        
        // Check for output directory configurations
        if (content.includes('outputDir') || content.includes('testDir')) {
          console.log(`  📤 ${config} configures output/test directories`);
        }
        
      } catch (error) {
        console.log(`❌ Error reading ${config}:`, error.message);
      }
    }
  });
}

function checkCurrentWorkingDirectory() {
  console.log('\n📍 CHECKING CURRENT WORKING DIRECTORY DEPENDENCIES');
  console.log('-'.repeat(50));

  // Check if any scripts rely on CWD being project root
  const scriptsDir = 'scripts';
  if (fs.existsSync(scriptsDir)) {
    try {
      const scriptFiles = fs.readdirSync(scriptsDir, { recursive: true });
      
      let cwdDependencies = 0;
      scriptFiles.forEach(file => {
        if (file.endsWith('.js') || file.endsWith('.cjs') || file.endsWith('.mjs')) {
          try {
            const fullPath = path.join(scriptsDir, file);
            const content = fs.readFileSync(fullPath, 'utf8');
            
            if (content.includes('process.cwd()') || content.includes('__dirname')) {
              cwdDependencies++;
            }
          } catch (error) {
            // Skip unreadable files
          }
        }
      });
      
      console.log(`  📊 Found ${cwdDependencies} scripts that may depend on current working directory`);
    } catch (error) {
      console.log('❌ Error analyzing scripts:', error.message);
    }
  }
}

function generateMigrationPlan() {
  console.log('\n📋 MIGRATION PLAN ANALYSIS');
  console.log('-'.repeat(30));

  const safeToMove = [];
  const requiresConfigUpdate = [];
  const potentiallyUnsafe = [];

  // Categorize files based on analysis
  testFilesToAnalyze.forEach(file => {
    if (file.includes('results') || file.includes('outputs') || file.includes('report')) {
      safeToMove.push(file);
    } else if (file.includes('config')) {
      requiresConfigUpdate.push(file);
    } else {
      potentiallyUnsafe.push(file);
    }
  });

  console.log('\n✅ SAFE TO MOVE (result/output files):');
  safeToMove.forEach(file => console.log(`  • ${file}`));

  console.log('\n⚠️  REQUIRES CONFIG UPDATES:');
  requiresConfigUpdate.forEach(file => console.log(`  • ${file}`));

  console.log('\n🚨 POTENTIALLY UNSAFE:');
  potentiallyUnsafe.forEach(file => console.log(`  • ${file}`));

  return {
    safeToMove,
    requiresConfigUpdate,
    potentiallyUnsafe
  };
}

function assessBreakageRisk() {
  console.log('\n🚨 BREAKAGE RISK ASSESSMENT');
  console.log('-'.repeat(30));

  const risks = [
    {
      level: 'LOW',
      description: 'Moving test results and outputs',
      files: ['test-results/', 'test-outputs/', 'playwright-report-*/', '*.log', '*.json results'],
      impact: 'No functional impact - these are generated files'
    },
    {
      level: 'MEDIUM',
      description: 'Moving Playwright config files',
      files: ['playwright.*.config.ts'],
      impact: 'Requires updating package.json scripts and relative paths'
    },
    {
      level: 'HIGH',
      description: 'Moving vitest.config.ts',
      files: ['vitest.config.ts'],
      impact: 'Could break Vite build process and unit test discovery'
    }
  ];

  risks.forEach(risk => {
    console.log(`\n${risk.level} RISK: ${risk.description}`);
    console.log(`  Files: ${risk.files.join(', ')}`);
    console.log(`  Impact: ${risk.impact}`);
  });
}

function provideBestPracticeRecommendation() {
  console.log('\n💡 BEST PRACTICE RECOMMENDATION');
  console.log('-'.repeat(35));

  console.log(`
🎯 RECOMMENDED APPROACH:

1. CREATE tests/Validation/ directory structure:
   tests/
   ├── Validation/
   │   ├── results/        (move test-results/, test-outputs/)
   │   ├── reports/        (move playwright-report-*/)
   │   ├── logs/          (move *.log files)
   │   └── configs/       (optionally move playwright configs)

2. SAFE MIGRATIONS (Zero Risk):
   ✅ Move all test-results* directories
   ✅ Move all playwright-report* directories  
   ✅ Move *.log files
   ✅ Move e2e-*.json files

3. RISKY MIGRATIONS (Requires Careful Planning):
   ⚠️  playwright.*.config.ts files (update package.json paths)
   🚨 vitest.config.ts (high integration risk)

4. RECOMMENDED STEPS:
   • Phase 1: Move safe files (results, reports, logs)
   • Phase 2: Test that everything still works
   • Phase 3: Optionally move configs with path updates
   • Phase 4: Update .gitignore patterns

5. ALTERNATIVE APPROACH:
   • Keep configs in root for tool discovery
   • Only move generated files and results
   • This maintains 100% compatibility while achieving clean root
  `);
}

// Run analysis
analyzeDependencies();
analyzeConfigReferences();
analyzeGitHubWorkflows();
analyzePlaywrightConfigs();
checkCurrentWorkingDirectory();
const plan = generateMigrationPlan();
assessBreakageRisk();
provideBestPracticeRecommendation();

console.log('\n🎉 ANALYSIS COMPLETE');
console.log('=' .repeat(50)); 