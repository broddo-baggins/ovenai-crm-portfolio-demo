# System Administration Console Guide

## Overview

The System Administration Console is the central hub for managing your OvenAI platform infrastructure. It provides real-time monitoring, user management, database operations, and administrative tools - all accessible through a secure web interface.

## 🔐 Access Control & Security

### Who Can Access the Admin Console?

**Only System Administrators** can access the admin console. Access is controlled by:

1. **Database Role Check**: User must have `role = 'admin'` in the profiles table
2. **Metadata Verification**: User metadata must contain admin flags
3. **Authentication Requirement**: Must be logged in with valid Supabase session

### Creating Admin Users

To create new admin users:

1. **Navigate to Users Tab** in the admin console
2. **Click "Create Admin User"** (red button - indicates high privilege)
3. **Fill Required Information**:
   - Full Name
   - Email Address
   - Admin Level (Full Administrator or Limited Administrator)
4. **Security Confirmation**: Check "I understand this grants full administrative access"
5. **Optional**: Toggle "Send Login Credentials" to email login details

⚠️ **Security Warning**: Admin users have full system access including user management, database operations, and configuration changes.

## 📊 System Health Monitoring

### Real-Time Metrics Dashboard

The **System Health** tab provides:

- **CPU Usage**: Current processor utilization
- **Memory Usage**: RAM consumption and availability  
- **Disk Usage**: Storage space utilization
- **Network Activity**: Data transfer metrics
- **Database Performance**: Connection count, query response times
- **System Status**: Overall health indicators

### Status Indicators

- 🟢 **Green**: Healthy (< 70% utilization)
- 🟡 **Yellow**: Warning (70-80% utilization)  
- 🔴 **Red**: Critical (> 80% utilization)

### Auto-Refresh

- Toggle **Auto-Refresh** to update metrics every 30 seconds
- Manual refresh available via **Refresh** button
- Last update timestamp displayed

## 👥 User Management

### User Types

#### 1. Client Users
**Purpose**: For your paying clients who need access to their project data
- Automatically creates organization structure
- Limited to their project data
- Can view leads, conversations, analytics for their projects

#### 2. Partner Users  
**Purpose**: For business partners, agencies, or contractors
- Limited access permissions
- Cannot see client data unless specifically granted
- Ideal for external collaborators

#### 3. Test Users
**Purpose**: For testing, demonstrations, or temporary access
- Auto-generated email addresses
- Expiration dates can be set
- Easy bulk cleanup functionality

#### 4. Admin Users
**Purpose**: For system administrators and technical staff
- Full access to System Administration Console
- Can manage all users and system operations
- Should be limited to trusted personnel only

### User Operations

#### Creating Users
Each user type has a dedicated creation dialog with:
- **Validation**: Required fields, email format checking
- **Confirmation**: Destructive operations require confirmation
- **Feedback**: Detailed success/error messages with copy-to-clipboard output

#### Bulk Operations
- **Bulk User Creation**: Create multiple users at once
- **Cleanup Test Users**: Remove expired test accounts
- **Reset Passwords**: Mass password reset capability
- **Deactivate Inactive**: Bulk deactivation of unused accounts

#### User Analytics
- **Total Users**: Current user count
- **Online Users**: Currently active sessions
- **Recent Activity**: User login/activity patterns

## 🗄️ Database Administration

### Database Operations

#### 1. Manual Backup
- **Purpose**: Create immediate database backups
- **Process**: Triggers backup script with progress monitoring
- **Output**: Detailed backup log with file locations

#### 2. Database Optimization
- **Purpose**: Improve database performance
- **Actions**: Index optimization, query plan updates, statistics refresh
- **Timing**: Can be scheduled during low-traffic periods

#### 3. Integrity Check
- **Purpose**: Verify data consistency and detect corruption
- **Scope**: Full database scan for orphaned records, constraint violations
- **Report**: Comprehensive integrity report with recommendations

#### 4. Performance Analysis
- **Purpose**: Identify slow queries and performance bottlenecks
- **Metrics**: Query execution times, index usage, table sizes
- **Recommendations**: Optimization suggestions

### Data Management

#### Data Cleanup
- **Orphaned Data**: Remove records without valid parent relationships
- **Temporary Data**: Clear cache tables and session data
- **Log Cleanup**: Archive or remove old application logs

#### Data Archiving
- **Old Data**: Move inactive records to archive tables
- **Retention Policies**: Automated archiving based on age/activity
- **Storage Optimization**: Reduce primary database size

## 🖥️ Script Execution

### Administrative Scripts

The **Scripts** tab provides UI-based execution of administrative scripts:

