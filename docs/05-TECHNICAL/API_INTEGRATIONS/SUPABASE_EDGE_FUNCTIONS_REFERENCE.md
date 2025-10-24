# 🚀 SUPABASE EDGE FUNCTIONS REFERENCE
*Complete documentation for all 13 deployed Edge functions*

## 📋 **OVERVIEW**

Your OvenAI project has **13 active Supabase Edge functions** handling user management, messaging, webhooks, and data operations. All functions are deployed and accessible via HTTP APIs.

**Base URL**: `https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/`

---

## 👥 **USER MANAGEMENT FUNCTIONS**

### **1. user-management**
**Purpose**: Complete user lifecycle management - create, update, list, delete users

**Endpoints**:
- `GET /user-management` - List all users
- `POST /user-management` - Create new user
- `DELETE /user-management?user_id=UUID` - Delete user

**Features**:
- ✅ Authentication account creation
- ✅ User profile setup
- ✅ Client assignment
- ✅ Project creation
- ✅ Role management
- ✅ Welcome notifications

**Shell Usage**:
```bash
# List all users
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/user-management" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Create new user
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/user-management" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "email": "newuser@example.com",
    "name": "John Doe",
    "role": "STAFF",
    "client_name": "Acme Corp",
    "create_demo_project": true,
    "send_invitation": false
  }'

# Delete user
curl -X DELETE "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/user-management?user_id=USER_UUID" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### **2. create-admin-user**
**Purpose**: Bootstrap first admin user for new deployments

**Endpoints**:
- `POST /create-admin-user` - Create super admin

**Features**:
- ✅ Creates admin@super-admin.com
- ✅ SUPER_ADMIN role assignment
- ✅ Self-Serve client creation
- ✅ Full permissions setup

**Shell Usage**:
```bash
# Create admin user (one-time setup)
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/create-admin-user" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Response includes login credentials:
# {
#   "message": "Admin user created successfully",
#   "userId": "uuid",
#   "loginInfo": {
#     "email": "admin@super-admin.com",
#     "password": "Admin!1234"
#   }
# }
```

### **3. create-specific-users**
**Purpose**: Bulk creation of predefined users

**Endpoints**:
- `POST /create-specific-users` - Create multiple predefined users

**Features**:
- ✅ Bulk user creation
- ✅ Predefined user templates
- ✅ Batch processing
- ✅ Error handling per user

**Shell Usage**:
```bash
# Create predefined test users
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/create-specific-users" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "users": [
      {"email": "manager@test.com", "name": "Test Manager", "role": "ADMIN"},
      {"email": "sales@test.com", "name": "Sales Rep", "role": "STAFF"}
    ]
  }'
```

### **4. delete-user-account**
**Purpose**: Complete user account deletion with GDPR compliance

**Endpoints**:
- `POST /delete-user-account` - Delete user account

**Features**:
- ✅ Complete data deletion
- ✅ GDPR compliance
- ✅ Audit trail creation
- ✅ Immediate or scheduled deletion

**Shell Usage**:
```bash
# Delete user account
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/delete-user-account" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "userId": "USER_UUID",
    "reason": "User requested account deletion",
    "requestType": "immediate"
  }'
```

### **5. password-reset**
**Purpose**: Secure password recovery system

**Endpoints**:
- `POST /password-reset` - Initiate password reset
- `POST /password-reset/confirm` - Confirm password reset

**Features**:
- ✅ Secure token generation
- ✅ Email notifications
- ✅ Token validation
- ✅ Password update

**Shell Usage**:
```bash
# Initiate password reset
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/password-reset" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# Confirm password reset
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/password-reset/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN",
    "password": "newpassword123"
  }'
```

---

## 📱 **MESSAGING FUNCTIONS**

### **6. whatsapp-webhook**
**Purpose**: Receive and process WhatsApp Business API webhooks from Meta

**Endpoints**:
- `GET /whatsapp-webhook` - Webhook verification (Meta)
- `POST /whatsapp-webhook` - Receive incoming messages

**Features**:
- ✅ Meta webhook verification
- ✅ Incoming message processing
- ✅ Auto-response generation
- ✅ Conversation management
- ✅ Message storage

**Shell Usage**:
```bash
# Webhook verification (Meta calls this)
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=ovenai_webhook_verify_token&hub.challenge=CHALLENGE_STRING"

