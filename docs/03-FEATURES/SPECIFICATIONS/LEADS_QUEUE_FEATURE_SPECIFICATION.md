# 📋 Leads Queue Feature Specification
**Version 1.0 | OvenAI Lead Processing System**

---

## 🎯 Executive Summary

The Leads Queue is a sophisticated lead management system that bridges the gap between manual lead management and automated AI-powered conversations. It provides sales engineers with complete control over which leads receive automated WhatsApp messages, when they receive them, and in what priority order, while seamlessly integrating with the Agent DB's N8N automation workflows.

---

## 🏗️ Feature Design

### **Core Concept**
The Leads Queue acts as a **"staging area"** where sales engineers prepare leads for automated conversation initiation. Think of it as an assembly line where leads are:
1. **Selected** from the main lead pool
2. **Prioritized** based on heat score and business rules
3. **Scheduled** for optimal contact times
4. **Processed** through Agent DB automation
5. **Delivered** via WhatsApp Business API

### **Design Principles**
- **User Control First**: Sales engineers maintain full control over automation
- **Business Logic Compliance**: Respects Israeli business hours and cultural norms
- **Scalable Architecture**: Handles 45-200 leads per day per user
- **Fail-Safe Operations**: Graceful degradation and retry mechanisms
- **Real-Time Visibility**: Live queue status and performance metrics

---

## 📊 Scope

### **In Scope**
1. **Queue Management UI**
   - Bulk lead selection and operations
   - Priority assignment (low/normal/high/hot)
   - Schedule configuration
   - Real-time queue monitoring

2. **Automation Settings**
   - Business hours configuration (Israeli time zone)
   - Daily/monthly targets
   - Processing delays and batch sizes
   - Holiday exclusions

3. **Performance Tracking**
   - Success/failure rates
   - Throughput metrics
   - Queue depth monitoring
   - Historical analytics

4. **Integration Points**
   - Site DB lead management
   - Agent DB trigger system
   - WhatsApp Business API
   - Notification system

### **Out of Scope**
1. **AI Conversation Content** - Handled by Agent DB
2. **WhatsApp Template Creation** - Meta Business Manager
3. **Lead Scoring Algorithm** - Separate system
4. **CRM Integration** - Future phase
5. **Multi-channel Messaging** - WhatsApp only for v1
6. **Advanced Analytics** - Basic metrics only
7. **A/B Testing** - Not in initial release

---

## 👤 User Stories

### **Primary Persona: Michal - Senior Sales Engineer**
*"I need to efficiently manage 150+ leads daily while ensuring quality outreach"*

#### **Epic 1: Queue Preparation**
```
AS A sales engineer
I WANT TO select and queue multiple leads at once
SO THAT I can prepare tomorrow's outreach efficiently
```

**User Stories:**
1. **US-001**: Select leads by temperature (hot/warm/cool/cold)
2. **US-002**: Filter by last contact date
3. **US-003**: Bulk select with checkboxes
4. **US-004**: Set priority levels for selected leads
5. **US-005**: Schedule leads for specific time slots

#### **Epic 2: Queue Monitoring**
```
AS A sales engineer
I WANT TO monitor queue processing in real-time
SO THAT I can intervene if issues arise
```

**User Stories:**
1. **US-006**: View current queue depth
2. **US-007**: See processing status (pending/active/completed/failed)
3. **US-008**: Monitor success rates
4. **US-009**: Pause/resume queue processing
5. **US-010**: Handle failed messages

#### **Epic 3: Business Rules Configuration**
```
AS A sales team manager
I WANT TO configure processing rules
SO THAT outreach respects business hours and capacity limits
```

**User Stories:**
1. **US-011**: Set Israeli business hours (Sun-Thu, 09:00-17:00)
2. **US-012**: Configure daily targets (45 leads/day)
3. **US-013**: Set maximum capacity (200 leads)
4. **US-014**: Exclude Jewish holidays
5. **US-015**: Configure Shabbat restrictions

---

## 🎨 Use Cases

### **UC-01: Morning Queue Preparation**
**Actor**: Sales Engineer  
**Trigger**: Daily at 8:30 AM (before business hours)  
**Flow**:
1. Engineer logs into OvenAI
2. Reviews yesterday's results
3. Filters leads by "not contacted in 7 days" + "temperature >= warm"
4. Selects 50 leads for today's queue
5. Sets 10 as "high priority" (hot leads)
6. Schedules processing to start at 9:00 AM
7. System confirms queue prepared

