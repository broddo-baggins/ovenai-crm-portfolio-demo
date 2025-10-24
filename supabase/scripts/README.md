# 🔧 Supabase Scripts

## 📋 **Directory Purpose**
Utility scripts organized by purpose for database management, testing, and maintenance.

## 📁 **Directory Structure**

### `master-database/`
**Purpose**: Scripts for safely interacting with the master production database
- `analyze-master-database.js` - Read-only analysis of master database structure
- **⚠️ CRITICAL**: All scripts in this directory are READ-ONLY
- **Safety First**: Never modify master database

### `testing/`
**Purpose**: Scripts for testing database connections and functionality
- `verify-supabase-connection.js` - Basic database connection verification
- `test-project-lead-integration.js` - Test business logic and relationships  
- `test-supabase-system-match.js` - Comprehensive system compatibility testing
- `test-complete-system.js` - End-to-end system testing

### `setup/`
**Purpose**: Scripts for database setup, initialization, and data creation
- `02-create-sarah-data.js` - Create sample client data for testing
- `create-test-data-simple.js` - Create basic test data
- `check-db-schema.js` - Analyze database schema structure
- `*.sql` files - Database setup and fix scripts

### `maintenance/`
**Purpose**: Scripts for database maintenance and troubleshooting
- `01-find-workflow-functions.js` - Clean up workflow-related functions
- `03-test-system-connection.js` - System connection diagnostics
- `04-test-write-access.js` - Test write permissions and capabilities

## 🚀 **Usage Examples**

### **Quick Database Check**
```bash
# Verify local database connection
node scripts/testing/verify-supabase-connection.js

# Analyze master database (READ-ONLY)
node scripts/master-database/analyze-master-database.js
```

### **Setup Test Data**
```bash
# Create sample client data
node scripts/setup/02-create-sarah-data.js

# Check database schema
node scripts/setup/check-db-schema.js
```

### **System Testing**
```bash
# Run comprehensive testing
node scripts/testing/test-supabase-system-match.js

# Test project-lead integration
node scripts/testing/test-project-lead-integration.js
```

## 🛡️ **Safety Guidelines**

### **Master Database Scripts**
- ✅ **READ-ONLY ACCESS ONLY** to master database
- ❌ **NEVER INSERT, UPDATE, or DELETE** from master
- ✅ **Always use LIMIT clauses** for safety
- ✅ **Review guard rails** in `../security/guard-rails/`

### **Local Database Scripts**
- ✅ Safe to use for development and testing
- ✅ Can modify local database as needed
- ✅ Always backup before major changes

### **Before Running Scripts**
1. **Read the script** to understand what it does
2. **Check credentials** - ensure you're connecting to the right database
3. **Verify safety** - especially for master database operations
4. **Have backups** for any destructive operations

## 📞 **Related Documentation**
- Security guidelines: `../security/guard-rails/MASTER_DB_PROTECTION.md`
- Replication strategy: `../security/replication/`
- Setup guides: `../docs/guides/`

## 🔄 **Script Maintenance**

### **Adding New Scripts**
- Place in appropriate subdirectory based on purpose
- Include clear documentation and purpose
- Follow existing naming conventions
- Add safety checks for database operations

### **Updating Scripts**
- Test thoroughly before committing changes
- Update this README if directory structure changes
- Maintain backward compatibility when possible 