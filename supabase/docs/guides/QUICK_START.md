# 🚀 Quick Start Guide: Clean Database Setup

## Current Status
✅ **Database Connected**: 6 core tables ready  
✅ **Workflow Issues**: Cleaned up with scripts below  
✅ **Target**: Sarah Martinez marketing agency data  

---

## 🔧 **Step 1: Remove Workflow Functions**

**Problem**: Database has leftover workflow functions causing errors  
**Solution**: Run cleanup script

```bash
cd supabase/tests
node 01-find-workflow-functions.js
```

**Expected Output**: 
- ✅ Database connection successful
- ✅ Workflow functions identified and removed  
- ✅ Client creation test passes

---

## 📊 **Step 2: Create Sarah Martinez Data**

**Goal**: Complete marketing agency with realistic leads

```bash
node 02-create-sarah-data.js
```

**Creates**:
- 🏢 **1 Client**: Digital Growth Marketing
- 📊 **3 Projects**: TechStore, CloudApp, Austin Restaurants  
- 👥 **26 Leads**: E-commerce, SaaS, Local business leads
- 📈 **~15% Conversion**: Realistic B2B conversion rates

---

## 🎯 **Current Database Structure**

```
Tables (6):
├── clients         (company info)
├── projects        (marketing campaigns) 
├── leads           (prospects)
├── profiles        (user accounts)
├── client_members  (user-client relationships)
└── project_members (user-project relationships)
```

**All tables**: 0 rows (clean slate)  
**Status**: Ready for data creation

---

## 🔍 **Troubleshooting**

### Error: "workflow_triggers does not exist"
**Cause**: Database functions still reference deleted tables  
**Fix**: Run `01-find-workflow-functions.js` to remove them

### Error: "Could not find function sql()"  
**Cause**: RPC functions unavailable  
**Fix**: Use Supabase Dashboard SQL editor instead

### Error: "Connection failed"
**Cause**: Invalid credentials  
**Fix**: Check `supabase-credentials.local` file exists

---

## ✅ **Success Criteria**

After running both scripts:
- ✅ No workflow-related errors  
- ✅ 1 client created successfully
- ✅ 3 projects with realistic descriptions
- ✅ 26 leads across different industries
- ✅ Proper status distribution (converted, qualified, etc.)
- ✅ Your 400/500 errors should be resolved

---

## 📁 **File Organization**

```
supabase/
├── tests/
│   ├── 01-find-workflow-functions.js  (cleanup)
│   └── 02-create-sarah-data.js        (data creation)
├── guides/
│   └── QUICK_START.md                 (this file)
└── supabase-credentials.local         (your DB config)
```

**Removed**: All cluttered test files and complex guides  
**Kept**: Only essential scripts and this quick start

---

*Ready to create your complete client experience!* 🎉 