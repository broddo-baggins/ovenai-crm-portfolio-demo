# Test Configurations

All Playwright and Vitest configuration files for comprehensive testing coverage.

## 📚 Complete Configuration Guide

**📖 See [TEST_CONFIGURATION_REFERENCE.md](./TEST_CONFIGURATION_REFERENCE.md) for comprehensive usage patterns and best practices.**

## 📋 Quick Config Overview

- **`playwright.config.ts`** - Main E2E tests, sanity checks
- **`playwright.config.admin.ts`** - Admin console specific tests  
- **`playwright.mobile.config.ts`** - Mobile/responsive testing
- **`playwright.queue.config.ts`** - Queue management tests
- **`vitest.config.ts`** - Unit testing configuration

## 🚀 Quick Commands

```bash
# Sanity tests (main usage)
npx playwright test quality-validation/tests/sanity/ --config=quality-validation/configs/playwright.config.ts --reporter=list

# Admin tests
npx playwright test --config=quality-validation/configs/playwright.config.admin.ts --reporter=list --headed

# Mobile tests  
npx playwright test --config=quality-validation/configs/playwright.mobile.config.ts --reporter=list

# Unit tests
npx vitest --config=quality-validation/configs/vitest.config.ts --run
```

**⚠️ Always specify the config explicitly with `--config=` for reliable test execution.**