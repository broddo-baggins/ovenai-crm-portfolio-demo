# 🧪 Test Configuration Reference Guide

**Complete reference for all test configurations and their proper usage patterns**

---

## 📋 Configuration Files Overview

### **Playwright Configurations**

| Config File | Purpose | Test Types | Key Features |
|-------------|---------|------------|--------------|
| `playwright.config.ts` | **Main E2E Tests** | Sanity, core functionality | Dynamic port detection, comprehensive browser coverage |
| `playwright.config.admin.ts` | **Admin Console** | Admin-specific tests | Extended timeouts, admin-optimized viewport (1440x900) |
| `playwright.mobile.config.ts` | **Mobile Testing** | Mobile/responsive tests | Touch support, mobile viewports, device simulation |
| `playwright.queue.config.ts` | **Queue Management** | Queue functionality | Database operations, extended timeouts (60s) |

### **Unit Testing Configuration**

| Config File | Purpose | Test Types | Key Features |
|-------------|---------|------------|--------------|
| `vitest.config.ts` | **Unit Tests** | Component/service tests | JSDoc environment, excluded E2E tests |

---

## 🎯 Configuration Usage Patterns

### **1. Main Playwright Config (`playwright.config.ts`)**

**✅ Use for:**
```bash
# Sanity tests (current usage)
npx playwright test quality-validation/tests/sanity/ --config=quality-validation/configs/playwright.config.ts --reporter=list

# General E2E tests
npx playwright test tests/e2e/ --config=quality-validation/configs/playwright.config.ts --reporter=list

# Comprehensive page testing
npx playwright test tests/e2e/all-pages-comprehensive.spec.ts --config=quality-validation/configs/playwright.config.ts
```

**Key Settings:**
- **Workers:** 2 (CI: 1)
- **Timeout:** 60s
- **Retries:** 1 (CI: 2)
- **Browsers:** Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Dynamic Port Detection:** ✅
- **Text-only Reporters:** ✅

### **2. Admin Config (`playwright.config.admin.ts`)**

**✅ Use for:**
```bash
# Admin console tests
npx playwright test tests/admin/ --config=quality-validation/configs/playwright.config.admin.ts --reporter=list

# Admin console debugging  
npx playwright test --config=quality-validation/configs/playwright.config.admin.ts --debug

# Admin console headed mode
npx playwright test --config=quality-validation/configs/playwright.config.admin.ts --headed
```

**Key Settings:**
- **Workers:** 2 (CI: 1)
- **Timeout:** 120s (extended for admin operations)
- **Viewport:** 1440x900 (admin-optimized)
- **Test Pattern:** `**/admin/**/*.spec.ts`

### **3. Mobile Config (`playwright.mobile.config.ts`)**

**✅ Use for:**
```bash
# Mobile responsive tests
npx playwright test tests/suites/mobile/ --config=quality-validation/configs/playwright.mobile.config.ts --reporter=list

# Mobile touch interaction tests
npx playwright test tests/mobile/ --config=quality-validation/configs/playwright.mobile.config.ts --reporter=list

# Mobile debugging
npx playwright test --config=quality-validation/configs/playwright.mobile.config.ts --debug
```

**Key Settings:**
- **Devices:** Pixel 5, iPhone 12, iPad Pro, Landscape modes
- **Touch Support:** ✅ Enabled
- **Mobile Viewports:** 393x851, 390x844, 1024x1366 (tablet)
- **Test Pattern:** `**/mobile/**/*.spec.ts`

### **4. Queue Config (`playwright.queue.config.ts`)**

**✅ Use for:**
```bash
# Queue functionality tests
npx playwright test tests/queue-focused.spec.ts --config=quality-validation/configs/playwright.queue.config.ts --reporter=list

# Queue management tests  
npx playwright test tests/queue-management-*.spec.ts --config=quality-validation/configs/playwright.queue.config.ts --reporter=list

# All queue tests
npx playwright test tests/queue-*.spec.ts --config=quality-validation/configs/playwright.queue.config.ts --reporter=list
```

**Key Settings:**
- **Workers:** 2 (CI: 1) - reduced for stability
- **Timeout:** 60s (for database operations)
- **Test Pattern:** `**/queue-*.spec.ts`
- **Optimized for:** Database integration, real-time updates

### **5. Vitest Config (`vitest.config.ts`)**

**✅ Use for:**
```bash
# Unit tests
npm run test:unit

# Unit tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Silent unit tests
npm run test:silent
```

**Key Settings:**
- **Environment:** jsdom
- **Excludes:** E2E tests, emergency backups, playwright tests
- **Includes:** `src/**/*.test.{ts,tsx}`, `src/**/__tests__/**`
- **Coverage:** Text and JSON output only

---

## 🚀 NPM Script Quick Reference

### **Core Testing Commands**

