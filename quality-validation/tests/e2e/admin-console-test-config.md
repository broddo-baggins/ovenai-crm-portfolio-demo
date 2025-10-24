# 🛡️ Admin Console Test Suite Configuration

## Overview

This comprehensive admin console test suite provides complete coverage of both positive and negative test scenarios for the OvenAI admin system.

## Test Files Structure

```
tests/e2e/
├── admin-console-comprehensive.spec.ts    # Main comprehensive test suite
├── admin-commands-execution.spec.ts       # Admin command testing
├── admin-ui-dialogs.spec.ts              # UI dialog and component testing
└── admin-console-test-config.md          # This configuration file
```

## Test Coverage

### 🚫 Negative Tests (Unauthorized Access)
- ✅ Regular users cannot access admin console
- ✅ Regular users cannot access admin landing page
- ✅ Regular users cannot access company admin
- ✅ Unauthenticated users are redirected to login
- ✅ Invalid admin routes return 404 or redirect
- ✅ Permission escalation prevention
- ✅ Session timeout security

### ✅ Positive Tests (Authorized Admin Access)
- ✅ System admin can access all admin areas
- ✅ All admin console tabs are accessible
- ✅ System health metrics display
- ✅ User management functions work
- ✅ Database operations are accessible
- ✅ Company admin has limited access

### ⚡ Admin Commands Testing
- ✅ Command terminal interface availability
- ✅ Help command functionality
- ✅ User management commands (list, search, details)
- ✅ Database commands (status, backup, health)
- ✅ System status and debug commands
- ✅ Cache and cleanup commands
- ✅ Command security and validation
- ✅ Command performance testing

### 🎛️ UI Components and Dialogs
- ✅ User creation dialogs (Client, Partner, Test, Admin)
- ✅ Database operation dialogs (Backup, Optimize, Health Check)
- ✅ Cleanup and maintenance dialogs
- ✅ Form validation and error handling
- ✅ Tab navigation and state management
- ✅ Auto-refresh and manual refresh functionality

### 🔒 Security Tests
- ✅ Role-based access control
- ✅ Permission boundary enforcement
- ✅ Admin creation security warnings
- ✅ Dangerous command protection
- ✅ Command history security

## Test Execution

### Prerequisites

1. **Application Running**: Ensure the application is running on `http://localhost:3002`
2. **Test Users**: The following test users should exist:
   ```
   Admin User: admin@test.test / adminpassword123
   Regular User: user@test.test / userpassword123
   Company Admin: company-admin@test.test / companyadmin123
   ```
3. **Database Access**: Admin console should have proper database connectivity

### Running the Tests

#### Full Admin Console Test Suite
```bash
# Run all admin console tests
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts

# Run with UI for debugging
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --ui

# Run with headed browser
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --headed
```

#### Specific Test Categories

```bash
# Run only negative tests (unauthorized access)
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --grep "NEGATIVE TESTS"

# Run only positive tests (authorized access)
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --grep "POSITIVE TESTS"

# Run admin commands testing
npx playwright test tests/e2e/admin-commands-execution.spec.ts

# Run UI dialogs testing
npx playwright test tests/e2e/admin-ui-dialogs.spec.ts

# Run security tests
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --grep "SECURITY"
```

#### Parallel Execution
```bash
# Run all admin tests in parallel
npx playwright test tests/e2e/admin-console-*.spec.ts --workers=3

# Run with specific browser
npx playwright test tests/e2e/admin-console-*.spec.ts --browser=chromium
```

### Test Results and Reporting

#### Generate HTML Report
```bash
npx playwright test tests/e2e/admin-console-*.spec.ts --reporter=html
```

#### Generate JSON Report
```bash
npx playwright test tests/e2e/admin-console-*.spec.ts --reporter=json:admin-test-results.json
```

#### Watch Mode for Development
```bash
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --watch
```

## Expected Test Results

### Success Criteria
- ✅ All unauthorized access attempts should be properly blocked
- ✅ Admin users should have access to all admin functionality
- ✅ UI dialogs should open, validate, and close properly
- ✅ Commands should execute or show appropriate error messages
- ✅ Security boundaries should be enforced
- ✅ Application should remain stable under error conditions

### Common Test Scenarios

#### Scenario 1: Regular User Protection
```
GIVEN a regular user is logged in
WHEN they try to access /admin/console
THEN they should see "Access Denied" or be redirected to login
```

#### Scenario 2: Admin Functionality
```
GIVEN an admin user is logged in
WHEN they access the admin console
THEN all admin tabs should be visible and functional
```

#### Scenario 3: User Creation
```
GIVEN an admin user is in the Users tab
WHEN they click "Create Client User"
THEN a dialog should open with proper form fields
```

#### Scenario 4: Security Warnings
```
GIVEN an admin user tries to create another admin
WHEN they open the Create Admin User dialog
THEN security warnings should be displayed
```

## Troubleshooting

### Common Issues and Solutions

#### Test Failures Due to Timing
```bash
# Increase timeout for slow operations
npx playwright test --timeout=60000
```

#### Authentication Issues
- Ensure test users exist in the database
- Check that authentication service is running
- Verify localStorage/sessionStorage auth tokens

#### Dialog Not Opening
- Check that admin console is properly loaded
- Verify button selectors are correct
- Ensure proper tab navigation

#### Command Terminal Not Found
- Admin commands may be implemented through UI buttons rather than terminal
- Check for alternative command execution interfaces
- Verify Scripts tab implementation

### Debug Mode
```bash
# Run single test with debug
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --debug

# Run with trace viewer
npx playwright test tests/e2e/admin-console-comprehensive.spec.ts --trace=on
```

## Test Data Management

### Test User Creation
If test users don't exist, create them manually or through scripts:

```sql
-- Example SQL for creating test users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('admin-123', 'admin@test.test', 'encrypted_password_here', NOW(), NOW(), NOW()),
  ('user-456', 'user@test.test', 'encrypted_password_here', NOW(), NOW(), NOW());

INSERT INTO profiles (id, email, role, status)
VALUES 
  ('admin-123', 'admin@test.test', 'admin', 'active'),
  ('user-456', 'user@test.test', 'user', 'active');
```

### Cleanup After Tests
- Test users created during testing should be cleaned up
- Test data should not interfere with production data
- Use transaction rollbacks where possible

## Continuous Integration

### GitHub Actions Configuration
```yaml
name: Admin Console Tests
on: [push, pull_request]
jobs:
  admin-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install
      - name: Run admin console tests
        run: npx playwright test tests/e2e/admin-console-*.spec.ts
```

## Test Maintenance

### Regular Updates Needed
- Update selectors if UI changes
- Adjust test data as schema evolves
- Review security test scenarios
- Update command lists as features are added

### Performance Monitoring
- Monitor test execution time
- Identify slow or flaky tests
- Optimize test reliability

## Security Considerations

### Test Environment Security
- Use test-specific credentials
- Ensure test database isolation
- Don't test with production admin accounts
- Validate that security tests actually test security

### Regular Security Test Reviews
- Review admin creation security warnings
- Verify permission boundary tests
- Check command injection protection
- Validate session management security

## Reporting Issues

When reporting test failures, include:
1. Test name and file
2. Browser and environment details
3. Screenshot or trace file
4. Console logs
5. Steps to reproduce
6. Expected vs actual behavior

## Test Coverage Metrics

Target coverage for admin console:
- ✅ 100% of admin routes tested
- ✅ 100% of user creation dialogs tested  
- ✅ 100% of database operation dialogs tested
- ✅ 95% of admin commands tested
- ✅ 100% of security boundaries tested
- ✅ 95% of error handling scenarios tested 