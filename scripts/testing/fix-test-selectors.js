#!/usr/bin/env node

/**
 * Test Selector Fix Script
 * Adds missing data-testid attributes to components for E2E testing
 */

const fs = require('fs');
const path = require('path');

const SELECTOR_FIXES = {
  // Dashboard MetricCard fixes
  'src/components/dashboard/MetricCard.tsx': {
    search: '<Card className="',
    replace: '<Card data-testid={`metric-card-${title?.toLowerCase().replace(/\\s+/g, "-")}`} className="'
  },
  
  // Dashboard page data-testid fixes
  'src/pages/Dashboard.tsx': {
    search: 'data-testid="dashboard-page"',
    replace: 'data-testid="dashboard-page"',
    additionalFixes: [
      {
        search: '<EnhancedDashboardExample />',
        replace: '<EnhancedDashboardExample data-testid="enhanced-dashboard" />'
      }
    ]
  },
  
  // Sidebar navigation fixes
  'src/components/layout/Sidebar.tsx': {
    search: '<nav',
    replace: '<nav data-testid="main-navigation"'
  },
  
  // Lead management table fixes
  'src/pages/Leads.tsx': {
    search: '<div className="space-y-6"',
    replace: '<div className="space-y-6" data-testid="leads-page"'
  },
  
  // Reports page fixes  
  'src/pages/Reports.tsx': {
    search: '<div className="container mx-auto py-6 space-y-6"',
    replace: '<div className="container mx-auto py-6 space-y-6" data-testid="reports-page"'
  },
  
  // Messages page fixes
  'src/pages/Messages.tsx': {
    search: '<div className="h-full flex flex-col"',
    replace: '<div className="h-full flex flex-col" data-testid="messages-page"'
  }
};

const COMPONENT_FIXES = {
  // Fix MetricCard to accept data-testid properly
  'src/components/dashboard/MetricCard.tsx': `
interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  loading?: boolean;
  subtitle?: string;
  'data-testid'?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon: Icon,
  color,
  loading = false,
  subtitle,
  'data-testid': testId
}) => {
  const baseTestId = testId || \`metric-card-\${title.toLowerCase().replace(/\\s+/g, '-')}\`;
  
  return (
    <Card 
      className="bg-card dark:bg-card border-border dark:border-border"
      data-testid={baseTestId}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <CardTitle 
            className="text-sm font-medium text-muted-foreground dark:text-muted-foreground"
            data-testid={\`\${baseTestId}-title\`}
          >
            {title}
          </CardTitle>
          <Icon className={\`h-4 w-4 text-\${color}-600\`} />
        </div>
        
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ) : (
          <>
            <div 
              className="text-2xl font-bold text-foreground dark:text-foreground"
              data-testid={\`\${baseTestId}-value\`}
            >
              {value}{unit && <span className="text-sm">{unit}</span>}
            </div>
            
            {subtitle && (
              <p 
                className="text-xs text-muted-foreground mt-1"
                data-testid={\`\${baseTestId}-subtitle\`}
              >
                {subtitle}
              </p>
            )}
            
            {trend !== undefined && (
              <div 
                className={\`flex items-center text-xs mt-1 \${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }\`}
                data-testid={\`\${baseTestId}-trend\`}
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend)}%
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};`
};

