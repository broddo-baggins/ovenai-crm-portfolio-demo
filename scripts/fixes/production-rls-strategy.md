# Production RLS Strategy

## 1. DEFENSE IN DEPTH

```sql
-- Layer 1: Basic auth check
CREATE POLICY "basic_auth" ON table_name
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Layer 2: Fallback for edge cases  
CREATE POLICY "auth_fallback" ON table_name
FOR SELECT TO authenticated  
USING (
  auth.uid() IS NOT NULL 
  AND user_id = COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000')
);

-- Layer 3: Service role bypass
CREATE POLICY "service_bypass" ON table_name
FOR ALL TO service_role
USING (true);
```

## 2. MONITORING & DEBUGGING

```sql
-- Create debug function
CREATE OR REPLACE FUNCTION debug_auth_context()
RETURNS TABLE(
  current_user_id UUID,
  auth_uid UUID,
  role_name TEXT,
  is_authenticated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY SELECT 
    auth.uid(),
    auth.uid(),
    current_setting('request.jwt.claims', true)::json->>'role',
    auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 3. EMERGENCY PROCEDURES

### Quick Disable (Development Only)
```sql
ALTER TABLE critical_table DISABLE ROW LEVEL SECURITY;
```

### Safe Re-enable
```sql
-- Test policies first
SELECT * FROM critical_table LIMIT 1;
-- If working:
ALTER TABLE critical_table ENABLE ROW LEVEL SECURITY;
```

## 4. PREVENTION

### A. Version Control RLS
- Always backup policies before changes
- Use migration scripts, not manual changes
- Test in staging first

### B. Auth Context Testing  
```javascript
// Frontend debugging
console.log('Auth context:', {
  user: supabase.auth.getUser(),
  session: supabase.auth.getSession()
});
```

### C. Staged Rollout
1. Test with service role ✅
2. Test with authenticated user ✅  
3. Deploy to staging ✅
4. Deploy to production ✅

## 5. TROUBLESHOOTING CHECKLIST

When RLS breaks:

1. **Check auth context**: `SELECT auth.uid();`
2. **Check policies**: `SELECT * FROM pg_policies;`  
3. **Test service role**: Can admin access data?
4. **Check browser**: JWT expired? Clear cookies?
5. **Emergency disable**: Temporary fix
6. **Root cause**: Fix auth or policies
7. **Re-enable**: With proper testing

## 6. PRODUCTION RECOMMENDATIONS

- ✅ Always have service role bypass
- ✅ Use specific policy names  
- ✅ Test auth edge cases
- ✅ Monitor policy performance
- ✅ Have rollback procedures
- ❌ Never disable RLS in production without plan
- ❌ Don't create overly complex policies
- ❌ Don't rely on single policy for critical tables 