**Success Criteria**: 50 leads queued with appropriate priorities

### **UC-02: Mid-Day Queue Adjustment**
**Actor**: Sales Engineer  
**Trigger**: Urgent lead received at 2:00 PM  
**Flow**:
1. New hot lead enters system
2. Engineer opens queue management
3. Pauses current processing
4. Adds hot lead with "immediate" priority
5. Resumes processing
6. System processes hot lead next

**Success Criteria**: Hot lead contacted within 15 minutes

### **UC-03: Failed Message Recovery**
**Actor**: System (Automated)  
**Trigger**: WhatsApp API returns error  
**Flow**:
1. Message send fails (rate limit/network)
2. System marks as "failed" with error code
3. Waits for retry delay (5 minutes)
4. Retries up to 3 times
5. If still failing, notifies engineer
6. Engineer can manually retry or skip

**Success Criteria**: 90%+ recovery rate on retries

---

## 💡 User Needs Analysis

### **Sales Engineer Daily Workflow**
1. **Morning Planning** (8:30-9:00 AM)
   - Review overnight lead captures
   - Prioritize based on heat scores
   - Queue preparation for the day

2. **Active Monitoring** (9:00 AM-5:00 PM)
   - Watch queue progress
   - Handle escalations
   - Adjust priorities as needed

3. **End-of-Day Review** (5:00-6:00 PM)
   - Check completion rates
   - Prepare next day's queue
   - Note follow-ups needed

### **Key Pain Points Addressed**
- ❌ **Manual WhatsApp sending** → ✅ Automated queue processing
- ❌ **No priority system** → ✅ Heat-based prioritization
- ❌ **Sending outside business hours** → ✅ Smart scheduling
- ❌ **No visibility on progress** → ✅ Real-time metrics
- ❌ **Lost leads in shuffle** → ✅ Systematic queue management

---

## 🗄️ Database Implementation

### **Site DB Tables**

#### **1. whatsapp_message_queue**
```sql
CREATE TABLE whatsapp_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Queue Management
    status TEXT CHECK (status IN ('pending', 'queued', 'processing', 'sent', 'failed', 'cancelled')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'immediate')),
    scheduled_for TIMESTAMPTZ,
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Message Content
    message_template TEXT NOT NULL,
    message_variables JSONB DEFAULT '{}',
    
    -- Processing Details
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    error_code TEXT,
    
    -- Agent DB Integration
    agent_trigger_id TEXT,
    agent_conversation_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_queue_status_priority ON whatsapp_message_queue(status, priority DESC, scheduled_for ASC);
CREATE INDEX idx_queue_lead_id ON whatsapp_message_queue(lead_id);
CREATE INDEX idx_queue_user_id ON whatsapp_message_queue(user_id);
```

