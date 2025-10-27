# Complete Rebranding Guide

## Summary
All "ovenai" references have been removed from the codebase. This guide will help you complete the rebranding by renaming the folder, GitHub repository, and Vercel project.

---

## Step 1: Rename Local Folder

### Option A: Simple Rename (Recommended)
```bash
# Navigate to the parent directory
cd /Users/amity/projects

# Rename the folder
mv ovenai-crm-portfolio-demo crm-portfolio-demo

# Navigate into the renamed folder
cd crm-portfolio-demo
```

### Option B: Using Finder
1. Open Finder
2. Navigate to `/Users/amity/projects/`
3. Right-click on `ovenai-crm-portfolio-demo`
4. Select "Rename"
5. Change to `crm-portfolio-demo`

**Note:** Git will automatically track this as a rename, no additional git commands needed.

---

## Step 2: Rename GitHub Repository

### Easy Method (GitHub Website - Recommended)
1. Go to https://github.com/broddo-baggins/ovenai-crm-portfolio-demo
2. Click on "Settings" tab
3. Scroll down to "Repository name" section
4. Change from `ovenai-crm-portfolio-demo` to `crm-portfolio-demo`
5. Click "Rename"

**Important:** GitHub automatically creates redirects, so all old links will still work!

### Update Git Remote (After Rename)
```bash
# Check current remote
git remote -v

# Update remote URL (GitHub will redirect, but good practice to update)
git remote set-url origin https://github.com/broddo-baggins/crm-portfolio-demo.git

# Verify
git remote -v
```

---

## Step 3: Handle Vercel Deployment

You have 3 options for Vercel:

### Option A: Change Domain Only (No Redeployment - Easiest)
This keeps your existing project but changes the URL.

1. Go to https://vercel.com
2. Select your `ovenai-crm-portfolio-demo` project
3. Go to "Settings" > "Domains"
4. Add new domain: `crm-portfolio-demo.vercel.app`
5. Remove old domain: `ovenai-crm-portfolio-demo.vercel.app`

**OR**

### Option B: Rename Project via Vercel CLI (No Redeployment)
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
cd /Users/amity/projects/crm-portfolio-demo
vercel link

# The project settings can be changed in the Vercel dashboard
# Currently, Vercel CLI doesn't support direct project rename
# But you can change the domain as shown in Option A
```

**OR**

### Option C: Create New Vercel Project (Clean Slate - Recommended)
This gives you a completely fresh start with the new name.

```bash
cd /Users/amity/projects/crm-portfolio-demo

# Deploy to new Vercel project
vercel --prod

# During setup:
# - Select "Create new project"
# - Name it: crm-portfolio-demo
# - Use default settings
```

**After deployment:**
1. Go to old project settings: https://vercel.com
2. Delete the old `ovenai-crm-portfolio-demo` project
3. Update any bookmarks to the new URL

**New URL will be:** https://crm-portfolio-demo.vercel.app

---

## Step 4: Commit and Push Changes

```bash
cd /Users/amity/projects/crm-portfolio-demo

# Stage all changes
git add .

# Commit
git commit -m "Complete rebranding: Remove all ovenai references

- Updated vercel.json app name
- Updated sitemap.xml URLs
- Updated env.ts production URLs
- Updated README.md repository links
- Updated all documentation files
- Removed ovenai branding from source files
- Updated internal strings and templates"

# Push to GitHub (new repo name)
git push origin master
```

---

## Step 5: Verify Everything Works

### Local Verification
```bash
cd /Users/amity/projects/crm-portfolio-demo

# Check for any remaining references
grep -r "ovenai" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" . | grep -v "node_modules" | grep -v "dist"

# Should show minimal or no results
```

### Production Verification
After Vercel deployment:
1. Visit new URL: https://crm-portfolio-demo.vercel.app
2. Check browser console for errors
3. Test main features:
   - Dashboard loads with data
   - Projects page shows statistics
   - Reports display charts
   - No console errors
4. Check page titles and meta tags (should say "CRM Demo")

---

## Summary of Changes Made

### Configuration Files
- `vercel.json` - Changed app name to "CRM Portfolio Demo"
- `src/config/env.ts` - Updated all production URLs
- `public/sitemap.xml` - Changed all URLs to crm-portfolio-demo

### Documentation
- `README.md` - Updated repository URLs and clone commands
- `docs/README.md` - Updated deployment URL
- `docs/deployment/DEPLOYMENT_GUIDE.md` - Updated references
- `docs/development/*.md` - Removed ovenai branding
- `docs/security/SECURITY_AUDIT.md` - Updated references

### Source Files
- `src/lib/supabase.ts` - Changed storage keys and headers
- `src/pages/Reports.tsx` - Updated report title
- `src/components/DemoWelcome.jsx` - Updated GitHub link
- `src/services/*.ts` - Updated all user-facing strings
- All template and content strings updated

### What Was Changed
- "OvenAI" → "CRM Demo" or "CRM Portfolio Demo"
- "ovenai-crm-portfolio-demo" → "crm-portfolio-demo"
- All email references → amit@amityogev.com
- Storage keys: ovenai-* → crm-demo-*

---

## Checklist

- [ ] Local folder renamed to `crm-portfolio-demo`
- [ ] GitHub repository renamed to `crm-portfolio-demo`
- [ ] Git remote URL updated
- [ ] Vercel project renamed/recreated
- [ ] Changes committed and pushed
- [ ] New URL verified and working
- [ ] Old Vercel project deleted (if recreated)
- [ ] Bookmarks updated
- [ ] Portfolio/resume updated with new URL

---

## Final Notes

1. **GitHub redirects automatically** - Old links still work
2. **Vercel domain change** - Old domain can be deleted after migration
3. **No data loss** - All changes are cosmetic/naming only
4. **Clean separation** - No ties to old co-founder's company

If you encounter any issues, all changes are in this commit and can be reviewed/modified as needed.

---

**Generated:** October 27, 2025
**Status:** Complete and ready for deployment