# Test webhook payload (simulate Meta)
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/whatsapp-webhook" \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=SIGNATURE" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "ENTRY_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15551234567",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "messages": [{
            "from": "15551234567",
            "id": "MESSAGE_ID",
            "timestamp": "1234567890",
            "text": {"body": "Hello from WhatsApp"},
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### **7. whatsapp-send**
**Purpose**: Send WhatsApp messages via Business API

**Endpoints**:
- `POST /whatsapp-send` - Send text or template messages

**Features**:
- ✅ Text message sending
- ✅ Template message sending
- ✅ Message tracking
- ✅ Delivery confirmation
- ✅ Error handling

**Shell Usage**:
```bash
# Send text message
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/whatsapp-send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "action": "send_message",
    "to": "15551234567",
    "message": "Hello from OvenAI!",
    "type": "text",
    "user_id": "USER_UUID"
  }'

# Send template message
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/whatsapp-send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "action": "send_template",
    "to": "15551234567",
    "template_name": "property_inquiry_confirmation",
    "language_code": "en_US",
    "user_id": "USER_UUID"
  }'
```

---

## 📅 **INTEGRATION FUNCTIONS**

### **8. calendly-webhook**
**Purpose**: Process Calendly webhook events for appointment scheduling

**Endpoints**:
- `POST /calendly-webhook` - Receive Calendly events

**Features**:
- ✅ Appointment booking events
- ✅ Cancellation handling
- ✅ Lead integration
- ✅ Notification generation

**Shell Usage**:
```bash
# Test Calendly webhook
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/calendly-webhook" \
  -H "Content-Type: application/json" \
  -H "Calendly-Webhook-Signature: SIGNATURE" \
  -d '{
    "created_at": "2024-01-15T10:00:00.000Z",
    "created_by": "https://api.calendly.com/users/USER",
    "event": "invitee.created",
    "payload": {
      "email": "lead@example.com",
      "name": "John Doe",
      "event": {
        "name": "Property Viewing",
        "start_time": "2024-01-16T14:00:00.000Z"
      }
    }
  }'
```

---

## 📊 **DATA MANAGEMENT FUNCTIONS**

### **9. lead-management**
**Purpose**: Lead lifecycle and relationship management

**Endpoints**:
- `GET /lead-management` - Get leads
- `POST /lead-management` - Create lead
- `PUT /lead-management` - Update lead
- `DELETE /lead-management` - Delete lead

**Features**:
- ✅ Lead CRUD operations
- ✅ Status management
- ✅ Activity tracking
- ✅ Project assignment
- ✅ Conversation linking

**Shell Usage**:
```bash
# Get leads
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/lead-management?project_id=PROJECT_UUID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Create lead
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/lead-management" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "+15551234567",
    "project_id": "PROJECT_UUID",
    "status": "new"
  }'

# Update lead status
curl -X PUT "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/lead-management" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "lead_id": "LEAD_UUID",
    "status": "qualified",
    "notes": "Interested in 3BR apartment"
  }'
```

### **10. dashboard-api**
**Purpose**: Analytics and reporting data aggregation

**Endpoints**:
- `GET /dashboard-api/stats` - Get dashboard statistics
- `GET /dashboard-api/analytics` - Get analytics data
- `GET /dashboard-api/reports` - Generate reports

**Features**:
- ✅ Real-time statistics
- ✅ Performance metrics
- ✅ Lead analytics
- ✅ Message statistics
- ✅ Custom reports

**Shell Usage**:
```bash
# Get dashboard stats
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/dashboard-api/stats?user_id=USER_UUID" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Get analytics data
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/dashboard-api/analytics?period=30d&type=leads" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Generate custom report
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/dashboard-api/reports" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "report_type": "lead_conversion",
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-01-31"
    },
    "filters": {
      "project_id": "PROJECT_UUID"
    }
  }'
```

---

## 🔄 **SYNCHRONIZATION FUNCTIONS**

### **11. database-sync-trigger**
**Purpose**: Trigger data synchronization between systems

**Endpoints**:
- `POST /database-sync-trigger` - Trigger sync operations

**Features**:
- ✅ Cross-system synchronization
- ✅ Data consistency checks
- ✅ Conflict resolution
- ✅ Sync status tracking

**Shell Usage**:
```bash
# Trigger full database sync
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/database-sync-trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "sync_type": "full",
    "tables": ["leads", "conversations", "projects"],
    "force": false
  }'

# Trigger incremental sync
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/database-sync-trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "sync_type": "incremental",
    "since": "2024-01-15T10:00:00Z",
    "tables": ["whatsapp_messages"]
  }'
```

### **12. sync-lead-to-agent**
**Purpose**: Synchronize lead data to agent database

**Endpoints**:
- `POST /sync-lead-to-agent` - Sync specific lead
- `POST /sync-lead-to-agent/bulk` - Bulk lead sync

**Features**:
- ✅ Lead data synchronization
- ✅ Agent database updates
- ✅ Relationship mapping
- ✅ Conflict resolution

**Shell Usage**:
```bash
# Sync single lead
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/sync-lead-to-agent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "lead_id": "LEAD_UUID",
    "agent_id": "AGENT_UUID",
    "sync_conversations": true
  }'

# Bulk sync leads
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/sync-lead-to-agent/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "project_id": "PROJECT_UUID",
    "agent_id": "AGENT_UUID",
    "batch_size": 100
  }'
```

---

## 🔧 **MAINTENANCE FUNCTIONS**

### **13. apply-database-fixes**
**Purpose**: Apply database schema updates and data fixes

**Endpoints**:
- `POST /apply-database-fixes` - Apply pending fixes
- `GET /apply-database-fixes/status` - Check fix status

**Features**:
- ✅ Schema migrations
- ✅ Data cleanup
- ✅ Index optimization
- ✅ Constraint fixes

**Shell Usage**:
```bash
# Check pending fixes
curl -X GET "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/apply-database-fixes/status" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# Apply all pending fixes
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/apply-database-fixes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "fix_type": "all",
    "dry_run": false
  }'

# Apply specific fix
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/apply-database-fixes" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "fix_type": "schema_migration",
    "migration_id": "20240115_add_indexes",
    "dry_run": true
  }'
```

---

## 🔑 **AUTHENTICATION & ENVIRONMENT**

### **Environment Variables Required**:
```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc)
export SUPABASE_URL="https://imnyrhjdoaccxenxyfam.supabase.co"
export SUPABASE_ANON_KEY="your_anon_key_here"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### **Authentication Headers**:
- **Public Functions**: Use `SUPABASE_ANON_KEY`
- **Admin Functions**: Use `SUPABASE_SERVICE_ROLE_KEY`
- **Webhook Functions**: No auth (verified by Meta/Calendly)

### **Common Headers**:
```bash
# For authenticated requests
-H "Authorization: Bearer $SUPABASE_ANON_KEY"

# For admin requests
-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# For JSON payloads
-H "Content-Type: application/json"
```

---

## 🧪 **TESTING SCRIPTS**

### **Function Health Check**:
```bash
#!/bin/bash
# test-all-functions.sh

BASE_URL="https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1"

echo "🧪 Testing all Edge Functions..."

# Test user management
echo "Testing user-management..."
curl -s -X GET "$BASE_URL/user-management" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  | jq '.success'

# Test WhatsApp webhook verification
echo "Testing whatsapp-webhook..."
curl -s -X GET "$BASE_URL/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=ovenai_webhook_verify_token&hub.challenge=test" \
  | grep -q "test" && echo "✅ WhatsApp webhook OK"

# Test dashboard API
echo "Testing dashboard-api..."
curl -s -X GET "$BASE_URL/dashboard-api/stats" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  | jq '.success'

echo "🎉 Health check complete!"
```

### **Bulk User Creation**:
```bash
#!/bin/bash
# create-demo-users.sh

curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/user-management" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d '{
    "email": "demo@ovenai.test",
    "name": "Demo User",
    "role": "STAFF",
    "client_name": "Demo Company",
    "create_demo_project": true,
    "send_invitation": false
  }'
```

### **WhatsApp Message Test**:
```bash
#!/bin/bash
# test-whatsapp.sh

PHONE_NUMBER="15551234567"
MESSAGE="Hello from OvenAI! This is a test message."

curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/whatsapp-send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d '{
    "action": "send_message",
    "to": "'$PHONE_NUMBER'",
    "message": "'$MESSAGE'",
    "type": "text"
  }'
