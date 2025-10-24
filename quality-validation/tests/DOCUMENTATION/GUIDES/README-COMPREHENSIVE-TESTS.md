# 🚀 Comprehensive E2E Test Suite

This directory contains a comprehensive End-to-End (E2E) testing suite that systematically tests ALL pages and functionality in your OvenAI application.

## 🎯 What's New

### ✅ Fixed Issues
- **Proper Authentication**: Tests now use consistent login credentials across all tests
- **Complete Page Coverage**: Tests ALL 24+ pages in your `/src/pages` directory
- **Systematic Navigation**: Tests actually navigate through the authenticated app
- **Robust Error Handling**: Tests don't fail due to minor issues, but log them for review
- **Mobile & Responsive Testing**: Includes mobile viewport testing
- **Screenshot Capture**: Automatically captures screenshots for debugging

### 🧪 Test Files

1. **`comprehensive-app-navigation-simplified.spec.ts`** - Main comprehensive test suite
2. **`test-auth-helper.ts`** - Reusable authentication helper
3. **`run-comprehensive-tests.sh`** - Test runner script

## 🔧 Setup & Prerequisites

### 1. Ensure Your Server is Running
```bash
# Start your development server
npm run dev
# or
yarn dev
```

### 2. Test User Setup
Make sure you have a test user in your database:
- **Email**: `test@test.test`
- **Password**: `testtesttest`

### 3. Install Dependencies (if not already done)
```bash
npm install @playwright/test
# or
yarn add @playwright/test
```

## 🏃‍♂️ Running Tests

### Option 1: Quick Run (Recommended)
```bash
# Make the script executable (one time only)
chmod +x tests/run-comprehensive-tests.sh

# Run all comprehensive tests
./tests/run-comprehensive-tests.sh
```

### Option 2: Individual Test Files
```bash
# Run comprehensive navigation tests
npx playwright test tests/e2e/comprehensive-app-navigation-simplified.spec.ts

# Run with UI mode for debugging
npx playwright test tests/e2e/comprehensive-app-navigation-simplified.spec.ts --ui

# Run in headed mode to see the browser
npx playwright test tests/e2e/comprehensive-app-navigation-simplified.spec.ts --headed
```

### Option 3: All E2E Tests
```bash
# Run all E2E tests
npx playwright test tests/e2e/

# Generate HTML report
npx playwright test tests/e2e/ --reporter=html
```

## 📊 Test Coverage

### 🌐 Pages Tested (24 pages)
- ✅ Landing Page (`/`)
- ✅ Login (`/login`)
- ✅ Dashboard (`/dashboard`)
- ✅ Leads (`/leads`)
- ✅ Projects (`/projects`)
- ✅ Messages (`/messages`)
- ✅ Calendar (`/calendar`)
- ✅ Reports (`/reports`)
- ✅ Enhanced Reports (`/enhanced-reports`)
- ✅ Lead Pipeline (`/lead-pipeline`)
- ✅ Optimized Messages (`/optimized-messages`)
- ✅ Settings (`/settings`)
- ✅ Users (`/users`)
- ✅ Notifications (`/notifications`)
- ✅ WhatsApp Demo (`/whatsapp-demo`)
- ✅ Components Demo (`/components-demo`)
- ✅ Connection Test (`/connection-test`)
- ✅ Admin Dashboard (`/admin-dashboard`)
- ✅ Admin Data Requests (`/admin-data-requests`)
- ✅ Data Export (`/data-export`)
- ✅ Data Deletion (`/data-deletion`)
- ✅ Privacy Policy (`/privacy-policy`)
- ✅ Accessibility Declaration (`/accessibility-declaration`)
- ✅ Terms of Service (`/terms-of-service`)

### 🔧 Functionality Tested
- **Authentication Flow**: Login, logout, session management
- **Navigation**: All page-to-page navigation
- **Interactive Elements**: Buttons, links, forms, inputs
- **Responsive Design**: Mobile and tablet viewports
- **Error Handling**: JavaScript errors, network issues
- **Page-Specific Features**: Dashboard widgets, leads tables, project cards, etc.

