# 🛡️ OvenAI Admin Console - Comprehensive Documentation

**Version**: 2.0 (Real Business Management System)  
**Updated**: January 2025  
**Status**: Production Ready  

---

## 📋 Table of Contents

1. [What is CRUD?](#what-is-crud)
2. [Admin Console Overview](#admin-console-overview)
3. [CRUD Operations Available](#crud-operations-available)
4. [Edge Functions & API Calls](#edge-functions--api-calls)
5. [Admin Console Tabs & Features](#admin-console-tabs--features)
6. [Security & Permissions](#security--permissions)
7. [Database Operations](#database-operations)
8. [System Administration Tools](#system-administration-tools)
9. [Testing & Quality Assurance](#testing--quality-assurance)
10. [Troubleshooting & Support](#troubleshooting--support)

---

## 🔍 What is CRUD?

**CRUD** stands for the four basic operations you can perform on data:

- **C**reate - Add new records/entities
- **R**ead - View/retrieve existing records
- **U**pdate - Modify existing records
- **D**elete - Remove records

### CRUD in Business Context
In a business management system like OvenAI's admin console, CRUD operations allow administrators to:
- **Create** new companies, users, projects, leads
- **Read** reports, user lists, company data, analytics
- **Update** user permissions, company details, system settings
- **Delete** inactive users, obsolete companies, spam leads

---

## 🏢 Admin Console Overview

### What Changed: From Fake to Real

**❌ Old System (Removed)**:
- Fake CPU/Memory monitoring (`Math.random()` generators)
- Simulated database operations (`setTimeout()` delays)
- Mock system health checks (random numbers)
- Pretend admin commands (UI-only mockups)

**✅ New System (Current)**:
- Real business management console
- Actual CRUD operations on live data
- Genuine edge function integrations
- Professional company/user administration

### Business Value
- **Multi-tenant management**: Handle multiple client companies
- **User provisioning**: Create and manage users across all clients
- **Usage analytics**: Real revenue tracking and growth metrics
- **System administration**: Database access, workflow management

---

## 🔧 CRUD Operations Available

### 1. Company Management CRUD

#### **CREATE** Company
```typescript
// Location: CompanyManagementDialogs.tsx
interface CreateCompanyData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'trial';
}

// Implementation
const createCompany = async (companyData: Partial<Company>) => {
  const { data, error } = await supabase
    .from('profiles') // Companies stored in profiles table
    .insert([{
      email: companyData.email,
      name: companyData.name,
      role: 'CLIENT',
      status: companyData.status || 'active'
    }]);
};
```

#### **READ** Companies
```typescript
// Get all companies with statistics
const loadCompanies = async () => {
  const { data: companies, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'CLIENT')
    .order('created_at', { ascending: false });
    
  // Additional stats queries for user_count, message_count, leads_count
};
```

#### **UPDATE** Company
```typescript
// Update company details
const updateCompany = async (companyId: string, updates: Partial<Company>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', companyId);
};
```

#### **DELETE** Company
```typescript
// Soft delete (set status to inactive)
const deleteCompany = async (companyId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', companyId);
};
```

### 2. User Management CRUD

#### **CREATE** User (via Edge Function)
```typescript
// Location: UserManagementDialogs.tsx
// Calls: supabase/functions/user-management/index.ts

const createUser = async (userData: Partial<User>) => {
  const { data, error } = await supabase.functions.invoke('user-management', {
    body: {
      email: userData.email,
      name: userData.name,
      role: userData.role, // 'STAFF' | 'ADMIN' | 'SUPER_ADMIN'
      client_id: userData.company_id,
      send_invitation: true,
      create_demo_project: false,
      temporary_password: generateSecurePassword()
    }
  });
};
```

#### **READ** Users
```typescript
// Get all users with company information
const loadUsers = async () => {
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      *,
      companies:profiles!inner(name)
    `)
    .order('created_at', { ascending: false });
};
```

#### **UPDATE** User
```typescript
// Update user role, status, permissions
const updateUser = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: updates.role,
      status: updates.status,
      name: updates.name
    })
    .eq('id', userId);
};
```

#### **DELETE** User (via Edge Function)
```typescript
// Calls: supabase/functions/delete-user-account/index.ts
const deleteUser = async (userId: string) => {
  const { data, error } = await supabase.functions.invoke('delete-user-account', {
    body: { user_id: userId }
  });
};
```

### 3. Usage Analytics (READ-ONLY)

```typescript
// Location: RealAdminConsole.tsx
interface UsageStats {
  total_companies: number;
  total_users: number;
  total_messages_today: number;
  total_messages_month: number;
  total_leads_month: number;
  active_conversations: number;
  revenue_month: number;
}

const loadUsageStats = async (): Promise<UsageStats> => {
  const [companiesCount, usersCount, /* other queries */] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CLIENT'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'CLIENT'),
    // Additional analytics queries...
  ]);
  
  return {
    total_companies: companiesCount.count || 0,
    total_users: usersCount.count || 0,
    // ... real business metrics
  };
};
```

---

## ⚡ Edge Functions & API Calls

### Available Edge Functions

#### 1. **user-management** 
- **Location**: `supabase/functions/user-management/index.ts`
- **Purpose**: Complete user creation with invitation system
- **CRUD**: Create, Update user accounts
- **Features**:
  - Secure password generation
  - Email invitation sending
  - Demo project creation
  - Client assignment

```typescript
// Usage from Admin Console
const response = await supabase.functions.invoke('user-management', {
  body: {
    email: 'user@company.com',
    name: 'John Doe',
    role: 'STAFF',
    client_name: 'Acme Corp',
    send_invitation: true,
    create_demo_project: true
  }
});
```

#### 2. **create-admin-user**
- **Location**: `supabase/functions/create-admin-user/index.ts`
- **Purpose**: Create first system administrator
- **CRUD**: Create admin accounts
- **Security**: Requires service role key

```typescript
// System-level admin creation
const response = await supabase.functions.invoke('create-admin-user', {
  headers: {
    Authorization: `Bearer ${serviceRoleKey}`
  }
});
```

#### 3. **delete-user-account**
- **Location**: `supabase/functions/delete-user-account/index.ts`
- **Purpose**: Safely remove user accounts
- **CRUD**: Delete user accounts
- **Features**: Cascading deletions, data cleanup

#### 4. **apply-database-fixes**
- **Location**: `supabase/functions/apply-database-fixes/index.ts`
- **Purpose**: Database maintenance and schema updates
- **CRUD**: Database schema operations
- **Features**: Table creation, missing columns, RLS policies

```typescript
// Database maintenance operations
const fixes = [
  'create_missing_tables',
  'add_missing_columns', 
  'update_rls_policies',
  'create_indexes'
];
```

#### 5. **database-sync-trigger**
- **Location**: `supabase/functions/database-sync-trigger/index.ts`
- **Purpose**: Sync data between agent and site databases
- **CRUD**: Cross-database synchronization

#### 6. **password-reset**
- **Location**: `supabase/functions/password-reset/index.ts`
- **Purpose**: Handle password reset requests
- **CRUD**: Update user passwords

---

## 🗂️ Admin Console Tabs & Features

### Tab 1: 🏢 Company Management

**Purpose**: Manage client companies and their subscriptions

**Available Actions**:
- ✅ **Create Company**: New client onboarding
- ✅ **View Companies**: List all clients with statistics
- ✅ **Edit Company**: Update company details, subscription plans
- ✅ **Company Stats**: User count, message count, leads generated
- ✅ **Search & Filter**: Find specific companies quickly

**CRUD Operations**:
- **CREATE**: Add new client companies
- **READ**: View company list, details, statistics
- **UPDATE**: Modify company information, subscription status
- **DELETE**: Soft delete (deactivate) companies

### Tab 2: 👥 User Management

**Purpose**: Create and manage users across all client companies

**Available Actions**:
- ✅ **Create User**: Via edge function with email invitation
- ✅ **User List**: All users across all companies
- ✅ **Edit Users**: Change roles, permissions, company assignment
- ✅ **User Permissions**: Role-based access control
- ✅ **Cross-Company**: Assign users to different companies

**CRUD Operations**:
- **CREATE**: New user accounts via `user-management` edge function
- **READ**: User lists, permissions, company assignments
- **UPDATE**: User details, roles, status, permissions
- **DELETE**: Remove user accounts via `delete-user-account` edge function

### Tab 3: 📊 Usage Analytics

**Purpose**: Business intelligence and revenue tracking

**Available Data**:
- ✅ **Company Statistics**: Total companies, active/inactive
- ✅ **User Metrics**: Total users, admin users, active users
- ✅ **Message Analytics**: Daily/monthly message counts
- ✅ **Lead Generation**: Monthly lead counts, conversion rates
- ✅ **Revenue Tracking**: Monthly revenue, growth metrics
- ✅ **Active Sessions**: Real-time conversation monitoring

**CRUD Operations**:
- **READ**: All analytics are read-only dashboards

### Tab 4: ⚙️ System Admin

**Purpose**: Advanced system administration and maintenance

**Available Tools**:
- ✅ **Database Console**: Execute SQL queries (SELECT only)
- ✅ **N8N Workflow Management**: Trigger automation workflows
- ✅ **Environment Config**: View system configuration (masked keys)
- ✅ **System Monitoring**: Health checks, performance metrics

**CRUD Operations**:
- **READ**: Database queries, system configuration
- **EXECUTE**: System scripts, workflow triggers
- **MONITOR**: System health, performance metrics

---

## 🔒 Security & Permissions

### Role-Based Access Control

#### **System Admin** (Full Access)
- ✅ All company management operations
- ✅ Cross-company user management
- ✅ System administration tools
- ✅ Database console access
- ✅ Revenue and analytics access

#### **Company Admin** (Limited Access)
- ✅ Own company user management
- ✅ Own company analytics
- ❌ Cannot access other companies
- ❌ No system administration access
- ❌ No database console access

#### **Regular User** (No Admin Access)
- ❌ Cannot access admin console at all
- ❌ Redirected to login/access denied

### Security Measures

1. **Database Console Security**:
   - Only SELECT queries allowed
   - No INSERT, UPDATE, DELETE operations
   - Query results are limited and monitored

2. **Environment Variables**:
   - Sensitive keys are masked (`*****`)
   - Only non-sensitive config is visible

3. **Edge Function Security**:
   - Service role key required for admin operations
   - User creation requires proper authentication
   - All operations are logged and audited

---

## 🗄️ Database Operations

### Available Database Actions

#### 1. **Query Console**
```sql
-- Example safe queries allowed:
SELECT count(*) FROM profiles WHERE role = 'CLIENT';
SELECT * FROM leads WHERE created_at > NOW() - INTERVAL '30 days';
SELECT company_id, count(*) as user_count FROM profiles GROUP BY company_id;
```

#### 2. **Database Maintenance** (via `apply-database-fixes`)
- Create missing tables
- Add missing columns
- Update RLS policies
- Create database indexes
- Fix schema inconsistencies

#### 3. **Data Sync Operations**
- Sync between agent DB and site DB
- Maintain data consistency
- Handle replication conflicts

### Database Schema Overview

#### **Profiles Table** (Main user/company table)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT CHECK (role IN ('CLIENT', 'STAFF', 'ADMIN', 'SUPER_ADMIN')),
  status TEXT CHECK (status IN ('active', 'inactive', 'trial')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Additional company-specific fields
);
```

#### **Related Tables**
- `leads` - Lead generation data
- `conversations` - Message tracking
- `projects` - Client projects
- `lead_temperature_history` - Lead scoring
- `whatsapp_messages` - Communication logs

---

## 🛠️ System Administration Tools

### 1. Database Console
- **Purpose**: Direct database access for debugging
- **Security**: SELECT-only queries
- **Features**: Query execution, result display, error handling

### 2. N8N Workflow Management
- **Purpose**: Trigger automation workflows
- **Workflows Available**:
  - Lead processing automation
  - Email notification triggers
  - Data synchronization workflows
  - Report generation automation

### 3. Environment Configuration
- **Purpose**: System configuration monitoring
- **Features**:
  - Environment variable display (masked)
  - Database connection status
  - API key validation
  - Service health checks

### 4. System Monitoring
- **Metrics Tracked**:
  - Database connection health
  - API response times
  - User activity levels
  - System resource usage
  - Error rates and alerts

---

## 🧪 Testing & Quality Assurance

### Admin Console Test Coverage

#### **Updated Test Structure**
```
tests/suites/e2e/admin/
├── admin-console-updated.spec.ts       # Matches actual tab names
├── admin-company-management.spec.ts    # Company CRUD operations
├── admin-user-management.spec.ts       # User CRUD operations
├── admin-analytics.spec.ts             # Usage analytics testing
├── admin-system-tools.spec.ts          # System admin tools testing
└── admin-security.spec.ts              # Permission boundary testing
```

#### **Test Categories**
1. **Negative Tests**: Unauthorized access prevention
2. **CRUD Operations**: All create/read/update/delete operations
3. **Edge Function Integration**: API call testing
4. **Security Boundaries**: Role-based access control
5. **UI Functionality**: Tab navigation, dialog operations

### Running Admin Tests

```bash
# Run all admin tests with correct tab names
npm run test:e2e:admin

# Run specific admin functionality
npx playwright test tests/suites/e2e/admin/admin-console-updated.spec.ts

# Run with visual debugging
npx playwright test tests/suites/e2e/admin/ --headed
```

---

## 🚨 Troubleshooting & Support

### Common Issues

#### 1. **Admin Access Denied**
- **Cause**: User role is not 'admin' in profiles table
- **Fix**: Update user role: `UPDATE profiles SET role = 'admin' WHERE email = 'user@domain.com'`

#### 2. **Edge Function Errors**
- **Cause**: Missing environment variables or permissions
- **Fix**: Check Supabase function logs, verify service role key

#### 3. **Database Console Errors**
- **Cause**: Non-SELECT queries attempted
- **Fix**: Only use SELECT statements for security

#### 4. **Missing Company Data**
- **Cause**: Companies stored in profiles table with role 'CLIENT'
- **Fix**: Ensure proper role assignment during company creation

### Debug Commands

```bash
# Check admin user status
npx playwright test tests/e2e/admin/admin-security.spec.ts --grep "Admin Access"

# Test edge function connectivity
npx playwright test tests/e2e/admin/admin-user-management.spec.ts --grep "User Creation"

# Validate database operations
npx playwright test tests/e2e/admin/admin-system-tools.spec.ts --grep "Database Console"
```

---

## 📞 Support & Maintenance

### Contact Information
- **Technical Issues**: Review admin console logs and error messages
- **Feature Requests**: Document in admin console feedback system
- **Security Concerns**: Review access logs and permission audits

### Regular Maintenance
- **Weekly**: Review user creation logs, company statistics
- **Monthly**: Database maintenance, usage analytics review
- **Quarterly**: Security audit, permission review, system optimization

---

## 🎯 Summary

The OvenAI Admin Console provides comprehensive business management capabilities with:

✅ **Real CRUD Operations**: Create, Read, Update, Delete companies and users  
✅ **Edge Function Integration**: Secure API calls for user management and system operations  
✅ **Multi-tenant Architecture**: Handle multiple client companies efficiently  
✅ **Role-based Security**: System admin vs company admin vs regular user permissions  
✅ **Business Intelligence**: Real usage analytics and revenue tracking  
✅ **System Administration**: Database access, workflow management, monitoring tools  

**From Fake to Real**: We've completely replaced simulated admin features with genuine business management tools that provide actual value for operating a multi-client SaaS platform.

---

*This documentation covers the complete admin console functionality as implemented in the refactored RealAdminConsole.tsx and related components.* 