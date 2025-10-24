# 🛠️ **ADMIN CONSOLE USER GUIDE**

*Complete guide for using the OvenAI System Administration Console*

---

## 🚀 **GETTING STARTED**

### **Accessing the Admin Console**
1. Navigate to `/admin` in your OvenAI application
2. Log in with your Super Admin credentials
3. The dashboard will load with system overview

### **Dashboard Overview**
The main dashboard provides at-a-glance information about your entire system:

```
┌─────────────────────────────────────────────────────────────┐
│ 🛠️ OvenAI System Administration Console                     │
├─────────────────────────────────────────────────────────────┤
│ [System Health] [Users] [Database] [Scripts] [Monitoring]   │
└─────────────────────────────────────────────────────────────┘
```

### **Navigation Tabs**
- **System Health**: Real-time system status and performance
- **Users**: User management and provisioning tools
- **Database**: Database administration and monitoring
- **Scripts**: Administrative script execution
- **Monitoring**: Advanced monitoring and alerting

---

## 📊 **SYSTEM HEALTH MONITORING**

### **Understanding the Health Dashboard**

#### **System Status Indicators**
- 🟢 **Green**: All systems operating normally
- 🟡 **Yellow**: Warning - attention needed
- 🔴 **Red**: Critical - immediate action required

#### **Key Metrics to Monitor**
```
⚡ System Performance
├── CPU Usage: Keep below 80%
├── Memory Usage: Keep below 85%
├── Disk Space: Keep above 20% free
├── Network I/O: Monitor for spikes
└── Response Times: Keep below 200ms
```

### **When to Take Action**
- **CPU > 80%**: Check for runaway processes
- **Memory > 85%**: Consider scaling or cleanup
- **Disk < 20%**: Archive old data or expand storage
- **Response > 500ms**: Investigate slow queries

### **Quick Health Check**
1. Click **"Run Health Check"** button
2. Wait for comprehensive system scan
3. Review results in popup window
4. Address any issues highlighted in red

---

## 👥 **USER MANAGEMENT**

### **Creating New Users**

#### **Create Client User** (For Paying Customers)
1. Click **"Create Client User"** button
2. Fill in required information:
   ```
   Email: client@company.com
   Client Name: ABC Company
   Role: ADMIN | STAFF
   Organization: Client's organization name
   ```
3. Click **"Create User"**
4. System automatically:
   - Creates user account
   - Generates secure password
   - Creates matching client record
   - Sets up organization membership
   - Sends welcome email

#### **Create Partner User** (For Business Partners)
1. Click **"Create Partner User"** button
2. Fill in partner information:
   ```
   Email: partner@agency.com
   Partner Organization: Marketing Agency XYZ
   Permissions: Select appropriate access levels
   ```
3. System creates account with partner-specific permissions

#### **Create Test User** (For Development)
1. Click **"Create Test User"** button
2. Options:
   ```
   Email: test@example.com
   Temporary: ✅ (auto-expires)
   Expires: 7 days (default)
   ```
3. Test users are automatically flagged for cleanup

### **Bulk User Operations**

#### **CSV Import for Multiple Users**
1. Download CSV template from **"Bulk Operations"** section
2. Fill in user data:
   ```csv
   email,name,role,organization,type
   user1@company.com,John Doe,ADMIN,Company A,client
   user2@agency.com,Jane Smith,STAFF,Agency B,partner
   ```
3. Upload CSV file
4. Review preview of users to be created
5. Click **"Import Users"** to process

#### **Cleanup Operations**
- **Remove Test Users**: Automatically removes expired test accounts
- **Deactivate Inactive**: Deactivates users inactive for 90+ days
- **Password Reset Bulk**: Forces password reset for security

### **User Analytics**
Monitor user activity and health:
```
👥 User Statistics
├── Total Active Users: 247
├── New Users (24h): 12
├── Login Activity: 89% daily active
├── Problem Accounts: 3 (locked accounts)
└── Geographic Distribution: US (60%), EU (30%), Other (10%)
```

---

## 🗄️ **DATABASE ADMINISTRATION**

### **Database Health Monitoring**

#### **Connection Status**
- Monitor all database connections
- Check for connection timeouts
- Verify backup systems are active

#### **Performance Metrics**
```
📊 Database Performance
├── Query Response Time: < 50ms (good)
├── Active Connections: 45/100 (healthy)
├── Database Size: 2.3GB (growing normally)
├── Backup Status: ✅ Completed 2h ago
└── Recent Errors: 0 (24h period)
```