#### **2. user_queue_settings**
```sql
CREATE TABLE user_queue_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
    
    -- Business Hours (Israeli Time)
    business_hours JSONB DEFAULT '{
        "sunday": {"start": "09:00", "end": "17:00", "enabled": true},
        "monday": {"start": "09:00", "end": "17:00", "enabled": true},
        "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
        "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
        "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
        "friday": {"start": "09:00", "end": "13:00", "enabled": false},
        "saturday": {"enabled": false}
    }',
    
    -- Processing Targets
    target_leads_per_day INTEGER DEFAULT 45,
    target_leads_per_month INTEGER DEFAULT 1000,
    max_daily_capacity INTEGER DEFAULT 200,
    
    -- Automation Settings
    auto_queue_enabled BOOLEAN DEFAULT true,
    processing_delay_seconds INTEGER DEFAULT 120, -- 2 minutes
    batch_size INTEGER DEFAULT 10,
    
    -- Priority Weights (1-10)
    priority_weights JSONB DEFAULT '{
        "hot": 10,
        "warm": 7,
        "cool": 4,
        "cold": 2,
        "new_lead": 5,
        "follow_up": 8
    }',
    
    -- Holiday Settings
    exclude_holidays BOOLEAN DEFAULT true,
    custom_holidays JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **3. queue_performance_metrics**
```sql
CREATE TABLE queue_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    metric_date DATE NOT NULL,
    
    -- Daily Metrics
    leads_queued INTEGER DEFAULT 0,
    leads_processed INTEGER DEFAULT 0,
    leads_sent INTEGER DEFAULT 0,
    leads_failed INTEGER DEFAULT 0,
    leads_cancelled INTEGER DEFAULT 0,
    
    -- Performance Metrics
    average_processing_time_seconds NUMERIC,
    success_rate NUMERIC,
    failure_rate NUMERIC,
    
    -- Hourly Distribution
    hourly_distribution JSONB DEFAULT '{}',
    
    -- Error Analysis
    error_breakdown JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, client_id, metric_date)
);
```

### **Agent DB Integration**
```sql
-- Trigger sent to Agent DB when lead is queued
{
    "event": "lead_queued_for_messaging",
    "lead_id": "uuid",
    "priority": "high",
    "scheduled_for": "2024-01-15T09:00:00Z",
    "metadata": {
        "temperature": "hot",
        "score": 85,
        "last_contact": "2024-01-08"
    }
}
```

---

## ⚡ Functional Requirements

### **FR-001: Lead Selection**
- Support multi-select with Shift+Click and Ctrl+Click
- Filter by temperature, status, last contact date
- Search by name, phone, email
- Show lead preview on hover

### **FR-002: Bulk Operations**
- Queue selected leads
- Set priority (low/normal/high/immediate)
- Schedule for specific time
- Cancel queued items
- Pause/resume processing

### **FR-003: Queue Processing**
- Process in priority order (immediate > high > normal > low)
- Respect business hours
- Honor daily capacity limits
- Implement backoff on failures
- Support manual retry

### **FR-004: Real-Time Monitoring**
- Live queue depth counter
- Processing status indicators
- Success/failure rates
- Throughput metrics (leads/hour)
- Error notifications

### **FR-005: Business Rules Engine**
- Israeli business hours enforcement
- Shabbat/holiday exclusions
- Rate limiting (1000 messages/hour)
- Daily target management
- Capacity overflow handling

---

## 🛡️ Non-Functional Requirements

### **Performance**
- **NFR-001**: Page load < 2 seconds
- **NFR-002**: Queue operation < 500ms
- **NFR-003**: Support 10,000+ leads in view
- **NFR-004**: Process 100 leads/minute
- **NFR-005**: Real-time updates < 1 second latency

### **Reliability**
- **NFR-006**: 99.9% uptime for queue service
- **NFR-007**: Zero message loss guarantee
- **NFR-008**: Automatic failure recovery
- **NFR-009**: Transaction consistency
- **NFR-010**: Audit trail for all operations

### **Security**
- **NFR-011**: RLS policies on all tables
- **NFR-012**: Encrypted credential storage
- **NFR-013**: API rate limit protection
- **NFR-014**: Activity logging for compliance

### **Usability**
- **NFR-016**: Mobile-responsive design
- **NFR-017**: Keyboard navigation support
- **NFR-018**: Screen reader compatibility
- **NFR-019**: Multi-language support (EN/HE)
- **NFR-020**: Dark mode support

---

## 🌍 RTL & Hebrew Support

### **UI Adaptations**
```css
/* RTL Layout Adjustments */
.queue-container[dir="rtl"] {
    direction: rtl;
    text-align: right;
}

.queue-controls[dir="rtl"] {
    flex-direction: row-reverse;
}

.priority-badge[dir="rtl"] {
    margin-right: 0;
    margin-left: 8px;
}
```

### **Hebrew Translations**
```json
{
  "queue": {
    "title": "תור הלידים",
    "bulk_select": "בחירה מרובה",
    "priority": {
      "immediate": "דחוף",
      "high": "גבוה",
      "normal": "רגיל",
      "low": "נמוך"
    },
    "status": {
      "pending": "ממתין",
      "processing": "בעיבוד",
      "completed": "הושלם",
      "failed": "נכשל"
    },
    "actions": {
      "queue": "הוסף לתור",
      "pause": "השהה",
      "resume": "המשך",
      "cancel": "בטל"
    },
    "metrics": {
      "processed_today": "עובדו היום",
      "success_rate": "אחוז הצלחה",
      "in_queue": "בתור"
    }
  }
}
```

### **Business Hours in Hebrew**
```javascript
const hebrewDays = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת"
};
```

---

## 🌓 Dark Mode Support

### **Color Scheme**
```css
/* Light Mode */
--queue-bg: #ffffff;
--queue-border: #e5e7eb;
--queue-text: #1f2937;
--queue-success: #10b981;
--queue-warning: #f59e0b;
--queue-error: #ef4444;

