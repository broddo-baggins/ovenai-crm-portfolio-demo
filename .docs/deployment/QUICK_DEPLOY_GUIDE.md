# 🚀 Quick Vercel Deployment Guide

**Last Updated:** October 24, 2025  
**Status:** ✅ Build Verified - Ready to Deploy

---

## ✅ Pre-Deployment Checklist

- [x] Repository created: `github.com/broddo-baggins/ovenai-crm-portfolio-demo`
- [x] All sensitive data sanitized (322 "Idan" references removed)
- [x] Mock data integrated in 4 services
- [x] Build tested locally (✅ Successful in 10.72s)
- [x] Demo environment variables configured
- [x] Code pushed to GitHub

---

## 🚀 Deploy to Vercel (5 Minutes)

### **Option A: Vercel Dashboard (Recommended)**

1. **Go to Vercel:**
   - Visit: https://vercel.com/new
   - Login with GitHub

2. **Import Repository:**
   - Click "Import Git Repository"
   - Search for: `ovenai-crm-portfolio-demo`
   - Select the repository
   - Click "Import"

3. **Configure Project:**
   ```
   Project Name: ovenai-crm-demo
   Framework Preset: Vite
   Root Directory: ./
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

4. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```bash
   VITE_DEMO_MODE=true
   VITE_APP_NAME=OvenAI CRM Demo
   VITE_APP_MODE=demo
   VITE_DEMO_BANNER=true
   VITE_SUPABASE_URL=https://demo.supabase.co
   VITE_SUPABASE_ANON_KEY=demo_placeholder_key
   NODE_ENV=production
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://ovenai-crm-demo.vercel.app`

---

### **Option B: Vercel CLI**

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Navigate to project
cd /Users/amity/projects/ovenai-crm-portfolio-demo

# Deploy to production
vercel --prod

# Follow prompts:
# - Project name: ovenai-crm-demo
# - Link to existing project? N
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

**Set environment variables:**
```bash
vercel env add VITE_DEMO_MODE
# Enter: true
# Select: Production, Preview, Development

vercel env add VITE_APP_NAME
# Enter: OvenAI CRM Demo
# Select: Production, Preview, Development

vercel env add VITE_SUPABASE_URL
# Enter: https://demo.supabase.co
# Select: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Enter: demo_placeholder_key
# Select: Production, Preview, Development
```

**Re-deploy with env vars:**
```bash
vercel --prod
```

---

## 🧪 Testing After Deployment

### 1. **Basic Functionality:**
- [ ] Demo loads without errors
- [ ] Welcome modal appears (first visit)
- [ ] Mock data displays correctly
- [ ] No console errors

### 2. **Page Navigation:**
- [ ] Dashboard loads
- [ ] Leads page shows 10 mock leads
- [ ] Conversation view works
- [ ] Analytics charts display
- [ ] Calendar bookings visible

### 3. **Demo Features:**
- [ ] BANT scores visible (85, 92, etc.)
- [ ] 70% response rate in analytics
- [ ] Mock conversations load
- [ ] Calendar meetings show

### 4. **Mobile Responsiveness:**
- [ ] Test on mobile device
- [ ] Navigation works
- [ ] Touch interactions smooth

---

## 🎯 Expected URLs

After deployment, you'll get:

- **Production:** `https://ovenai-crm-demo.vercel.app`
- **Preview (branches):** `https://ovenai-crm-demo-git-[branch]-yourusername.vercel.app`
- **Custom domain (optional):** `crm.amitcv.sh`

---

## 🔧 Troubleshooting

### Build Fails on Vercel

**Solution:**
```bash
# Test build locally first
cd /Users/amity/projects/ovenai-crm-portfolio-demo
npm run build

# If successful, check Vercel logs
vercel logs

# Common fix: Update build settings
# Build Command: npm run build
# Output Directory: dist
```

### Environment Variables Not Working

**Solution:**
1. Go to Vercel dashboard → Project Settings → Environment Variables
2. Verify all variables are set
3. Make sure they're enabled for "Production"
4. Redeploy: `vercel --prod --force`

### 404 on Page Refresh

**Solution:**
Ensure `vercel.json` has SPA routing (already configured):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Mock Data Not Loading

**Solution:**
Check browser console for:
```javascript
console.log('Demo mode:', import.meta.env.VITE_DEMO_MODE);
// Should output: "Demo mode: true"
```

If false, environment variables aren't set correctly in Vercel.

---

## 📊 Build Verification

Local build test results:
```
✅ Build Command: npm run build
✅ Build Time: 10.72s
✅ Output Size: ~12 MB (dist folder)
✅ No build errors
✅ Demo mode: Enabled
✅ Mock data: Integrated
```

---

## 🎉 Post-Deployment Steps

Once deployed:

1. **Save Your URL:**
   ```
   Production URL: ___________________________
   Deployment Date: __________________________
   ```

2. **Test Thoroughly:**
   - Visit all pages
   - Check mobile view
   - Verify mock data
   - Test all interactions

3. **Update Terminal Integration:**
   - Edit AmitCV.sh `terminal.js`
   - Add your Vercel URL
   - Test `ovenai` command

4. **Share Your Demo:**
   - Add to resume
   - Update LinkedIn
   - Share in portfolio
   - Tweet about it! 🎉

---

## 📝 Next Steps

After successful deployment:

1. ✅ Get deployment URL
2. ✅ Test demo functionality
3. ✅ Verify mobile responsiveness
4. ⏳ Update AmitCV.sh terminal
5. ⏳ Add custom domain (optional)
6. ⏳ Share in portfolio

---

## 🔗 Resources

- **GitHub Repo:** https://github.com/broddo-baggins/ovenai-crm-portfolio-demo
- **Vercel Docs:** https://vercel.com/docs
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Demo Notes:** See `DEMO_NOTES.md` in repo

---

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Test `npm run build` locally
3. Verify all environment variables
4. Check browser console for errors
5. Review `TROUBLESHOOTING.md` (if exists)

---

**Ready to deploy!** 🚀

Once deployed, copy your URL and we'll integrate it into your terminal CV!

