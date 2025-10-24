# 🏗️ Complete CRM System Architecture Plan

## 🎯 **System Goal**
Complete E2E CRM connecting Users → Clients → Projects → Leads → Messages → Reports with full BE/FE integration.

---

## 📊 **Database Tables Required**

### **Core Identity & Access**
```sql
-- ✅ EXISTS: User authentication & profiles
profiles (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT, 
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT, -- 'admin', 'client_admin', 'member'
  status TEXT -- 'active', 'inactive'
)

-- ✅ EXISTS: Company/client information
clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT, -- 'ACTIVE', 'INACTIVE'
  contact_info JSONB, -- email, phone, address, website
  settings JSONB -- preferences, configs
)

-- ✅ EXISTS: User-client relationships
client_members (
  id UUID PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT, -- 'admin', 'member', 'viewer'
  joined_at TIMESTAMP DEFAULT NOW()
)
```

### **Project & Campaign Management**
```sql
-- ✅ EXISTS: Marketing projects/campaigns
projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  status TEXT, -- 'active', 'paused', 'completed'
  settings JSONB, -- campaign configs, budgets, targets
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- ✅ EXISTS: Project team access
project_members (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT, -- 'manager', 'member', 'viewer'
  permissions JSONB -- specific access controls
)
```

### **Lead Management**
```sql
-- ✅ EXISTS: Prospect/lead data
leads (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT, -- 'new', 'contacted', 'qualified', 'proposal', 'converted', 'lost'
  source TEXT, -- 'google_ads', 'facebook_ads', 'organic', 'referral'
  notes TEXT,
  tags JSONB, -- custom tags and categories
  custom_fields JSONB, -- flexible lead data
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### **Communication System** 
```sql
-- 🆕 NEED: Message/conversation tracking
messages (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  sender_type TEXT, -- 'user', 'lead', 'system'
  sender_id UUID, -- user ID or external identifier
  content TEXT NOT NULL,
  message_type TEXT, -- 'email', 'sms', 'whatsapp', 'call_note', 'internal'
  direction TEXT, -- 'inbound', 'outbound'
  status TEXT, -- 'sent', 'delivered', 'read', 'failed'
  metadata JSONB, -- platform-specific data
  created_at TIMESTAMP DEFAULT NOW()
)

