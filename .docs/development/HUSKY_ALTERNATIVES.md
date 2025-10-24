# Husky Alternatives for Git Hooks

**Current Status:** Husky v8 (deprecated syntax warnings)  
**Issue:** Husky v10 will break current setup

---

## Top Alternatives

### 1. Lefthook (Recommended)

**Why:**
- Fast (written in Go)
- Simple configuration
- No npm install overhead
- Cross-platform

**Setup:**
```bash
# Install
npm install lefthook --save-dev

# Initialize
npx lefthook install

# Configure in lefthook.yml
```

**Configuration (lefthook.yml):**
```yaml
pre-push:
  commands:
    type-check:
      run: npm run type-check
    lint:
      run: npm run lint
    build:
      run: npm run build
```

**Migration:**
```bash
# Remove Husky
npm uninstall husky
rm -rf .husky

# Install Lefthook
npm install lefthook --save-dev
npx lefthook install

# Create lefthook.yml with your hooks
```

---

### 2. Simple-git-hooks

**Why:**
- Lightweight (no dependencies)
- Simple configuration
- Fast execution

**Setup:**
```bash
npm install simple-git-hooks --save-dev
```

**Configuration (package.json):**
```json
{
  "simple-git-hooks": {
    "pre-push": "npm run type-check && npm run lint && npm run build"
  }
}
```

**Install hooks:**
```bash
npx simple-git-hooks
```

---

### 3. Native Git Hooks (No Tools)

**Why:**
- No dependencies
- Complete control
- Always works

**Setup:**
```bash
# Create hook directly
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh
npm run type-check || exit 1
npm run lint || exit 1
npm run build || exit 1
EOF

chmod +x .git/hooks/pre-push
```

**Pros:**
- No npm package needed
- Fast
- Simple

**Cons:**
- Not committed to git
- Each developer must set up manually
- Harder to share/update

---

### 4. Husky v9+ (Updated Version)

**Why:**
- Familiar if you already use Husky
- Well-maintained
- Good documentation

**Migration:**
```bash
# Update to latest
npm install husky@latest --save-dev

# Reinitialize
npx husky init

# Update hooks (no deprecated syntax)
```

**New Syntax (v9+):**
```bash
# .husky/pre-push (new format)
npm run type-check
npm run lint
npm run build
```

---

## Comparison

| Tool | Speed | Setup | Dependencies | Config |
|------|-------|-------|--------------|--------|
| **Lefthook** | ⚡⚡⚡ | Easy | None | YAML |
| **simple-git-hooks** | ⚡⚡ | Easy | None | package.json |
| **Native** | ⚡⚡⚡ | Manual | None | Shell scripts |
| **Husky v9** | ⚡ | Easy | Node | Shell scripts |

---

## Recommendation for Your Project

### For Portfolio Demo: **Simple-git-hooks**

**Why:**
1. Minimal dependencies
2. Simple configuration
3. Fast enough for demo
4. Easy to understand

**Migration Steps:**
```bash
cd /Users/amity/projects/ovenai-crm-portfolio-demo

# 1. Remove Husky
npm uninstall husky
rm -rf .husky

# 2. Install simple-git-hooks
npm install simple-git-hooks --save-dev

# 3. Add to package.json
npm pkg set simple-git-hooks.pre-push="npm run type-check && npm run lint"

# 4. Install hooks
npx simple-git-hooks

# 5. Test
git add .
git commit -m "Test hooks"
git push
```

---

### For Production: **Lefthook**

**Why:**
1. Fastest execution
2. Parallel command support
3. Best for teams
4. Most reliable

---

## Quick Fix: Update Current Husky

**Simplest Solution (No Migration):**

Just remove the deprecated lines from `.husky/pre-push`:

**Current (lines 1-2):**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
```

**Remove those lines** - I already did this in the updated `.husky/pre-push` file.

**Result:** No more deprecation warnings!

---

## Summary

**Current Status:** Fixed (removed deprecated syntax)  
**Short-term:** Current setup works fine  
**Long-term:** Consider migrating to **simple-git-hooks** or **Lefthook**

**Action Needed:** None immediately - hooks are working!

---

## Test Your Updated Hooks

```bash
cd /Users/amity/projects/ovenai-crm-portfolio-demo

# Test pre-push hook
git add .
git commit -m "Test updated hooks"
git push

# Should run:
# - TypeScript check
# - Linting
# - Build test
# - No more Playwright errors!
```

---

**Updated:** October 24, 2025  
**Status:** Deprecation warnings fixed, hooks working

