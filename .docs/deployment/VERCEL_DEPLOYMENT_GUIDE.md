# 🚀 Vercel Deployment Guide

## Quick Deploy (Recommended)

### Method 1: Vercel Dashboard
1. Go to https://vercel.com/new
2. Import from **GitHub:** `broddo-baggins/ovenai-crm-portfolio-demo`
3. **Project Name:** `ovenai-crm-demo` (or your choice)
4. **Framework Preset:** Vite
5. **Root Directory:** `./` (default)
6. **Build Command:** `npm run build`
7. **Output Directory:** `dist`
8. **Install Command:** `npm install`

### Environment Variables (Add in Vercel Dashboard)
```
VITE_DEMO_MODE=true
VITE_APP_NAME=OvenAI CRM Demo
VITE_SUPABASE_URL=https://demo.supabase.co
VITE_SUPABASE_ANON_KEY=demo_placeholder_key
```

### Method 2: Vercel CLI (if you have it installed)
```bash
# Make sure you're in the ovenai-crm-portfolio-demo directory
cd /Users/amity/projects/oven-ai/ovenai-crm-portfolio-demo

# Login to Vercel
vercel login

# Deploy
vercel

# When prompted:
# - Setup and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name: ovenai-crm-demo
# - Directory: ./
# - Modify settings? Y
#   - Build Command: npm run build
#   - Output Directory: dist
#   - Development Command: npm run dev
# - Deploy? Y
```

## After Deployment

1. **Get your deployment URL:**
   - Should be something like: `https://ovenai-crm-demo.vercel.app`
   - Or custom domain: `https://ovenai-crm-demo-yourusername.vercel.app`

2. **Test the demo:**
   - Visit the URL
   - Click around
   - Check that mock data loads
   - Verify no database errors

3. **Update AmitCV.sh terminal.js:**
   - Replace placeholder URL with your actual Vercel URL
   - See next section for details

---

## Custom Domain (Optional)

If you want a nicer URL like `crm.amitcv.sh`:

1. Go to **Project Settings → Domains**
2. Add custom domain
3. Update DNS settings in GoDaddy:
   - Type: CNAME
   - Name: crm (or ovenai)
   - Value: cname.vercel-dns.com
4. Wait for DNS propagation (~5 mins)

---

## Troubleshooting

### Build Fails
- Check that `package.json` has all dependencies
- Verify `vite.config.ts` is correct
- Look at build logs in Vercel dashboard

### Demo Mode Not Working
- Verify environment variables are set in Vercel
- Check browser console for errors
- Make sure `VITE_DEMO_MODE=true` is set

### Import Errors
- Some large files (like videos) might cause issues
- Consider removing `docs/04-COMPLIANCE/app-review/video/` folder if needed
- Or add to `.vercelignore`

---

## Production Checklist

- ✅ Environment variables set
- ✅ Build succeeds
- ✅ Demo loads without errors
- ✅ Mock data displays correctly
- ✅ No database connection attempts
- ✅ Mobile responsive
- ✅ Fast page loads (< 3s)
- ✅ Custom domain (optional)

---

**Ready to update AmitCV.sh terminal once deployed!**