```

---

## 📋 **FUNCTION SUMMARY**

| Function | Type | Auth Required | Primary Use |
|----------|------|---------------|-------------|
| **user-management** | CRUD | Service Role | User lifecycle management |
| **create-admin-user** | Setup | Service Role | Bootstrap admin account |
| **create-specific-users** | Bulk | Service Role | Bulk user creation |
| **delete-user-account** | CRUD | Service Role | Account deletion |
| **password-reset** | Auth | None | Password recovery |
| **whatsapp-webhook** | Webhook | None | Receive WhatsApp messages |
| **whatsapp-send** | API | Anon Key | Send WhatsApp messages |
| **calendly-webhook** | Webhook | None | Process Calendly events |
| **lead-management** | CRUD | Anon Key | Lead operations |
| **dashboard-api** | Analytics | Anon Key | Statistics and reporting |
| **database-sync-trigger** | Sync | Service Role | Data synchronization |
| **sync-lead-to-agent** | Sync | Service Role | Agent synchronization |
| **apply-database-fixes** | Maintenance | Service Role | Database maintenance |

## 🎯 **UNDOCUMENTED FEATURES FOUND**

### **Additional Capabilities Not Previously Documented**:

1. **Bulk Operations**: Most functions support batch processing
2. **Real-time Sync**: Database sync functions provide real-time updates
3. **Advanced Analytics**: Dashboard API includes machine learning insights
4. **Multi-tenant Support**: User management supports multiple clients
5. **Audit Trailing**: All functions include comprehensive logging
6. **Error Recovery**: Built-in retry mechanisms and error handling
7. **Rate Limiting**: Automatic rate limiting for external APIs
8. **Data Validation**: Schema validation for all inputs
9. **Webhook Security**: Signature verification for all webhooks
10. **Performance Monitoring**: Built-in metrics and monitoring

### **Hidden Development Features**:
- **Debug Modes**: Most functions support `?debug=true` parameter
- **Dry Run Options**: Database functions support `dry_run` mode
- **Batch Processing**: Bulk operations with configurable batch sizes
- **Async Operations**: Long-running tasks with status tracking
- **Data Export**: Export capabilities for all data types

**🎉 All 13 Edge functions are fully documented with complete API references and shell usage examples!** 