/* Dark Mode */
[data-theme="dark"] {
  --queue-bg: #1f2937;
  --queue-border: #374151;
  --queue-text: #f3f4f6;
  --queue-success: #059669;
  --queue-warning: #d97706;
  --queue-error: #dc2626;
}
```

### **Component Adaptations**
- Status badges with proper contrast
- Chart colors for visibility
- Icon adjustments for clarity
- Hover states for accessibility

---

## ⚠️ Limitations

### **Technical Limitations**
1. **WhatsApp Rate Limits**: 1000 messages/hour maximum
2. **API Constraints**: 80 requests/second to Meta
3. **Database Row Limits**: 10M rows per table
4. **Real-time Updates**: 5-second polling interval
5. **Bulk Operations**: 500 leads maximum per operation

### **Business Limitations**
1. **Business Hours Only**: No 24/7 processing
2. **Single Channel**: WhatsApp only (no SMS/Email)
3. **Template Requirements**: Pre-approved Meta templates
4. **Geographic Limits**: Israeli phone numbers optimized
5. **Language Support**: English and Hebrew only

### **Feature Limitations**
1. **No A/B Testing**: Single message variant only
2. **Basic Analytics**: No cohort analysis
3. **Simple Prioritization**: No ML-based scoring
4. **Manual Recovery**: Some errors need intervention
5. **No Workflow Designer**: Fixed process only

---

## 📚 Implementation Guides

### **Quick Start Guide**
1. **Login** with your credentials
2. Navigate to **Leads → Queue Management**
3. **Filter leads** using the top toolbar
4. **Select leads** with checkboxes
5. Click **"Add to Queue"**
6. Set **priority** and **schedule**
7. Click **"Start Processing"**

### **Best Practices**
1. **Queue Preparation**
   - Prepare tomorrow's queue at end of day
   - Start with 20-30 leads, scale up gradually
   - Prioritize hot leads for morning slots

2. **Timing Strategy**
   - Best times: 10-11 AM, 2-3 PM
   - Avoid: Lunch (12-1 PM), Late afternoon (4-5 PM)
   - Never: Friday afternoon, Saturday

3. **Priority Management**
   - Immediate: Demo requests, hot leads
   - High: Warm leads, follow-ups due
   - Normal: General outreach
   - Low: Cold leads, info requests

### **Troubleshooting Guide**

#### **Issue: Queue Not Processing**
```bash
1. Check business hours settings
2. Verify daily limit not exceeded
3. Confirm WhatsApp credentials valid
4. Check for system notifications
5. Try manual resume
```

#### **Issue: High Failure Rate**
```bash
1. Check WhatsApp template approval
2. Verify phone number formats
3. Review rate limit status
4. Check network connectivity
5. Examine error logs
```

#### **Issue: Slow Performance**
```bash
1. Reduce batch size (10 → 5)
2. Increase processing delay
3. Clear completed items
4. Check database indexes
5. Monitor system resources
```

---

## 🔮 Future Enhancements

### **Phase 2 (Q2 2024)**
- Multi-channel support (SMS, Email)
- Advanced analytics dashboard
- ML-based lead scoring
- A/B testing framework
- Workflow customization

### **Phase 3 (Q3 2024)**
- CRM integrations (Salesforce, HubSpot)
- Advanced scheduling algorithms
- Team collaboration features
- Custom reporting builder
- API for external systems

### **Phase 4 (Q4 2024)**
- Predictive queue optimization
- Conversation intelligence
- Automated follow-up sequences
- Performance benchmarking
- Enterprise features

---

## 🤝 Stakeholder Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | [Name] | [Date] | _________ |
| Tech Lead | [Name] | [Date] | _________ |
| Sales Manager | [Name] | [Date] | _________ |
| QA Lead | [Name] | [Date] | _________ |

---

## 📎 Appendices

### **A. API Documentation**
- [WhatsApp Business API Reference](https://developers.facebook.com/docs/whatsapp)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Agent DB Integration Guide](./AGENT_DB_INTEGRATION.md)

### **B. Test Scenarios**
- [Queue Management Test Cases](./tests/QUEUE_TEST_CASES.md)
- [Performance Test Results](./tests/PERFORMANCE_RESULTS.md)
- [Security Audit Report](./security/QUEUE_SECURITY_AUDIT.md)

### **C. Metrics & KPIs**
- Daily processing target: 45 leads
- Success rate target: > 95%
- Average processing time: < 30 seconds
- Queue depth target: < 200 leads
- Error rate threshold: < 5%

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: February 2024  
**Owner**: OvenAI Product Team 