#### System Scripts
- **Health Check Script**: Comprehensive system diagnostics
- **Restart Services**: Graceful service restart with monitoring
- **Database Maintenance**: Automated maintenance routines
- **Update Configuration**: Apply configuration changes safely

#### User Scripts  
- **Mass User Operations**: Bulk user management tasks
- **Data Migration**: Import/export user data
- **Permission Updates**: Batch permission modifications

### Script Safety Features

- **Dry Run Mode**: Preview changes before execution
- **Detailed Logging**: Complete execution logs with timestamps
- **Copy Output**: Easily copy results for documentation
- **Error Handling**: Graceful failure handling with rollback options

## 📈 Monitoring & Alerts

### Real-Time Monitoring

- **Performance Trends**: Historical performance data and trends
- **Live Metrics**: Real-time system resource monitoring
- **Usage Reports**: Application usage patterns and statistics

### Alert Management

#### Alert Configuration
- **Threshold Settings**: CPU, memory, disk space warnings
- **Notification Channels**: Email, Slack, webhook integrations
- **Escalation Rules**: Automated escalation for critical issues

#### Alert History
- **Past Alerts**: Historical alert log with resolution status
- **Pattern Analysis**: Identify recurring issues
- **Performance Impact**: Alert correlation with system performance

## 🛡️ Security Best Practices

### Admin Access Management

1. **Principle of Least Privilege**: Only grant admin access when necessary
2. **Regular Access Review**: Periodically review who has admin access
3. **Strong Authentication**: Require strong passwords and consider 2FA
4. **Session Management**: Monitor active admin sessions

### Operational Security

1. **Confirmation Required**: All destructive operations require explicit confirmation
2. **Audit Logging**: All admin actions are logged with user attribution
3. **Safe Defaults**: Operations default to safe modes (dry-run, preview)
4. **Emergency Procedures**: Document emergency access and recovery procedures

### Data Protection

1. **Sensitive Data Masking**: User passwords and secrets are never displayed
2. **Secure Communications**: All admin operations use encrypted connections
3. **Access Logging**: Detailed logs of all data access and modifications
4. **Backup Security**: Backups are encrypted and securely stored

## 🚨 Troubleshooting

### Common Issues

#### Admin Console Won't Load
1. **Check User Role**: Verify user has `role = 'admin'` in database
2. **Clear Browser Cache**: Hard refresh or clear application cache
3. **Check Console Errors**: Look for JavaScript errors in browser console
4. **Verify Session**: Ensure valid Supabase authentication session

#### System Metrics Not Updating
1. **Database Connection**: Verify database connectivity
2. **Service Status**: Check if monitoring services are running
3. **Permissions**: Ensure database queries have proper permissions
4. **Network Issues**: Check for network connectivity problems

#### User Creation Fails
1. **Email Validation**: Ensure email format is correct and unique
2. **Database Constraints**: Check for database constraint violations
3. **Service Availability**: Verify user management services are running
4. **Quota Limits**: Check if user quotas have been exceeded

### Emergency Procedures

#### System-Wide Issues
1. **Check System Health tab** for immediate status overview
2. **Run Health Check Script** for comprehensive diagnostics
3. **Review Recent Changes** in admin activity logs
4. **Escalate to Technical Team** if issues persist

#### Data Issues
1. **Run Integrity Check** to identify data corruption
2. **Check Recent Backups** for restore options
3. **Review Data Operations** for recent changes
4. **Document Issues** for post-incident review

## 📋 Regular Maintenance Tasks

### Daily
- [ ] Review System Health metrics
- [ ] Check for active alerts
- [ ] Monitor user activity patterns
- [ ] Review recent admin actions

### Weekly
- [ ] Run comprehensive health check
- [ ] Review database performance metrics
- [ ] Cleanup expired test users
- [ ] Check backup completion status

### Monthly
- [ ] Database optimization and maintenance
- [ ] Review user access permissions
- [ ] Analyze performance trends
- [ ] Update system documentation

### Quarterly
- [ ] Full system audit
- [ ] Security review and updates
- [ ] Performance optimization review
- [ ] Disaster recovery testing

## 📞 Support & Contact

For technical issues or questions about the System Administration Console:

1. **Check This Guide**: Review relevant sections for solutions
2. **System Logs**: Check the Scripts tab for diagnostic tools
3. **Technical Support**: Contact your technical team with specific error messages
4. **Documentation**: Refer to additional technical documentation in the `/docs` folder

---

**⚠️ Important**: The System Administration Console provides powerful tools that can affect the entire platform. Always verify your actions and use confirmation dialogs carefully. When in doubt, use dry-run modes or consult with your technical team.

**🔒 Security Note**: Never share admin credentials or leave admin sessions unattended. Always log out when finished with administrative tasks. 