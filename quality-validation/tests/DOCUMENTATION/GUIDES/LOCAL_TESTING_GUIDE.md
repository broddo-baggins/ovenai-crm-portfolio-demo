# 🧪 Local Testing Guide - Mirror GitHub Actions

## Overview

Run the same tests locally that GitHub Actions runs in CI/CD to catch issues before pushing to production.

## 🚀 Quick Commands

### Emergency Production Check

```bash
# Run this before ANY production deployment
npm run emergency-deploy-check
```

**What it does:**

- Cleans debug logs
- Runs lint checking
- Validates TypeScript
- Tests production build
- ✅ Confirms deployment readiness

### GitHub Actions Mirror

```bash
# Run the exact same tests as GitHub Actions
npm run test:github-actions
```

**What it does:**

- All linting and type checks
- Unit tests (fast run)
- E2E tests (critical paths)
- Security audit
- Mirrors `.github/workflows/03-regression-protection.yml`

### Local CI Simulation

```bash
# Simulate CI environment locally
npm run test:local-ci
```

**What it does:**

- Lint checking
- Type checking
- Unit tests
- E2E tests

## 📋 Test Categories

### 1. Pre-Deployment Safety Check

```bash
npm run emergency-deploy-check
```

- **Purpose**: Final check before production deployment
- **Time**: ~2-3 minutes
- **Critical**: MUST pass before deploying

### 2. Development Workflow

```bash
# Before committing
npm run clean-logs
npm run lint:check
npm run type-check

# Before pushing
npm run test:local-ci
```

### 3. Full Regression Test

```bash
npm run regression-test
```

- **Purpose**: Complete protection suite
- **Time**: ~5-10 minutes
- **When**: Before major releases

## 🔍 Individual Test Commands

### Quality Checks

```bash
npm run lint:check          # ESLint validation
npm run lint:fix            # Auto-fix issues
npm run type-check          # TypeScript validation
npm run clean-logs          # Remove debug logs
npm run security-check      # npm audit
```

### Testing Suites

```bash
npm run test               # Unit tests (watch mode)
npm run test:run          # Unit tests (single run)
npm run test:e2e          # E2E tests
npm run test:integration  # Integration tests
```

### Build Verification

```bash
npm run build             # Production build
npm run build:check       # Development build check
```

## 🚨 Emergency Procedures

### Production is Broken

1. **Immediate**:

   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Fix & Test**:

   ```bash
   npm run emergency-deploy-check
   ```

3. **Deploy Fix**:
   ```bash
   git add .
   git commit -m "🚨 HOTFIX: [description]"
   git push origin main
   ```

### Pre-commit Hook Failing

```bash
# Bypass only in emergencies
git commit --no-verify -m "EMERGENCY: Critical hotfix"
```

⚠️ **WARNING**: Fix issues immediately after emergency bypass!

## 📊 Expected Results

### ✅ Success Indicators

- All tests pass: `✅`
- No TypeScript errors: `0 errors`
- No ESLint warnings: `0 warnings`
- Build completes: `dist/` folder created
- No debug logs: `✨ No debug logs found`

### ❌ Failure Indicators

- Test failures: `❌ [test name] failed`
- TypeScript errors: `error TS[code]`
- ESLint errors: `✖ [rule]`
- Build failures: `Build failed`
- Debug logs found: `❌ Debug logs detected`

## 🔄 Workflow Integration

### Daily Development

```bash
# Morning routine
git pull origin main
npm run test:local-ci

# Before commits
npm run clean-logs
npm run lint:check

# Before pushing
npm run test:local-ci
```

### Release Preparation

```bash
# Complete validation
npm run regression-test
npm run emergency-deploy-check

# Final check
npm run test:github-actions
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Husky Not Found

**Error**: `husky: command not found`
**Fix**:

```bash
npm install husky --save-dev
npx husky install
```

#### 2. TypeScript Errors

**Error**: Multiple TS errors
**Fix**:

```bash
npm run type-check | head -20  # See first 20 errors
# Fix incrementally
```

#### 3. Test Timeouts

**Error**: Tests timing out
**Fix**:

```bash
npm run test:e2e -- --timeout=60000
```

#### 4. Build Failures

**Error**: Build process fails
**Fix**:

```bash
npm run build:check  # Development build first
npm run clean-logs   # Remove debug logs
npm run build        # Try production build
```

### Debug Mode

```bash
# Verbose output
npm run test:local-ci -- --verbose
npm run lint:check -- --debug
```

## 📈 Performance Benchmarks

### Expected Times

- `lint:check`: 10-15 seconds
- `type-check`: 15-30 seconds
- `test:run`: 30-60 seconds
- `test:e2e`: 2-5 minutes
- `build`: 30-90 seconds
- **Total**: 4-8 minutes for full check

### Optimization Tips

```bash
# Parallel testing (if needed)
npm run lint:check & npm run type-check & wait

# Skip E2E for quick checks
npm run lint:check && npm run type-check && npm run test:run
```

## 📝 Integration with IDE

### VS Code Settings

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Emergency Deploy Check",
      "type": "shell",
      "command": "npm run emergency-deploy-check",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

---

## ✅ Quick Reference

| Command                  | Purpose              | Time    | When to Use         |
| ------------------------ | -------------------- | ------- | ------------------- |
| `emergency-deploy-check` | Production readiness | 2-3 min | Before deployment   |
| `test:github-actions`    | CI/CD mirror         | 4-8 min | Before pushing      |
| `test:local-ci`          | Development CI       | 3-6 min | Regular development |
| `clean-logs`             | Remove debug logs    | 10 sec  | Before commits      |
| `lint:check`             | Code quality         | 15 sec  | Quick validation    |

**Remember**: Local testing prevents production failures! 🛡️