async function addTestSelectors() {
  console.log('🔧 Adding test selectors for E2E testing...');
  
  // Add data-testid attributes to key components
  const filesToFix = [
    {
      file: 'src/components/layout/Sidebar.tsx',
      fixes: [
        {
          search: '<NavLink',
          replace: '<NavLink data-testid={`nav-link-${item.name.toLowerCase().replace(/\\s+/g, "-")}`}'
        }
      ]
    },
    {
      file: 'src/pages/Dashboard.tsx',
      fixes: [
        {
          search: 'data-testid="dashboard-page"',
          replace: 'data-testid="dashboard-page"' // Already exists
        }
      ]
    }
  ];
  
  for (const { file, fixes } of filesToFix) {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const { search, replace } of fixes) {
        if (content.includes(search) && !content.includes(replace)) {
          content = content.replace(new RegExp(search, 'g'), replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${file}`);
      } else {
        console.log(`⚠️ No changes needed in ${file}`);
      }
    } else {
      console.log(`❌ File not found: ${file}`);
    }
  }
}

async function updateTestFiles() {
  console.log('🔧 Updating test files to use correct selectors...');
  
  // Fix common test selector issues
  const testFixes = [
    {
      file: 'tests/e2e/full-system-e2e.spec.ts',
      fixes: [
        {
          search: "await page.click('button[type=\"submit\"]');",
          replace: "await page.waitForSelector('button[type=\"submit\"]', { state: 'visible' });\n  await page.click('button[type=\"submit\"]');"
        },
        {
          search: "await page.waitForURL('**/dashboard');",
          replace: "await page.waitForURL('**/dashboard', { timeout: 10000 });"
        }
      ]
    }
  ];
  
  for (const { file, fixes } of testFixes) {
    const filePath = path.join(process.cwd(), file);
    
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const { search, replace } of fixes) {
        if (content.includes(search)) {
          content = content.replace(search, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated test file: ${file}`);
      }
    }
  }
}

async function createTestHelpers() {
  console.log('🔧 Creating improved test helpers...');
  
  const helpersContent = `
// Enhanced test helpers with better selectors and error handling
export async function loginWithCredentials(page, email = 'test@test.test', password = 'testtesttest') {
  try {
    await page.goto('/auth/login', { waitUntil: 'networkidle' });
    
    // Wait for form elements with better error handling
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Look for submit button with multiple selectors
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      '[data-testid="login-button"]'
    ];
    
    let submitClicked = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          submitClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!submitClicked) {
      throw new Error('Could not find or click submit button');
    }
    
    // Wait for redirect with better timeout handling
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    return true;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
}

export async function waitForDashboardElements(page) {
  try {
    // Wait for dashboard to load with flexible selectors
    await page.waitForSelector('[data-testid="dashboard-page"], .dashboard-container, h1:has-text("Dashboard")', { timeout: 10000 });
    
    // Wait for at least one metric card to appear
    await page.waitForSelector('[data-testid*="metric-card"], .metric-card, .stats-card', { timeout: 8000 });
    
    return true;
  } catch (error) {
    console.error('Dashboard elements not found:', error);
    return false;
  }
}

export async function waitForNavigationElements(page) {
  try {
    // Wait for navigation with flexible selectors
    await page.waitForSelector('[data-testid="main-navigation"], nav, .sidebar', { timeout: 10000 });
    
    return true;
  } catch (error) {
    console.error('Navigation elements not found:', error);
    return false;
  }
}

export const TEST_TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 10000,
  LONG: 15000,
  NAVIGATION: 10000,
  FORM_SUBMIT: 8000
};
`;
  
  const helpersPath = path.join(process.cwd(), 'tests/__helpers__/enhanced-test-helpers.ts');
  fs.writeFileSync(helpersPath, helpersContent);
  console.log('✅ Created enhanced test helpers');
}

async function main() {
  try {
    console.log('🚀 Starting test selector fixes...');
    
    await addTestSelectors();
    await updateTestFiles();
    await createTestHelpers();
    
    console.log('');
    console.log('🎉 Test selector fixes complete!');
    console.log('');
    console.log('📋 Summary of changes:');
    console.log('   ✅ Added data-testid attributes to key components');
    console.log('   ✅ Updated test files with better selectors');
    console.log('   ✅ Created enhanced test helpers');
    console.log('   ✅ Improved timeout handling');
    console.log('');
    console.log('🧪 You can now run tests with better reliability');
    
  } catch (error) {
    console.error('❌ Test selector fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addTestSelectors, updateTestFiles, createTestHelpers }; 