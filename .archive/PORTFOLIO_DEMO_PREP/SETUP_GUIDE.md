# 🚀 OvenAI CRM Demo - Complete Setup Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Clone and Prepare Repository](#step-1-clone-and-prepare-repository)
3. [Step 2: Find Stable Commit](#step-2-find-stable-commit)
4. [Step 3: Create Demo Branch](#step-3-create-demo-branch)
5. [Step 4: Sanitize Content](#step-4-sanitize-content)
6. [Step 5: Add Demo Components](#step-5-add-demo-components)
7. [Step 6: Configure Mock Data](#step-6-configure-mock-data)
8. [Step 7: Deploy to Vercel](#step-7-deploy-to-vercel)
9. [Step 8: Update ShellCV Terminal](#step-8-update-shellcv-terminal)
10. [Testing Checklist](#testing-checklist)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

✅ Required tools:
- Git
- Node.js (v18+)
- npm or yarn
- Vercel CLI (`npm i -g vercel`)
- Code editor (VS Code recommended)

✅ Access to:
- OvenAI-usersite GitHub repository
- Vercel account
- ShellCV repository (for terminal integration)

---

## Step 1: Clone and Prepare Repository

```bash
# Clone the OvenAI-usersite repository
git clone https://github.com/broddo-baggins/OvenAI-usersite.git
cd OvenAI-usersite

# Ensure you're on the main branch
git checkout main
git pull origin main
```

---

## Step 2: Find Stable Commit

Find the most stable, working commit to base your demo on:

```bash
# Search git history for stable versions
git log --oneline --all | grep -E "stable|working|production|v1.0|release"

# Or view all recent commits
git log --oneline -20

# Check specific commits
git show <commit-hash>
```

**Look for commits with messages like:**
- ✅ "Production ready"
- ✅ "Stable version"
- ✅ "v1.0 release"
- ✅ "All features working"
- ❌ Avoid "WIP", "fixing bugs", "broken"

**Example:**
```bash
# Let's say you find: abc123f - "Production v1.0 - All features stable"
git checkout abc123f
```

---

## Step 3: Create Demo Branch

```bash
# Create and checkout demo-portfolio branch from stable commit
git checkout -b demo-portfolio

# Verify you're on the right branch
git branch
# Should show: * demo-portfolio
```

---

## Step 4: Sanitize Content

### 4.1 Remove Sensitive References

Search and replace across all files:

```bash
# Find all occurrences of "Idan" (case-insensitive)
grep -ri "idan" . --exclude-dir={node_modules,.git,dist,build}

# Use VS Code Find & Replace (Cmd+Shift+H / Ctrl+Shift+H)
# Find: idan (case-insensitive)
# Replace with: Agent A (or Generic Name)
```

### 4.2 Remove Customer Data

Files likely containing sensitive data:
- `src/data/leads.ts` or `src/data/leads.json`
- `src/data/conversations.ts`
- `src/utils/constants.ts`
- Any hardcoded API keys or tokens

**Replace with mock data:**

```bash
# Back up original files first
mkdir -p backups
cp src/data/leads.ts backups/
cp src/data/conversations.ts backups/

# Now replace with mock data (we'll provide in next step)
```

### 4.3 Clean Environment Variables

```bash
# Create .env.demo file
cat > .env.demo << 'EOF'
VITE_APP_MODE=demo
VITE_APP_NAME=OvenAI CRM Demo
VITE_DEMO_MODE=true
# No real API keys needed in demo mode
EOF

# Update .gitignore to ensure real .env is never committed
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore
```

---

## Step 5: Add Demo Components

### 5.1 Copy Demo Files

Copy the files from `PORTFOLIO_DEMO_PREP/` to your OvenAI-usersite repo:

```bash
# Assuming you have PORTFOLIO_DEMO_PREP ready
cp ../PORTFOLIO_DEMO_PREP/mockData.js ./src/data/mockData.js
cp ../PORTFOLIO_DEMO_PREP/components/HelpTooltip.jsx ./src/components/HelpTooltip.jsx
cp ../PORTFOLIO_DEMO_PREP/components/DemoWelcome.jsx ./src/components/DemoWelcome.jsx
cp ../PORTFOLIO_DEMO_PREP/components/FakeLogin.jsx ./src/components/FakeLogin.jsx
cp ../PORTFOLIO_DEMO_PREP/DEMO_NOTES.md ./DEMO_NOTES.md
cp ../PORTFOLIO_DEMO_PREP/vercel.json ./vercel.json
```

### 5.2 Update Package.json

Add demo build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:demo": "VITE_DEMO_MODE=true vite build",
    "preview": "vite preview"
  }
}
```

---

## Step 6: Configure Mock Data

### 6.1 Replace API Calls

Find files that make API calls and replace with mock data:

**Before:**
```javascript
// src/services/leadService.ts
export const getLeads = async () => {
  const response = await fetch('/api/leads');
  return response.json();
};
```

**After:**
```javascript
// src/services/leadService.ts
import { mockApi } from '../data/mockData';

export const getLeads = async () => {
  // Use mock data in demo mode
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return mockApi.getLeads();
  }
  
  // Original API call (won't execute in demo)
  const response = await fetch('/api/leads');
  return response.json();
};
```

### 6.2 Update Components to Use Mock Data

Example for Lead List component:

```javascript
// src/components/LeadList.tsx
import { mockApi } from '../data/mockData';

function LeadList() {
  const [leads, setLeads] = useState([]);
  
  useEffect(() => {
    // Always use mock data in demo mode
    mockApi.getLeads().then(response => {
      setLeads(response.data);
    });
  }, []);
  
  // ... rest of component
}
```

---

## Step 7: Deploy to Vercel

### 7.1 Install Vercel CLI

```bash
npm i -g vercel
vercel login
```

### 7.2 Configure Project

```bash
# In your OvenAI-usersite directory
vercel

# Follow prompts:
# ? Set up and deploy "~/OvenAI-usersite"? Y
# ? Which scope? Your username
# ? Link to existing project? N
# ? What's your project's name? ovenai-crm-demo
# ? In which directory is your code located? ./
# ? Want to override the settings? N
```

### 7.3 Set Environment Variables

```bash
# Set demo mode environment variable
vercel env add VITE_DEMO_MODE
# When prompted, enter: true
# Select: Production, Preview, Development

vercel env add VITE_APP_NAME
# When prompted, enter: OvenAI CRM Demo
# Select: Production, Preview, Development
```

### 7.4 Deploy from Demo Branch

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare demo with sanitized content and mock data"
git push origin demo-portfolio

# Deploy to Vercel
vercel --prod
```

### 7.5 Get Your Demo URL

After deployment completes, Vercel will provide URLs like:
- **Production**: `https://ovenai-crm-demo.vercel.app`
- **Preview**: `https://ovenai-crm-demo-git-demo-portfolio-yourusername.vercel.app`

---

## Step 8: Update ShellCV Terminal

### 8.1 Update terminal.js

Open your ShellCV repo and update `terminal.js`:

```javascript
// Add to command handlers
showOvenAITour() {
    const tour = `
<span class="section-header">OVENAI CRM - INTERACTIVE DEMO</span>

<span class="success">🎯 Real Production Results:</span>
  • 70% response rate (vs 2% SMS baseline)
  • 2.5× more meetings scheduled
  • ~70% reduction in manual follow-up time
  • 100+ leads handled per day per agent

<span class="success">🛠 Technical Stack:</span>
  React + TypeScript | Node.js + Express | PostgreSQL + Redis
  WhatsApp Business API | LLM-based agent | BANT scoring

<span class="warning">⚠️ Demo Notes:</span>
This is a portfolio demo with mock data. Due to legal constraints,
actual customer data has been removed. All features are fully functional
with hardcoded sample data to showcase capabilities.

<span class="success">🚀 Ready to explore the demo?</span>
    `;
    this.printOutput(tour);
    await this.sleep(500);
    
    this.printOutput('\n<span class="success">Launch OvenAI CRM demo in new tab? (Y/N):</span>');
    this.waitingForOvenAIResponse = true;
}

// In handleCommand, add Y/N prompt handler
if (this.waitingForOvenAIResponse) {
    const response = command.toLowerCase();
    if (response === 'y' || response === 'yes') {
        window.open('https://ovenai-crm-demo.vercel.app', '_blank');
        this.printOutput('<span class="success">✓ Opening demo in new tab...</span>');
    } else {
        this.printOutput('<span class="comment">Demo cancelled.</span>');
    }
    this.waitingForOvenAIResponse = false;
    return;
}

// Add 'ovenai' command
case 'ovenai':
case 'tour':
    this.showOvenAITour();
    break;
```

### 8.2 Update Help Menu

```javascript
// In showHelp() method
const helpText = `
  ...
  ovenai, tour        Launch OvenAI CRM demo
  ...
`;
```

### 8.3 Test Terminal Integration

```bash
# In ShellCV repo
git add terminal.js
git commit -m "Add OvenAI demo integration"
git push origin main

# Visit your ShellCV site
# Type: ovenai
# Press: Y
# Verify demo opens in new tab
```

---

## Testing Checklist

### ✅ Pre-Deployment Tests

- [ ] No references to "Idan" anywhere
- [ ] No real customer data visible
- [ ] No actual API keys in code
- [ ] All API calls use mock data
- [ ] Demo welcome modal appears on first load
- [ ] Fake login always succeeds
- [ ] Help tooltips work on all pages

### ✅ Post-Deployment Tests

- [ ] Demo URL loads successfully
- [ ] All pages accessible without errors
- [ ] Mobile responsive (test on phone)
- [ ] Charts and analytics display correctly
- [ ] Lead list shows mock data
- [ ] Conversation view works
- [ ] Calendar bookings visible
- [ ] No console errors
- [ ] Fast load time (<3s)

### ✅ Terminal Integration Tests

- [ ] Type `ovenai` in ShellCV terminal
- [ ] Y/N prompt appears
- [ ] Pressing Y opens demo in new tab
- [ ] Pressing N cancels gracefully
- [ ] Help menu shows ovenai command

---

## Troubleshooting

### Issue: Build fails on Vercel

**Solution:**
```bash
# Check build locally first
npm run build:demo

# If successful, check Vercel logs
vercel logs

# Common fix: Update build command in Vercel dashboard
# Build Command: npm run build
# Output Directory: dist
```

### Issue: Mock data not loading

**Solution:**
```javascript
// Check if VITE_DEMO_MODE is set
console.log('Demo mode:', import.meta.env.VITE_DEMO_MODE);

// Ensure mockData.js is imported correctly
import { mockApi } from '../data/mockData';
```

### Issue: Demo welcome modal doesn't appear

**Solution:**
```javascript
// Clear localStorage
localStorage.removeItem('ovenai_demo_welcome_seen');

// Or in browser console:
localStorage.clear();
// Refresh page
```

### Issue: Terminal Y/N prompt not working

**Solution:**
```javascript
// Verify waitingForOvenAIResponse flag is set
// Check handleCommand processes response before other commands
// Ensure the flag is reset after handling
```

### Issue: Some pages show real data

**Solution:**
```bash
# Search for remaining API calls
grep -r "fetch.*api" src/ --exclude-dir=node_modules

# Replace all with mock data:
if (import.meta.env.VITE_DEMO_MODE === 'true') {
  return mockApi.getX();
}
```

---

## 🎉 Success Criteria

Your demo is ready when:

1. ✅ Demo loads at your Vercel URL
2. ✅ Welcome modal explains it's a demo
3. ✅ No sensitive data visible anywhere
4. ✅ All features work with mock data
5. ✅ Help icons provide implementation details
6. ✅ Mobile-friendly and fast
7. ✅ Terminal integration works smoothly
8. ✅ Professional portfolio-quality presentation

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [React Deployment Guide](https://react.dev/learn/start-a-new-react-project#deploying-to-production)
- [Mock Data Best Practices](https://kentcdodds.com/blog/mocking-is-a-code-smell)

---

## 🆘 Need Help?

If you run into issues:
1. Check Vercel deployment logs
2. Test build locally first (`npm run build:demo`)
3. Verify all mock data imports
4. Check browser console for errors
5. Review this guide step-by-step

---

**Good luck with your portfolio demo! 🚀**

Remember: The goal is to showcase your technical skills while respecting confidentiality. This demo proves you can build production-grade systems!

