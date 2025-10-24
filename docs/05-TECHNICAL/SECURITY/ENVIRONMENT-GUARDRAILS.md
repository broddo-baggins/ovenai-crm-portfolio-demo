# 🛡️ Environment Configuration Guardrails

This document explains the comprehensive guardrails and monitoring system we've implemented to prevent environment configuration issues like the one we recently fixed.

## 📋 Overview

After encountering the "Missing Supabase environment variables" error in production, we've implemented multiple layers of protection:

1. **Pre-commit validation** - Validates environment config before code changes
2. **Build-time validation** - Ensures all required variables are present during builds
3. **Runtime monitoring** - Tracks and reports configuration issues in production
4. **Automated testing** - GitHub Actions validate configurations on every PR
5. **Security scanning** - Prevents accidentally exposed secrets

## 🛠️ Tools and Scripts

### 1. Environment Validator (`scripts/validate-env.js`)

**Purpose**: Validates environment configurations for different deployment targets.

```bash
# Validate current environment
npm run validate-env

# Validate specific environment
npm run validate-env --env=production
npm run validate-env --env=development

# Generate environment templates
npm run validate-env --generate-template
```

**What it checks**:
- ✅ Required variables are present
- ❌ Forbidden variables (like service role keys in production)
- 🔍 URL format validation (HTTPS in production)
- ⚠️ Security warnings (localhost URLs in production)

### 2. Health Check (`scripts/health-check.js`)

**Purpose**: Monitors application health including environment configuration.

```bash
# Run health check
npm run health-check

# Get JSON output for monitoring
npm run health-check --json
```

**What it monitors**:
- Environment variable presence and validity
- Supabase connectivity
- Build artifacts existence
- Overall system health status

### 3. Error Monitoring (`src/utils/error-monitoring.ts`)

**Purpose**: Runtime monitoring and reporting of configuration issues.

```typescript
import { reportEnvironmentError, getHealthSummary } from '@/utils/error-monitoring';

// Report environment issues
reportEnvironmentError('Missing configuration', { variable: 'VITE_APP_URL' });

// Get system health
const health = getHealthSummary();
console.log('System health:', health.healthStatus);
```

## 🚦 Validation Levels

### Level 1: Development Protection
- Validates basic required variables
- Allows service role key for development convenience
- Warns about security implications

### Level 2: Production Protection
- Strict validation of all production requirements
- Blocks service role keys (security)
- Enforces HTTPS URLs
- Validates proper configuration

### Level 3: Security Scanning
- Scans for accidentally committed secrets
- Checks for hardcoded credentials
- Validates URL patterns

## 📊 GitHub Actions Workflow

### Automatic Validation Pipeline

Every PR and push triggers:

1. **Environment Matrix Testing**
   - Tests development, production, and preview configurations
   - Validates build succeeds with each configuration
   - Reports failures with specific details

2. **Security Scanning**
   - Checks for exposed service role keys
   - Scans for hardcoded secrets
   - Validates URL patterns

3. **Deployment Readiness**
   - Full production build test
   - Comprehensive validation
   - Artifact generation

### Failure Notifications

- **PR Comments**: Automatic comments with validation results
- **Issues**: Creates urgent issues for main branch failures
- **Build Artifacts**: Uploads successful builds for review

## 🔧 How to Use

### For Developers

1. **Before making changes**:
   ```bash
   npm run validate-env
   npm run health-check
   ```

2. **Before committing**:
   ```bash
   npm run prepare-deploy  # Runs full validation + build
   ```

3. **When debugging environment issues**:
   ```bash
   npm run debug-env       # Shows current environment variables
   npm run validate-env --env=production  # Test production config
   ```

### For DevOps/Deployment

1. **Setting up new environments**:
   ```bash
   npm run validate-env --generate-template --env=production
   # Follow the generated template
   ```

2. **Monitoring production health**:
   ```bash
   npm run health-check --json | jq '.healthStatus'
   ```

3. **Verifying deployment readiness**:
   ```bash
   npm run prepare-deploy
   ```

## 🚨 Alert System

