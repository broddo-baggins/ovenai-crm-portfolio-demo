# Project Cleanup & Professional Organization Plan

## Current Issues
- 24 markdown files in root directory (unprofessional)
- Mixed documentation types (status, guides, notes)
- Unclear project structure
- PORTFOLIO_DEMO_PREP folder outdated
- Duplicate/obsolete files

## Professional Structure (Target)

```
/
├── README.md                          # Main project overview
├── LICENSE                            # Project license
├── CONTRIBUTING.md                    # Contribution guidelines
├── CHANGELOG.md                       # Version history
├── package.json                       # Dependencies
├── package-lock.json
├── tsconfig.json                      # TypeScript config
├── tailwind.config.ts                 # Tailwind config
├── vite.config.ts                     # Vite config
├── eslint.config.js                   # ESLint config
├── postcss.config.js                  # PostCSS config
├── components.json                    # Shadcn config
├── index.html                         # Entry HTML
├── vercel.json                        # Deployment config
├── docker-compose.yml                 # Docker config
│
├── .docs/                             # All documentation (hidden)
│   ├── README.md                      # Docs navigation
│   ├── deployment/                    # Deployment guides
│   ├── development/                   # Development guides
│   ├── testing/                       # Testing documentation
│   ├── features/                      # Feature documentation
│   ├── status/                        # Status reports (archive)
│   ├── guides/                        # User guides
│   └── archive/                       # Obsolete docs
│
├── src/                               # Source code
├── public/                            # Static assets
├── dist/                              # Build output (gitignored)
│
├── scripts/                           # Utility scripts
│   ├── README.md                      # Scripts documentation
│   ├── build/                         # Build scripts
│   ├── deploy/                        # Deployment scripts
│   ├── dev/                           # Development tools
│   └── maintenance/                   # Maintenance scripts
│
├── tests/                             # Test files
├── quality-validation/                # QA and validation
│
├── docs/                              # Public documentation
│   ├── api/                           # API documentation
│   ├── guides/                        # User guides
│   └── technical/                     # Technical specs
│
└── supabase/                          # Database and backend
```

## Files to Move/Archive

### Root MD Files → .docs/
- ALL_TABS_STATUS.md → .docs/status/
- BUILD_TEST_RESULTS.md → .docs/testing/
- CALENDAR_READY.md → .docs/status/archive/
- CRITICAL_FIXES_DEPLOYED.md → .docs/deployment/
- DEMO_MODE_FIXES.md → .docs/development/
- DEMO_NOTES.md → .docs/development/
- DEPLOYMENT_READY.md → .docs/status/archive/
- DEPLOYMENT_STATUS.md → .docs/deployment/
- FIX_HUSKY_AND_COMMIT.md → .docs/development/
- GIT_HISTORY_WARNING.md → .docs/development/
- HUSKY_ALTERNATIVES.md → .docs/development/
- MOCK_DATA_UPDATE.md → .docs/development/
- PATH_AUDIT_REPORT.md → .docs/development/
- QUICK_DEPLOY_GUIDE.md → .docs/deployment/
- READY_TO_DEPLOY.md → .docs/status/archive/
- SECURITY_AUDIT.md → .docs/security/
- SESSION_SUMMARY.md → .docs/status/archive/
- START_HERE.md → Keep (rename to GETTING_STARTED.md)
- VERCEL_DEPLOYMENT_GUIDE.md → .docs/deployment/
- VERCEL_FIX.md → .docs/deployment/

### New Essential Files
- CRM_DEMO_PROPAGATION_PLAN.md → .docs/deployment/
- DEMO_READY_SUMMARY.md → .docs/deployment/
- GIT_HISTORY_CLEANUP_GUIDE.md → .docs/development/

### To Keep in Root
- README.md (rewrite for professional presentation)
- LICENSE (create if missing)
- CONTRIBUTING.md (create)
- CHANGELOG.md (create from git history)

### To Remove/Archive
- PORTFOLIO_DEMO_PREP/ → Archive (obsolete)
- bun.lockb → Delete (using npm)
- test-build.sh → Move to scripts/build/
- fix-vercel.sh → Move to scripts/deploy/

## Implementation Steps

1. Create .docs/ structure
2. Move all markdown files
3. Create new professional README
4. Create CONTRIBUTING.md
5. Create CHANGELOG.md
6. Clean up root directory
7. Update all internal links
8. Create navigation indexes
9. Commit changes
10. Verify build still works