-- 🆕 NEED: Conversation threads
conversations (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  channel TEXT, -- 'email', 'whatsapp', 'sms'
  status TEXT, -- 'active', 'closed', 'paused'
  last_message_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### **Reporting & Analytics**
```sql
-- 🆕 NEED: Performance metrics
reports (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT, -- 'conversion', 'source_performance', 'project_summary'
  client_id UUID REFERENCES clients(id),
  project_id UUID REFERENCES projects(id), -- optional, for project-specific reports
  config JSONB, -- report parameters, filters
  data JSONB, -- computed metrics
  generated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- 🆕 NEED: Real-time metrics cache
metrics (
  id UUID PRIMARY KEY,
  entity_type TEXT, -- 'client', 'project', 'user'
  entity_id UUID,
  metric_name TEXT, -- 'conversion_rate', 'lead_count', 'response_time'
  metric_value NUMERIC,
  period TEXT, -- 'daily', 'weekly', 'monthly'
  date DATE,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### **Activity & Audit**
```sql
-- 🆕 NEED: Activity tracking
activities (
  id UUID PRIMARY KEY,
  entity_type TEXT, -- 'lead', 'project', 'client'
  entity_id UUID,
  action TEXT, -- 'created', 'updated', 'status_changed', 'message_sent'
  description TEXT,
  user_id UUID REFERENCES profiles(id),
  metadata JSONB, -- action-specific data
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## ⚙️ **Database Functions Required**

### **Access Control Functions**
```sql
-- User can access client
can_access_client(user_id UUID, client_id UUID) RETURNS BOOLEAN

-- User can access project  
can_access_project(user_id UUID, project_id UUID) RETURNS BOOLEAN

-- User can manage lead
can_manage_lead(user_id UUID, lead_id UUID) RETURNS BOOLEAN
```

### **Data Aggregation Functions**
```sql
-- Calculate conversion metrics
calculate_conversion_rate(project_id UUID, date_range DATERANGE) RETURNS NUMERIC

-- Get lead source performance
get_source_performance(project_id UUID) RETURNS TABLE(source TEXT, count BIGINT, rate NUMERIC)

-- Generate project summary
get_project_summary(project_id UUID) RETURNS JSONB
```

### **Message Processing Functions**
```sql
-- Create message thread
create_conversation(lead_id UUID, channel TEXT) RETURNS UUID

-- Update conversation stats
update_conversation_stats(conversation_id UUID) RETURNS VOID

-- Process incoming message
process_incoming_message(lead_id UUID, content TEXT, platform TEXT) RETURNS UUID
```

---

## 🔄 **Database Triggers Required**

### **Timestamp Management**
```sql
-- Auto-update timestamps
CREATE TRIGGER update_leads_timestamp 
  BEFORE UPDATE ON leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_timestamp 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### **Activity Logging**
```sql
-- Log lead status changes
CREATE TRIGGER log_lead_status_change 
  AFTER UPDATE OF status ON leads 
  FOR EACH ROW EXECUTE FUNCTION log_status_change_activity();

-- Log new lead creation
CREATE TRIGGER log_lead_creation 
  AFTER INSERT ON leads 
  FOR EACH ROW EXECUTE FUNCTION log_creation_activity();
```

### **Metrics Updates**
```sql
-- Update conversation message count
CREATE TRIGGER update_conversation_count 
  AFTER INSERT ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- Refresh project metrics
CREATE TRIGGER refresh_project_metrics 
  AFTER INSERT OR UPDATE OR DELETE ON leads 
  FOR EACH ROW EXECUTE FUNCTION refresh_metrics_cache();
```

---

## 🌐 **Edge Functions Required**

### **Communication Integration**
```typescript
// WhatsApp webhook handler
whatsapp-webhook/
  - Handle incoming WhatsApp messages
  - Create message records
  - Update conversation status

// Email integration
email-processor/
  - Process inbound emails
  - Link to leads by email address
  - Create message threads

// SMS integration  
sms-handler/
  - Handle SMS via Twilio/similar
  - Two-way SMS conversations
  - Delivery status updates
```

### **Report Generation**
```typescript
// PDF report generation
report-generator/
  - Generate PDF reports
  - Email delivery
  - Custom branding

// Data export
data-exporter/
  - CSV/Excel export
  - Lead lists
  - Performance reports
```

### **External Integrations**
```typescript
// CRM webhooks
webhook-handler/
  - External system notifications
  - Lead sync from landing pages
  - Form submissions

// Analytics integration
analytics-sync/
  - Google Analytics data
  - Facebook Ads metrics
  - Campaign performance
```

---

## 🔒 **Row Level Security (RLS) Policies**

### **User Access Control**
```sql
-- Users can only see their own profile
CREATE POLICY user_profile_access ON profiles
  FOR ALL USING (auth.uid() = id);

-- Users can only access clients they're members of
CREATE POLICY client_member_access ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_members 
      WHERE client_id = clients.id 
      AND user_id = auth.uid()
    )
  );

-- Project access through client membership
CREATE POLICY project_access ON projects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_members cm
      JOIN clients c ON c.id = cm.client_id
      WHERE c.id = projects.client_id 
      AND cm.user_id = auth.uid()
    )
  );
```

---

## 🧪 **Testing & Validation Plan**

### **Connection Testing**
1. ✅ Database connectivity
2. ✅ Service role permissions  
3. ✅ RLS policy validation
4. ✅ Function execution rights

### **Data Flow Testing**
1. User registration → Profile creation
2. Client creation → Membership assignment
3. Project creation → Team access
4. Lead creation → Assignment workflow
5. Message creation → Conversation threading
6. Report generation → Data accuracy

### **Integration Testing**
1. Frontend API calls
2. Edge function execution
3. External webhook handling
4. Real-time subscriptions
5. File upload/download

---

## 📁 **Implementation Order**

### **Phase 1: Database Foundation** ✅
- [x] Core tables exist
- [x] Workflow cleanup complete
- [ ] Add missing tables (messages, conversations, reports, metrics, activities)
- [ ] Create essential functions
- [ ] Set up RLS policies

### **Phase 2: Core Business Logic**
- [ ] User authentication flow
- [ ] Client/project access control
- [ ] Lead management system
- [ ] Basic reporting

### **Phase 3: Communication System**
- [ ] Message threading
- [ ] WhatsApp integration
- [ ] Email processing
- [ ] SMS handling

### **Phase 4: Advanced Features**
- [ ] Advanced reporting
- [ ] Analytics integration
- [ ] Export functionality
- [ ] Performance optimization

---

## ✅ **Success Criteria**

**Complete E2E Flow:**
1. User logs in → Sees assigned clients
2. Selects client → Views projects
3. Opens project → Sees leads
4. Clicks lead → Views conversation history
5. Sends message → Updates via WhatsApp/Email
6. Generates report → Shows real metrics

**Technical Requirements:**
- ✅ All database operations work
- ✅ RLS prevents unauthorized access
- ✅ Real-time updates via subscriptions
- ✅ Edge functions handle external events
- ✅ Reports show accurate data
- ✅ Messages sync across platforms

---

*Ready to build the complete CRM system!* 🚀 