### **Database Operations**

#### **Manual Backup**
1. Go to **Database** → **Backup Management**
2. Choose backup type:
   - **Full Backup**: Complete database snapshot
   - **Incremental**: Only changes since last backup
3. Click **"Start Backup"**
4. Monitor progress in real-time
5. Verify backup completion

#### **Performance Optimization**
1. Click **"Analyze Performance"**
2. Review slow queries report
3. Check for missing indexes
4. Run **"Optimize Database"** if needed
5. Monitor improvement in metrics

#### **Data Integrity Check**
1. Click **"Validate Data Integrity"**
2. System checks for:
   - Orphaned records
   - Referential integrity
   - Data consistency
3. Review report of issues found
4. Click **"Fix Issues"** if safe to proceed

---

## 🔧 **ADMINISTRATIVE SCRIPTS**

### **Running Scripts from UI**

#### **User Provisioning Scripts**
Instead of running terminal commands, use the UI:

1. **Create Client User Script**:
   ```
   Script: create-client-user
   Email: [Enter email]
   Client Name: [Enter name]
   Role: [Select ADMIN/STAFF]
   ```

2. **Bulk User Creation**:
   ```
   Script: bulk-create-users
   CSV File: [Upload file]
   Options: [Select dry-run first]
   ```

3. **Test User Cleanup**:
   ```
   Script: cleanup-test-users
   Age Filter: [30 days] (default)
   Confirm: ✅ Delete expired test accounts
   ```

#### **System Maintenance Scripts**
Critical system operations:

1. **Database Backup**:
   ```
   Script: backup-database
   Type: [Full | Incremental]
   Destination: [Auto | Custom path]
   ```

2. **Cache Management**:
   ```
   Script: flush-cache
   Target: [Redis | Memory | All]
   Impact: Users may experience brief slowdown
   ```

3. **Service Restart**:
   ```
   Script: restart-services
   Service: [API | Auth | Webhooks | All]
   Warning: Brief service interruption
   ```

### **Script Execution Process**
1. Select script from dropdown
2. Fill in required parameters
3. Review script preview
4. Click **"Execute Script"**
5. Monitor execution in real-time
6. Review execution log
7. Verify operation success

### **Safety Features**
- **Dry Run**: Test scripts without making changes
- **Confirmation**: Double-confirm destructive operations
- **Rollback**: Undo operations where possible
- **Audit Log**: All script executions logged

---

## 📈 **MONITORING & ALERTING**

### **Real-Time Monitoring**

#### **Live System Metrics**
Watch key indicators in real-time:
- **CPU Usage**: Live graph showing current load
- **Memory Usage**: RAM consumption trends
- **Network I/O**: Bandwidth utilization
- **API Requests**: Requests per minute
- **Error Rates**: Success/failure ratios

#### **Active User Sessions**
Monitor current activity:
```
👤 Live User Activity
├── Currently Online: 89 users
├── Recent Logins: 12 (last hour)
├── Active Sessions: 156 total
├── Geographic Activity: [World map view]
└── Top Features Used: Dashboard (45%), Leads (32%)
```

### **Alert Management**

#### **Setting Up Alerts**
1. Go to **Monitoring** → **Alert Rules**
2. Create new alert rule:
   ```
   Alert Name: High CPU Usage
   Condition: CPU > 80% for 5 minutes
   Severity: Warning
   Notification: Email + SMS
   ```

#### **Common Alert Rules**
- **High CPU**: > 80% for 5+ minutes
- **Low Memory**: < 15% available
- **Slow Response**: API response > 1000ms
- **Failed Backups**: Backup hasn't completed in 24h
- **Database Errors**: > 10 errors in 1 hour
- **Security Issues**: Multiple failed login attempts

### **Viewing Alerts**
1. **Active Alerts**: Currently triggered alerts
2. **Alert History**: Past 30 days of alerts
3. **Alert Analytics**: Trends and patterns
4. **Suppressed Alerts**: Temporarily disabled alerts

---

## ❓ **HELP SYSTEM GUIDE**

### **Using the "?" Toolbar**

#### **Contextual Help**
- **"?" Button**: Located next to each major section
- **Click for Help**: Instant explanations and guDemoAgentce
- **Interactive Tips**: Step-by-step instructions

#### **Help Features**
1. **Quick Reference**: Key information at a glance
2. **How-to Guides**: Step-by-step procedures
3. **Troubleshooting**: Common issues and solutions
4. **Command Reference**: Script syntax and examples

