# Git Workflow Guide - OvenAI Project

## Overview
This guide covers the complete Git workflow for the OvenAI project, from creating feature branches to production deployment.

## 1. Feature Branch Creation

### Step 1: Update Main Branch
```bash
# Switch to main branch
git checkout main

# Pull latest changes from remote
git pull origin main

# Verify you're on latest main
git status
git log --oneline -5
```

### Step 2: Create Feature Branch
```bash
# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Example naming conventions:
# feature/user-authentication
# feature/dashboard-improvements
# bugfix/login-error-handling
# hotfix/security-patch
```

### Step 3: Work on Your Feature
```bash
# Make your changes
# Add files
git add .

# Commit with descriptive message
git commit -m "feat: add user authentication system

- Implement login/logout functionality
- Add session management
- Include security validations
- Update tests for auth flow"

# Push feature branch to remote
git push -u origin feature/your-feature-name
```

## 2. Pull Request (PR) Creation

### Step 1: Create PR via GitHub Web Interface
1. Navigate to your repository on GitHub
2. Click "Compare & pull request" button
3. Fill out PR template:

```markdown
## Description
Brief description of changes made

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] No breaking changes without migration path
```

### Step 2: PR Best Practices
- **Title**: Use conventional commits format
- **Description**: Clear explanation of what and why
- **Labels**: Add appropriate labels (feature, bugfix, urgent, etc.)
- **Reviewers**: Assign team members
- **Linked Issues**: Reference related issues

## 3. Review & Test Process

### Automated Testing (GitHub Actions)
The following tests run automatically on PR creation:

1. **Basic CI** - Build & Unit Tests
2. **Integration Tests** - Database and API tests
3. **Accessibility Tests** - WCAG compliance
4. **E2E Tests** - Full user journey testing
5. **Security Tests** - Vulnerability scanning

### Manual Review Checklist

#### Code Quality Review
```bash
# Reviewer should pull PR branch locally
git fetch origin
git checkout feature/your-feature-name

# Run tests locally
npm test
npm run test:integration
npx playwright test

# Check code quality
npm run lint
npm run type-check
```

#### Review Criteria
- [ ] Code is readable and maintainable
- [ ] Follows project conventions
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Tests cover new functionality
- [ ] Documentation updated

### Testing Commands
```bash
# Run all test suites
npm run test:all

# Run specific test categories
npm run test:smoke
npm run test:sanity
npm run test:security
npm run test:accessibility

# Run with specific browsers
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 4. Production Deployment Process

### Step 1: Pre-merge Validation
```bash
# Ensure all tests pass
npm run test:all

# Ensure build succeeds
npm run build

# Verify no linting errors
npm run lint:fix

# Check for security vulnerabilities
npm audit --audit-level high
```

### Step 2: Merge to Main
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch (use --no-ff for merge commit)
git merge --no-ff feature/your-feature-name

# Or use GitHub's merge button with "Create a merge commit" option
```

### Step 3: Update Main with Verbose Commit
```bash
# Create detailed commit message for main
git commit --amend -m "feat: comprehensive testing implementation

Major Changes:
- Added 8 complete test suites (100+ test scenarios)
- Implemented smoke, sanity, white-box, black-box tests
- Added security testing (auth, TLS, compliance)
- Created localization and accessibility tests
- Built robust helper classes for testing
- Fixed GitHub Actions workflow issues
- Organized test results with bug tracking

Technical Details:
- AuthHelpers: SQL injection, XSS protection testing
- SecurityHelpers: HTTPS, TLS, GDPR compliance validation
- Test coverage: Authentication, navigation, performance
- Performance benchmarks: <5s load time achieved
- Cross-browser support: Chromium, Firefox, WebKit
- Regulatory compliance: PCI DSS, GDPR evidence

Files Modified:
- tests/ directory: Complete restructure
- GitHub Actions: Updated action versions
- Helper classes: auth-helpers.ts, security-helpers.ts
- Documentation: Comprehensive README updates

Test Results:
- Total scenarios: 100+
- Pass rate: 100% (24/24 passing)
- Performance: 462ms-629ms load times
- Security: All validations passing
- Accessibility: WCAG compliant

Breaking Changes: None
Migration Required: None

Co-authored-by: OvenAI Testing Framework <testing@ovenai.app>"
```