### 📱 Device Testing
- **Desktop**: 1920x1080 (default)
- **Mobile**: 375x667 (iPhone size)
- **Tablet**: 768x1024 (iPad size)

## 📸 Test Results & Artifacts

After running tests, you'll find:

```
test-results/
├── screenshots/          # Screenshots for debugging
│   ├── auth-successful-login.png
│   ├── page-dashboard.png
│   ├── page-leads.png
│   ├── mobile-dashboard.png
│   └── ...
├── reports/              # HTML test reports
│   └── index.html
└── comprehensive/        # Additional test artifacts
```

## 🐛 Debugging Failed Tests

### 1. Check Screenshots
Look at screenshots in `test-results/screenshots/` to see what the page looked like when tests ran.

### 2. Review Console Output
The tests provide detailed console output showing:
- ✅ Successful operations
- ⚠️ Warnings (non-critical issues)
- ❌ Errors (critical failures)

### 3. Common Issues & Solutions

#### Authentication Issues
```bash
# If login fails, check:
1. Is your server running on http://localhost:3001?
2. Does the test user exist in your database?
3. Are the credentials correct in the test helper?
```

#### Navigation Issues
```bash
# If page navigation fails:
1. Check if the route exists in your app
2. Look for JavaScript errors in console
3. Verify authentication is working
```

#### Element Not Found Issues
```bash
# If tests can't find buttons/elements:
1. Check if the page has loaded completely
2. Verify element selectors are correct
3. Look for loading states or dynamic content
```

## ⚙️ Customization

### Changing Test Credentials
Edit `tests/setup/test-auth-helper.ts`:
```typescript
export const DEFAULT_TEST_CONFIG: TestConfig = {
  baseURL: 'http://localhost:3001',
  credentials: {
    email: 'your-test-email@example.com',  // Change this
    password: 'your-test-password'         // Change this
  },
  // ...
};
```

### Adding New Pages
Edit `tests/e2e/comprehensive-app-navigation-simplified.spec.ts`:
```typescript
const PAGES_TO_TEST = [
  // ... existing pages
  { path: '/your-new-page', name: 'Your New Page', requiresAuth: true }
];
```

### Adding Page-Specific Tests
Add a new function in the same file:
```typescript
async function testYourNewPageFeatures(page: any) {
  console.log('🆕 Testing Your New Page specific features...');
  // Add your specific tests here
}
```

## 🚨 Troubleshooting

### Server Not Running
```bash
Error: "Could not navigate to page"
Solution: Start your development server (npm run dev)
```

### Test User Not Found
```bash
Error: "Login failed - not authenticated"
Solution: Create a test user with email: test@test.test, password: testtesttest
```

### Port Conflicts
```bash
Error: "ECONNREFUSED"
Solution: Check if your app is running on port 3001, or update the baseURL in test config
```

### Database Issues
```bash
Error: Various database-related errors
Solution: Ensure your database is running and has test data
```

## 📈 Performance & Scale

- **Test Duration**: ~5-10 minutes for full suite
- **Parallel Execution**: Tests run in parallel when possible
- **Resource Usage**: Moderate (opens browser instances)
- **Retry Logic**: Tests automatically retry on transient failures

## 🔄 CI/CD Integration

To run in CI environments:
```bash
# Run in headless mode
npx playwright test tests/e2e/ --project=chromium

# Run with CI flag
./tests/run-comprehensive-tests.sh --ci
```

## 🎉 Success Metrics

A successful test run should show:
- ✅ All 24 pages load correctly
- ✅ Authentication works properly
- ✅ Navigation between pages functions
- ✅ Interactive elements are present and functional
- ✅ No critical JavaScript errors
- ✅ Responsive design works on mobile/tablet

---

## 🤝 Contributing

When adding new features to the app:
1. Add the new page to `PAGES_TO_TEST` array
2. Create page-specific test functions if needed
3. Update this README if you add new test capabilities
4. Run the comprehensive tests to ensure nothing breaks

---

**Happy Testing! 🧪✨** 