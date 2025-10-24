# 🚀 Bulletproof Architecture Quick Reference

## 🔗 Database Connections

```typescript
// AgentDB (Master - Read Only for UI)
const agentClient = createClient(
  'https://imnyrhjdoaccxenxyfam.supabase.co',
  agentAnonKey
);

// SiteDB (UI Database - Primary for app)  
const siteClient = createClient(
  'https://ajszzemkpenbfnghqiyz.supabase.co', 
  siteServiceKey
);
```

---

## ⚠️ CRITICAL: Field Names

```typescript
// ✅ ALWAYS USE
current_project_id  // Lead-Project relationship

// ❌ NEVER USE  
project_id         // Deprecated/wrong field
```

---

## 🔗 JOIN Patterns (Copy-Paste Ready)

### **Lead with Project & Client**
```typescript
const { data } = await supabase
  .from('leads')
  .select(`
    *,
    project:projects!current_project_id(
      id, name, client_id,
      client:clients(id, name)
    )
  `)
  .eq('current_project_id', projectId);
```

### **Project with Leads Count**
```typescript
const { data } = await supabase
  .from('projects')
  .select(`
    *,
    client:clients(id, name),
    leads(id, status)
  `);
```

### **Full Relationship Chain**
```typescript
const { data } = await supabase
  .from('leads')
  .select(`
    id, first_name, current_project_id, client_id,
    project:projects!current_project_id(
      id, name, client_id,
      client:clients(id, name)
    ),
    lead_client:clients!client_id(id, name)
  `);
```

---

## 🎯 Common Filters

```typescript
// Filter by project
.eq('current_project_id', projectId)

// Filter by client (leads)
.eq('client_id', clientId)  

// Filter by client (projects)
.eq('client_id', clientId)

// Get all leads for a client's projects
.in('current_project_id', projectIdsArray)
```

---

## 🛡️ Data Classification

### **🔄 Core Sync Tables** (AgentDB ↔ SiteDB)
- `clients` - Customer/organization data
- `projects` - Project information  
- `leads` - Lead records with relationships

### **🧠 AgentDB Only**
- System prompts
- Conversation context
- AI configurations
- N8N workflows

### **🎨 SiteDB Only**  
- User preferences
- UI settings
- Dashboard configs
- Theme data

---

## 🚨 Quick Error Fixes

### **"Could not find project_id column"**
```typescript
// ❌ Wrong
.eq('project_id', projectId)

// ✅ Fix  
.eq('current_project_id', projectId)
```

### **"Foreign key relationship failed"**
```typescript
// ❌ Wrong
project:projects(id, name)

// ✅ Fix
project:projects!current_project_id(id, name)
```

### **"Zero leads returned"**
1. Check client memberships exist
2. Verify foreign key relationships
3. Check RLS policies
4. Verify sync integrity

---

## 🔧 Development Checklist

### **Before Writing Queries:**
- [ ] Identify if data is core sync table
- [ ] Use `current_project_id` for lead-project relations  
- [ ] Include explicit foreign key in JOINs
- [ ] Test with actual data

### **Before Schema Changes:**
- [ ] Determine which database(s) affected
- [ ] Apply to AgentDB first (if core table)
- [ ] Apply identical change to SiteDB  
- [ ] Update sync configuration
- [ ] Test all foreign key relationships

### **Before Deployment:**
- [ ] All foreign key relationships tested
- [ ] App queries return expected results
- [ ] Sync health verified
- [ ] Client memberships confirmed

---

## 🎯 Test User Setup

```sql
-- Ensure test user has access
INSERT INTO client_members (user_id, client_id, role)
VALUES ('7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5', client_id, 'admin');
```

---

## 📊 Health Check Script

```typescript
// Quick sync health check
const healthCheck = async () => {
  const [agent, site] = await Promise.all([
    agentClient.from('leads').select('id', { count: 'exact', head: true }),
    siteClient.from('leads').select('id', { count: 'exact', head: true })
  ]);
  
  console.log(`AgentDB: ${agent.data?.length}, SiteDB: ${site.data?.length}`);
  return agent.data?.length === site.data?.length;
};
```

---

## 🚀 Emergency Commands

```bash
# If relationships break
node scripts/emergency-bulletproof-sync.js

# Verify database integrity
node scripts/verify-database-integrity.js

# Check foreign key relationships
node scripts/test-foreign-keys.js
```

---

**⚡ Remember:** AgentDB = Master, SiteDB = UI, Core Tables = 1:1 Sync** 