### Error Categories
- **🔴 CRITICAL**: Prevents application from starting
- **🟡 HIGH**: May cause functionality issues
- **🟠 MEDIUM**: Performance or user experience impact
- **🔵 LOW**: Minor issues or warnings

### Monitoring Integration

The error monitoring system can be integrated with:
- **Sentry** - For error tracking
- **DataDog** - For metrics and alerting
- **PagerDuty** - For incident management
- **Slack** - For team notifications

## 📚 Common Scenarios

### Scenario 1: Missing Environment Variable

**Problem**: `VITE_SUPABASE_URL` is missing in production

**Detection**:
- ❌ GitHub Actions validation fails
- ❌ Build-time validation catches it
- ❌ Runtime monitoring reports it

**Prevention**:
- Pre-commit validation would catch it locally
- PR validation prevents merge
- Deployment readiness check blocks deployment

### Scenario 2: Security Risk (Service Role Key Exposed)

**Problem**: `VITE_SUPABASE_SERVICE_ROLE_KEY` set in production

**Detection**:
- ❌ Security scanner flags it
- ❌ Production validation blocks it
- ⚠️ Runtime monitoring warns about it

**Prevention**:
- Environment validation marks as forbidden
- GitHub Actions security check catches it
- Automatic PR comments warn about security risk

### Scenario 3: Wrong URL Configuration

**Problem**: localhost URL in production environment

**Detection**:
- ❌ URL validation fails
- ⚠️ Configuration analysis warns
- 📊 Health check reports issue

**Prevention**:
- Environment validator checks URL patterns
- Production build validation enforces HTTPS
- Runtime monitoring tracks URL patterns

## 🔄 Continuous Improvement

### Adding New Validations

1. **Update `scripts/validate-env.js`**:
   ```javascript
   // Add new validation rule
   validations: {
     'NEW_VARIABLE': (value) => {
       if (!value.includes('expected-pattern')) {
         return 'Expected pattern not found';
       }
       return null;
     }
   }
   ```

2. **Update GitHub Actions**:
   ```yaml
   # Add new environment variable to workflow
   NEW_VARIABLE: ${{ secrets.NEW_VARIABLE }}
   ```

3. **Update Error Monitoring**:
   ```typescript
   // Add new error category if needed
   export enum ErrorCategory {
     NEW_CATEGORY = 'new_category'
   }
   ```

### Metrics to Track

- Environment validation success rate
- Build failure rate due to configuration
- Time to detect configuration issues
- Production error rate by category
- Security scan findings

## 🎯 Best Practices

### 1. Environment Variable Naming
- Use `VITE_` prefix for client-side variables
- Use descriptive names: `VITE_SUPABASE_URL` not `VITE_DB_URL`
- Use consistent naming patterns

### 2. Security
- Never commit actual secret values
- Use GitHub Secrets for sensitive data
- Regularly rotate credentials
- Use service role keys only in development

### 3. Validation
- Run validation before every commit
- Test all environment configurations
- Keep validation rules up to date
- Document new requirements

### 4. Monitoring
- Monitor environment health in production
- Set up alerts for critical issues
- Track trends and patterns
- Regular health check reviews

## 🆘 Troubleshooting

### Common Issues

1. **Validation Script Fails**
   ```bash
   # Check Node.js version
   node --version  # Should be 18+
   
   # Reinstall dependencies
   npm ci
   ```

2. **Environment Variables Not Loading**
   ```bash
   # Check file existence
   ls -la .env*
   
   # Validate file format
   cat .env | grep -v "^#" | grep "="
   ```

3. **Build Fails After Validation Passes**
   ```bash
   # Check build-specific environment
   npm run validate-env --env=production
   npm run build:prod
   ```

### Getting Help

1. **Run diagnostics**:
   ```bash
   npm run health-check
   npm run debug-env
   ```

2. **Check recent changes**:
   ```bash
   git log --oneline -10 -- .env* vite.config.ts
   ```

3. **Review error monitoring**:
   - Check browser console for error reports
   - Review GitHub Actions logs
   - Look at runtime monitoring data

---

*This guardrail system ensures we never face the "Missing Supabase environment variables" issue again by catching problems early and providing clear guDemoAgentce for resolution.* 