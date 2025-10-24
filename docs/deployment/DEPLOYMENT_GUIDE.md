# Deployment Guide - CRM Demo

## Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Repository pushed to GitHub

### Steps

1. **Connect to Vercel**
   ```bash
   # Push your code to GitHub first
   git push origin master
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Select your `ovenai-crm-portfolio-demo` repository
   - Click "Import"

3. **Configure Environment Variables** (Optional)
   ```
   VITE_DEMO_MODE=true
   VITE_APP_NAME=CRM Demo
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait ~2-3 minutes
   - Your site will be live at `https://your-project.vercel.app`

### Build Configuration

Vercel automatically detects Vite projects. Configuration in `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Auto-Deployment

✅ Every push to `master` branch automatically deploys
✅ Pull requests create preview deployments
✅ Rollback available in Vercel dashboard

## Troubleshooting

### Build Fails
1. Check Vercel build logs
2. Test build locally: `npm run build`
3. Ensure all files are committed (check `.gitignore`)

### Missing Files Error
```
Could not resolve "./path/to/file"
```
**Fix:** File is blocked by `.gitignore`. See [GITIGNORE_FIX_SUMMARY](../fixes/GITIGNORE_FIX_SUMMARY.md)

### Environment Variables
- Set in Vercel dashboard: Project Settings → Environment Variables
- Changes require redeployment

## Performance

- Build time: ~10-15s
- Deploy time: ~2-3 minutes total
- CDN: Global edge network
- SSL: Automatic HTTPS

## Monitoring

- Visit Vercel Dashboard for:
  - Build logs
  - Deployment history
  - Analytics
  - Error tracking

---

**Status:** ✅ Deployed at https://ovenai-crm-portfolio-demo.vercel.app