| Command | Config Used | Purpose |
|---------|-------------|---------|
| `npm run test:sanity` | `playwright.config.ts` | Quick sanity check |
| `npm run test:unit` | `vitest.config.ts` | Unit tests only |
| `npm run test:admin:headed` | `playwright.config.admin.ts` | Admin tests with UI |
| `npm run test:mobile-headed` | `playwright.mobile.config.ts` | Mobile tests with UI |

### **Specialized Testing Commands**

```bash
# Database-focused queue tests
npm run test:integration:database

# Security testing
npm run test:security:auth

# Performance testing  
npm run test:performance:load

# Accessibility testing
npm run test:accessibility:wcag

# Full regression suite
npm run test:regression:priority1
```

---

## 🛡️ Configuration Best Practices

### **1. Always Use Correct Config**
```bash
# ✅ CORRECT - Specify config explicitly
npx playwright test sanity --config=quality-validation/configs/playwright.config.ts --reporter=list

# ❌ WRONG - Missing config (uses default)
npx playwright test sanity --reporter=list
```

### **2. Text-Only Reporters**
All configs enforce text-only reporting:
```bash
--reporter=list                    # ✅ Text output
--reporter=json                    # ✅ JSON output
--reporter=html                    # ❌ Prohibited
```

### **3. Dynamic Port Detection**
All configs use `global-setup.ts` for dynamic port detection:
- **Automatically detects running dev server**
- **Falls back to localhost:3000**
- **Works in CI and local development**

### **4. Worker Optimization**
```bash
# CI Environment (slower, more stable)
workers: process.env.CI ? 1 : 2

# Local Development (faster)  
workers: 2
```

---

## 🔧 Configuration Validation Commands

### **Test All Configurations**
```bash
# Test main config
npx playwright test quality-validation/tests/sanity/ --config=quality-validation/configs/playwright.config.ts --dry-run

# Test admin config  
npx playwright test tests/admin/ --config=quality-validation/configs/playwright.config.admin.ts --dry-run

# Test mobile config
npx playwright test tests/mobile/ --config=quality-validation/configs/playwright.mobile.config.ts --dry-run

# Test queue config
npx playwright test tests/queue-*.spec.ts --config=quality-validation/configs/playwright.queue.config.ts --dry-run

# Test unit config
npx vitest --config=quality-validation/configs/vitest.config.ts --run --reporter=basic
```

### **Config Health Check**
```bash
# Verify all configs load without errors
node -e "
  console.log('Testing config loading...');
  require('./quality-validation/configs/playwright.config.ts');
  require('./quality-validation/configs/playwright.config.admin.ts');
  require('./quality-validation/configs/playwright.mobile.config.ts');
  require('./quality-validation/configs/playwright.queue.config.ts');
  require('./quality-validation/configs/vitest.config.ts');
  console.log('✅ All configs loaded successfully');
"
```

---

## 📊 Configuration Matrix

| Test Type | Recommended Config | Alternative Configs | Notes |
|-----------|-------------------|-------------------|--------|
| **Sanity** | `playwright.config.ts` | - | Current standard |
| **Admin Console** | `playwright.config.admin.ts` | `playwright.config.ts` | Use admin config for better timeouts |
| **Mobile/Responsive** | `playwright.mobile.config.ts` | `playwright.config.ts` | Mobile config has touch support |
| **Queue Management** | `playwright.queue.config.ts` | `playwright.config.ts` | Queue config optimized for DB ops |
| **Unit Tests** | `vitest.config.ts` | - | Only config for unit testing |
| **E2E General** | `playwright.config.ts` | - | Most comprehensive |

---

## 🎯 Command Templates

### **Copy-Paste Commands**

**Sanity Testing:**
```bash
npx playwright test quality-validation/tests/sanity/ --config=quality-validation/configs/playwright.config.ts --reporter=list
```

**Admin Testing:**
```bash
npx playwright test tests/admin/ --config=quality-validation/configs/playwright.config.admin.ts --reporter=list --headed
```

**Mobile Testing:**
```bash
npx playwright test tests/mobile/ --config=quality-validation/configs/playwright.mobile.config.ts --reporter=list
```

**Queue Testing:**
```bash
npx playwright test tests/queue-*.spec.ts --config=quality-validation/configs/playwright.queue.config.ts --reporter=list
```

**Unit Testing:**
```bash
npx vitest --config=quality-validation/configs/vitest.config.ts --run --reporter=verbose
```

**Debug Mode (any config):**
```bash
npx playwright test --config=quality-validation/configs/[CONFIG_NAME].ts --debug
```

---

## ⚠️ Critical Configuration Rules

### **🚨 ALWAYS:**
- Specify the config explicitly with `--config=`
- Use `--reporter=list` for text output
- Include the full path to config files
- Test locally before CI deployment

### **🚨 NEVER:**
- Use HTML reporters (blocked by all configs)
- Run tests without specifying config
- Mix config types (e.g., mobile tests with main config)
- Skip the global setup (port detection)

---

**Last Updated:** July 21, 2025  
**All Configs:** Production Ready & Bulletproof ✅ 