### **Getting Help**

#### **For Each Section**
- **System Health ?**: Understanding metrics and thresholds
- **User Management ?**: User creation and management procedures
- **Database ?**: Database operations and maintenance
- **Scripts ?**: Script usage and safety guidelines
- **Monitoring ?**: Setting up alerts and interpreting data

#### **Interactive Tutorials**
- **First-Time Setup**: Initial configuration guide
- **Daily Operations**: Routine maintenance procedures
- **Emergency Procedures**: Crisis response protocols
- **Advanced Features**: Power user capabilities

---

## 🚨 **EMERGENCY PROCEDURES**

### **System Down Scenarios**

#### **Database Connection Lost**
1. Check **Database** → **Connection Status**
2. Click **"Test Connection"**
3. If still failing, click **"Restart Database Connection"**
4. Monitor system recovery

#### **High Error Rates**
1. Check **Monitoring** → **Error Tracking**
2. Identify error patterns
3. Click **"View Error Details"**
4. Apply appropriate fixes:
   - Restart services if needed
   - Clear cache if corrupted
   - Check for database issues

#### **Performance Degradation**
1. Check **System Health** → **Performance Metrics**
2. Identify bottlenecks
3. Actions to try:
   - **Flush Cache**: Clear cached data
   - **Optimize Database**: Run performance optimization
   - **Restart Services**: Fresh start for all services

### **Security Incidents**

#### **Suspicious Activity**
1. Check **Monitoring** → **Security Alerts**
2. Review failed login attempts
3. Check for unusual access patterns
4. Actions:
   - Block suspicious IPs
   - Force password resets
   - Review user permissions

#### **Data Integrity Issues**
1. Run **"Validate Data Integrity"** immediately
2. Review findings
3. If critical issues found:
   - Stop affected services
   - Restore from backup if necessary
   - Contact development team

---

## 🔒 **SECURITY BEST PRACTICES**

### **Regular Security Tasks**

#### **Weekly**
- Review user access logs
- Check for failed login attempts
- Verify backup completion
- Update security patches

#### **Monthly**
- Full security audit
- Password policy enforcement
- Review user permissions
- Check for unused accounts

#### **Quarterly**
- Comprehensive security review
- Penetration testing
- Security awareness training
- Update security procedures

### **Access Control**

#### **Session Management**
- Sessions timeout after 30 minutes of inactivity
- Require re-authentication for sensitive operations
- IP whitelisting for additional security
- Two-factor authentication for critical actions

#### **Audit Logging**
- All admin actions are logged
- Logs include timestamp, user, action, and result
- Logs are immutable and encrypted
- Regular log reviews for suspicious activity

---

## 📋 **DAILY OPERATIONS CHECKLIST**

### **Morning Check (5 minutes)**
- [ ] Review system health dashboard
- [ ] Check overnight alerts
- [ ] Verify backup completion
- [ ] Review user login activity

### **Midday Check (3 minutes)**
- [ ] Monitor performance metrics
- [ ] Check error rates
- [ ] Review any support tickets
- [ ] Verify service availability

### **Evening Check (5 minutes)**
- [ ] Final system health check
- [ ] Review day's activities
- [ ] Check backup schedule
- [ ] Plan any maintenance tasks

### **Weekly Tasks (30 minutes)**
- [ ] Full system health review
- [ ] User account cleanup
- [ ] Database optimization
- [ ] Security audit
- [ ] Performance trend analysis

---

## 🎯 **TROUBLESHOOTING GUIDE**

### **Common Issues**

#### **"Database Connection Failed"**
1. Check network connectivity
2. Verify database server status
3. Check connection string configuration
4. Restart database service if needed

#### **"High CPU Usage"**
1. Identify CPU-intensive processes
2. Check for runaway queries
3. Review recent code deployments
4. Scale resources if needed

#### **"Users Can't Login"**
1. Check authentication service status
2. Verify database connectivity
3. Check session storage
4. Review authentication logs

#### **"Slow Performance"**
1. Check database query performance
2. Review cache hit rates
3. Monitor network latency
4. Check for resource constraints

### **Getting Additional Help**
- **Technical Issues**: Contact development team
- **Security Concerns**: Escalate to security team
- **Critical Outages**: Follow incident response plan
- **User Questions**: Refer to user documentation

---

*This guide provides complete instructions for managing your OvenAI system through the admin console. Keep this guide accessible and refer to it regularly for optimal system administration.* 