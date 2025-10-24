# RLS Management and Future-Proofing Guide

## Overview

This guide documents the comprehensive Row Level Security (RLS) management system implemented to prevent infinite recursion issues and ensure database security standards.

## 🚨 Critical RLS Standards

### 1. **No Recursive Policies**
- **Never** create policies that reference the same table they're applied to
- **Never** use `EXISTS` clauses that could create circular references
- **Always** use simple `IN` clauses for membership checks

### 2. **Standard Policy Templates**

#### Client Members Table
```sql
-- ✅ CORRECT: Direct user access
CREATE POLICY "client_members_user_access"
ON public.client_members
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

#### Related Tables (Projects, Leads, Clients)
```sql
-- ✅ CORRECT: Simple IN clause
CREATE POLICY "projects_user_access"
ON public.projects
FOR ALL TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.client_members 
    WHERE user_id = auth.uid()
  )
);
```

#### ❌ AVOID: Recursive References
```sql
-- ❌ WRONG: This creates infinite recursion
CREATE POLICY "bad_policy"
ON public.projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.client_members cm
    WHERE cm.client_id = projects.client_id
    AND cm.user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = projects.id)
  )
);
```

## 🔧 Monitoring Functions

### 1. Health Check Function
```sql
SELECT * FROM public.check_rls_policy_health();
```

**Output:**
- `table_name`: Table being checked
- `policy_name`: Policy name
- `potential_recursion`: Boolean flag for recursion risk
- `recommendation`: Suggested fix

### 2. Automated Health Check
```sql
SELECT * FROM public.automated_rls_health_check();
```

**Output:**
- `check_timestamp`: When check was run
- `issues_found`: Number of problematic policies
- `status`: HEALTHY/WARNING/CRITICAL

### 3. Create Standard Policies
```sql
SELECT public.create_standard_rls_policies('table_name');
```

**Supported Tables:**
- `client_members`
- `projects`
- `leads`
- `clients`

## 🛡️ Security Maintenance

### Daily Checks
```sql
-- Run this daily to monitor RLS health
SELECT * FROM public.automated_rls_health_check();
```

### Weekly Audits
```sql
-- Review all policies for potential issues
SELECT * FROM public.check_rls_policy_health()
WHERE potential_recursion = true;
```

### Monthly Reviews
```sql
-- Check audit trail for policy changes
SELECT * FROM public.rls_policy_audit
WHERE event_time >= NOW() - INTERVAL '30 days'
ORDER BY event_time DESC;
```

## 🔄 Standard Operating Procedures

### Adding New Tables
1. **Create table** with proper structure
2. **Run standard policy creation**:
   ```sql
   SELECT public.create_standard_rls_policies('new_table_name');
   ```
3. **Verify with health check**:
   ```sql
   SELECT * FROM public.check_rls_policy_health()
   WHERE table_name = 'new_table_name';
   ```

### Modifying Existing Policies
1. **Check current health** before changes
2. **Make changes** using standard templates
3. **Run health check** after changes
4. **Document changes** in audit trail

### Emergency Response
If infinite recursion is detected:

1. **Immediate Action**:
   ```sql
   -- Drop problematic policies
   DROP POLICY "problematic_policy" ON public.table_name;
   ```

2. **Apply Standard Fix**:
   ```sql
   SELECT public.create_standard_rls_policies('table_name');
   ```

3. **Verify Fix**:
   ```sql
   SELECT * FROM public.automated_rls_health_check();
   ```

## 📊 System Prompts Management

### Current Implementation
- **Client descriptions** serve as system prompts
- **Sorted alphabetically** by client name
- **Searchable** by client name or description content
- **Editable** through admin console

### Display Features
- **Copy functionality** for easy prompt extraction
- **Edit dialog** for prompt modification
- **Metadata display** (industry, size, user count, etc.)
- **Status indicators** (active/inactive)

### Best Practices
1. **Keep descriptions focused** on system behavior
2. **Use clear, structured language** for AI prompts
3. **Include context** about client industry and needs
4. **Regular review** and updates of prompts

## 🔍 Troubleshooting

### Common Issues

#### "Infinite recursion detected"
**Cause**: Circular policy references
**Solution**: Apply standard policy templates

#### "No data returned"
**Cause**: Overly restrictive policies
**Solution**: Check user memberships and policy logic

#### "Permission denied"
**Cause**: Missing or incorrect policies
**Solution**: Verify policy existence and logic

### Diagnostic Queries

```sql
-- Check user memberships
SELECT * FROM public.client_members 
WHERE user_id = auth.uid();

-- Check policy definitions
SELECT * FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'your_table';

-- Test policy logic
SELECT * FROM public.your_table 
WHERE id = 'test_id';
```

## 📝 Change Log

### Version 1.0 (Current)
- Implemented comprehensive RLS fix
- Added monitoring functions
- Created standard policy templates
- Added audit trail system
- Implemented system prompts display

### Future Enhancements
- Automated policy validation triggers
- Real-time monitoring dashboard
- Policy performance optimization
- Advanced security analytics

## 🎯 Success Metrics

- **Zero** infinite recursion incidents
- **100%** policy compliance with standards
- **< 1 second** query response times
- **Daily** automated health checks passing

## 📞 Support

For RLS-related issues:
1. Check this documentation
2. Run diagnostic queries
3. Review audit trail
4. Apply standard fixes
5. Contact system administrator if needed

---

**Last Updated**: January 2025
**Version**: 1.0
**Author**: System Administrator 