### Step 4: Push to Production
```bash
# Push updated main to origin with verbose output
git push origin main --verbose

# Verify push succeeded
git log --oneline -3
git status

# Tag the release
git tag -a v1.0.0 -m "Release v1.0.0: Comprehensive Testing Implementation"
git push origin v1.0.0
```

### Step 5: Production Deployment Verification
```bash
# Run production smoke tests
npm run test:smoke -- --config=playwright.prod.config.ts

# Verify deployment
curl -I https://your-production-url.com

# Monitor logs
# Check application monitoring dashboard
# Verify all services are healthy
```

## 5. Cleanup Process

### Step 1: Delete Feature Branch
```bash
# Delete local feature branch
git branch -d feature/your-feature-name

# Delete remote feature branch
git push origin --delete feature/your-feature-name
```

### Step 2: Update Local Repository
```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Clean up tracking branches
git remote prune origin

# Verify clean state
git status
git branch -a
```

## 6. Emergency Hotfix Process

### For Critical Production Issues
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# Make minimal fix
# Test thoroughly
# Create PR with "HOTFIX" label
# Fast-track review process
# Deploy immediately after merge
```

## 7. Automated Deployment Commands

### Quick Deploy Script
```bash
#!/bin/bash
# deploy.sh - Quick deployment script

echo "Starting deployment process..."

# Update main
git checkout main
git pull origin main

# Verify tests pass
npm run test:all || exit 1

# Build for production
npm run build || exit 1

# Push to production
git push origin main --verbose

# Tag release
VERSION=$(date +"%Y.%m.%d.%H%M")
git tag -a "v$VERSION" -m "Production deployment $VERSION"
git push origin "v$VERSION"

echo "Deployment completed successfully!"
echo "Version: v$VERSION"
```

### Make script executable
```bash
chmod +x deploy.sh
./deploy.sh
```

## 8. Monitoring & Rollback

### Post-Deployment Monitoring
```bash
# Check application health
curl -f https://your-app.com/health || echo "Health check failed"

# Monitor error rates
# Check performance metrics
# Verify database connectivity
```

### Rollback Process (if needed)
```bash
# Find last known good commit
git log --oneline -10

# Create rollback branch
git checkout -b rollback/emergency-fix

# Reset to previous commit
git reset --hard PREVIOUS_COMMIT_HASH

# Force push (use with caution)
git push origin rollback/emergency-fix --force

# Create emergency PR for rollback
```

## 9. Best Practices Summary

### Commit Messages
- Use conventional commits format
- Include scope and breaking changes
- Provide detailed descriptions for major changes

### Branch Management
- Keep feature branches small and focused
- Regularly sync with main branch
- Delete merged branches promptly

### Testing
- Run all tests before pushing
- Include both automated and manual testing
- Document test results in PR

### Code Review
- Review for security, performance, maintainability
- Test locally before approving
- Provide constructive feedback

### Production Deployment
- Always test in staging first
- Use verbose commits for main branch
- Monitor post-deployment metrics
- Have rollback plan ready

## 10. Troubleshooting

### Common Issues
```bash
# Merge conflicts
git status
git diff
# Resolve conflicts manually
git add .
git commit

# Failed tests
npm run test:debug
# Fix issues and re-run

# Build errors
npm run build:debug
# Check dependencies and configuration

# Deployment failures
# Check GitHub Actions logs
# Verify environment variables
# Check network connectivity
```

This workflow ensures code quality, thorough testing, and safe production deployments while maintaining clear traceability and rollback capabilities. 