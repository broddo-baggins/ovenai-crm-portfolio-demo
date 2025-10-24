# 🔧 CRUD Operations Quick Reference

**For**: OvenAI Admin Console  
**Updated**: January 2025  

---

## 📖 Quick CRUD Definition

| Letter | Operation | Description | Example |
|--------|-----------|-------------|---------|
| **C** | **Create** | Add new records | Create new user account |
| **R** | **Read** | View existing data | Display user list |
| **U** | **Update** | Modify existing records | Change user role |
| **D** | **Delete** | Remove records | Deactivate user account |

---

## 🏢 Company Management CRUD

### **Create Company**
```typescript
const newCompany = await supabase
  .from('profiles')
  .insert([{
    email: 'company@domain.com',
    name: 'Acme Corp',
    role: 'CLIENT',
    status: 'active'
  }]);
```

### **Read Companies**
```typescript
const companies = await supabase
  .from('profiles')
  .select('*')
  .eq('role', 'CLIENT');
```

### **Update Company**
```typescript
const updated = await supabase
  .from('profiles')
  .update({ name: 'New Company Name' })
  .eq('id', companyId);
```

### **Delete Company (Soft)**
```typescript
const deleted = await supabase
  .from('profiles')
  .update({ status: 'inactive' })
  .eq('id', companyId);
```

---

## 👥 User Management CRUD

### **Create User (Edge Function)**
```typescript
const newUser = await supabase.functions.invoke('user-management', {
  body: {
    email: 'user@company.com',
    name: 'John Doe',
    role: 'STAFF',
    client_id: companyId,
    send_invitation: true
  }
});
```

### **Read Users**
```typescript
const users = await supabase
  .from('profiles')
  .select('*, companies:profiles!inner(name)')
  .neq('role', 'CLIENT');
```

### **Update User**
```typescript
const updated = await supabase
  .from('profiles')
  .update({
    role: 'ADMIN',
    status: 'active'
  })
  .eq('id', userId);
```

### **Delete User (Edge Function)**
```typescript
const deleted = await supabase.functions.invoke('delete-user-account', {
  body: { user_id: userId }
});
```

---

## 📊 Analytics CRUD (Read-Only)

### **Read Usage Statistics**
```typescript
const stats = await Promise.all([
  supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
  supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'CLIENT'),
  supabase.from('conversations').select('*', { count: 'exact', head: true }),
  supabase.from('leads').select('*', { count: 'exact', head: true })
]);
```

---

## ⚙️ System Admin CRUD

### **Database Queries (Read-Only)**
```typescript
// Only SELECT queries allowed for security
const result = await supabase.rpc('execute_sql', {
  query: 'SELECT count(*) FROM profiles WHERE role = \'CLIENT\''
});
```

### **Execute System Maintenance**
```typescript
const fixes = await supabase.functions.invoke('apply-database-fixes', {
  body: {
    fixes: ['create_missing_tables', 'update_rls_policies']
  }
});
```

---

## 🔒 Permission-Based CRUD Matrix

| Operation | System Admin | Company Admin | Regular User |
|-----------|-------------|---------------|--------------|
| **Create Company** | ✅ | ❌ | ❌ |
| **Read Companies** | ✅ All | ✅ Own only | ❌ |
| **Update Company** | ✅ All | ✅ Own only | ❌ |
| **Delete Company** | ✅ All | ❌ | ❌ |
| **Create User** | ✅ Any company | ✅ Own company | ❌ |
| **Read Users** | ✅ All | ✅ Own company | ❌ |
| **Update User** | ✅ All | ✅ Own company | ❌ |
| **Delete User** | ✅ All | ✅ Own company | ❌ |
| **Read Analytics** | ✅ All data | ✅ Own company | ❌ |
| **System Admin** | ✅ Full access | ❌ | ❌ |

---

## ⚡ Edge Functions for CRUD

| Function | CRUD Operation | Purpose |
|----------|---------------|---------|
| `user-management` | CREATE/UPDATE | Complete user provisioning |
| `delete-user-account` | DELETE | Safe user removal |
| `create-admin-user` | CREATE | System admin creation |
| `apply-database-fixes` | UPDATE | Database maintenance |
| `database-sync-trigger` | CREATE/UPDATE | Cross-database sync |
| `password-reset` | UPDATE | Password management |

---

## 🚀 Quick Test Commands

```bash
# Test CRUD operations
npx playwright test tests/suites/e2e/admin/admin-company-management.spec.ts
npx playwright test tests/suites/e2e/admin/admin-user-management.spec.ts

# Test edge functions
npx playwright test tests/suites/e2e/admin/admin-console-updated.spec.ts --grep "Edge Function"

# Test security/permissions
npx playwright test tests/suites/e2e/admin/admin-security.spec.ts
```

---

## 🎯 Common CRUD Patterns

### **Create with Validation**
```typescript
const createWithValidation = async (data) => {
  // Validate required fields
  if (!data.email || !data.name) {
    throw new Error('Email and name are required');
  }
  
  // Check for duplicates
  const existing = await supabase
    .from('profiles')
    .select('id')
    .eq('email', data.email)
    .single();
    
  if (existing.data) {
    throw new Error('Email already exists');
  }
  
  // Create record
  return await supabase.from('profiles').insert([data]);
};
```

### **Read with Pagination**
```typescript
const readWithPagination = async (page = 0, limit = 10) => {
  return await supabase
    .from('profiles')
    .select('*')
    .range(page * limit, (page + 1) * limit - 1)
    .order('created_at', { ascending: false });
};
```

### **Update with Audit Trail**
```typescript
const updateWithAudit = async (id, updates, adminUserId) => {
  // Update record
  const result = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
      updated_by: adminUserId
    })
    .eq('id', id);
    
  // Log audit trail
  await supabase.from('audit_log').insert([{
    table_name: 'profiles',
    record_id: id,
    action: 'UPDATE',
    changes: updates,
    admin_user_id: adminUserId
  }]);
  
  return result;
};
```

### **Soft Delete with Dependencies**
```typescript
const softDeleteWithDependencies = async (id) => {
  // Soft delete main record
  const result = await supabase
    .from('profiles')
    .update({ 
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })
    .eq('id', id);
    
  // Handle dependent records
  await supabase
    .from('user_sessions')
    .update({ status: 'invalidated' })
    .eq('user_id', id);
    
  return result;
};
```

---

*This reference covers the complete CRUD operations available in the OvenAI Admin Console with real code examples and security considerations.* 