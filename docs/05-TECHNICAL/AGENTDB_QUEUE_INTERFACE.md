# 🔗 AgentDB Queue Interface Documentation
**Version 1.0 | Lead Processing Webhook Integration**

---

## 🎯 **Overview**

The AgentDB Queue Interface is a **webhook-based integration** that allows the OvenAI Site DB queue system to trigger automated lead processing workflows in the Agent DB. This interface is **agnostic to AgentDB implementation** and provides a clean, standardized way to hand off leads for AI-powered conversation automation.

### **Key Design Principles**
- ✅ **Agnostic Design**: Works with any backend system, not just current AgentDB
- ✅ **Error Tolerant**: Queue operations continue even if webhook fails
- ✅ **Comprehensive Payload**: Provides all necessary context for processing
- ✅ **Status Tracking**: Maintains webhook delivery status and responses
- ✅ **Retry Logic**: Automatic retry with exponential backoff

---

## 🏗️ **System Architecture**

```
┌─────────────────────┐    HTTP POST     ┌─────────────────────┐
│   Site DB Queue     │ ─────────────────→ │   AgentDB System    │
│  (QueueService)     │   Webhook Call   │  (N8N + AI Engine)  │
│                     │                  │                     │
│ ✅ Prepare Queue    │                  │ 🤖 AI Conversations │
│ ✅ Start Processing │                  │ 📱 WhatsApp API     │
│ ✅ Reset Queue      │ ←───────────────── │ 🔄 Workflow Engine  │
│ ✅ Error Handling   │   Response Data  │                     │
└─────────────────────┘                  └─────────────────────┘
```

---

## 📡 **Webhook Interface Specification**

### **Endpoint Configuration**
```javascript
// Environment Configuration
AGENT_DB_WEBHOOK_URL = "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/queue-trigger"
AGENT_DB_SERVICE_KEY = "your-service-role-key"
```

### **HTTP Request Format**
```http
POST {AGENT_DB_WEBHOOK_URL}
Content-Type: application/json
Authorization: Bearer {AGENT_DB_SERVICE_KEY}
User-Agent: OvenAI-QueueService/1.0

{webhook_payload}
```

---

## 📋 **Payload Specification**

### **Complete Webhook Payload**
```typescript
interface AgentDBWebhookPayload {
  action: 'process_lead' | 'batch_process' | 'queue_complete';
  leadProcessingQueue: Array<{
    id: string;                    // Queue entry ID
    leadId: string;               // Lead ID from Site DB
    priority: number;             // 1-10 priority score
    processingState: string;      // current state
    metadata: Record<string, any>; // Lead context & configuration
  }>;
  userSettings: {
    userId: string;
    businessHours: {
      enabled: boolean;
      work_days: number[];        // [1,2,3,4,5] Mon-Fri
      business_hours: {
        start: string;            // "09:00"
        end: string;             // "17:00"
        timezone: string;        // "Asia/Jerusalem"
      };
    };
    rateLimits: {
      messages_per_hour: number;
      messages_per_day: number;
      respect_business_hours: boolean;
    };
  };
  timestamp: string;              // ISO 8601 timestamp
}
```

### **Sample Payload: Single Lead Processing**
```json
{
  "action": "process_lead",
  "leadProcessingQueue": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "leadId": "123e4567-e89b-12d3-a456-426614174000", 
      "priority": 8,
      "processingState": "active",
      "metadata": {
        "prepared_at": "2025-01-29T10:30:00Z",
        "business_day": "Wed Jan 29 2025",
        "heat_score": 8,
        "bant_score": 7,
        "lead_data": {
          "name": "John Doe",
          "phone": "+972501234567",
          "project_interest": "luxury-apartments-tlv",
          "source": "website_form"
        }
      }
    }
  ],
  "userSettings": {
    "userId": "user_abc123",
    "businessHours": {
      "enabled": true,
      "work_days": [1, 2, 3, 4, 5],
      "business_hours": {
        "start": "09:00",
        "end": "17:00",
        "timezone": "Asia/Jerusalem"
      }
    },
    "rateLimits": {
      "messages_per_hour": 1000,
      "messages_per_day": 10000,
      "respect_business_hours": true
    }
  },
  "timestamp": "2025-01-29T10:30:15.123Z"
}
```

### **Sample Payload: Batch Processing**
```json
{
  "action": "batch_process",
  "leadProcessingQueue": [
    {
      "id": "queue_001",
      "leadId": "lead_001",
      "priority": 8,
      "processingState": "queued",
      "metadata": { "heat_score": 8, "source": "premium_landing" }
    },
    {
      "id": "queue_002", 
      "leadId": "lead_002",
      "priority": 6,
      "processingState": "queued",
      "metadata": { "heat_score": 6, "source": "organic_search" }
    }
  ],
  "userSettings": { /* ... same structure ... */ },
  "timestamp": "2025-01-29T10:30:15.123Z"
}
```

---

## 🔄 **Action Types**

### **1. `process_lead`** - Single Lead Processing
- **When**: User clicks "Start Processing" or automated processing begins
- **Payload**: Single lead in `leadProcessingQueue` array
- **Expected Response**: Processing acknowledgment + conversation_id

### **2. `batch_process`** - Multiple Lead Processing
- **When**: Bulk processing operations or scheduled batch runs
- **Payload**: Multiple leads in `leadProcessingQueue` array  
- **Expected Response**: Batch processing acknowledgment

### **3. `queue_complete`** - Queue Processing Complete
- **When**: All queued leads have been processed
- **Payload**: Summary of processed leads
- **Expected Response**: Completion acknowledgment

---

## 📨 **Expected Response Format**

### **Success Response**
```json
{
  "status": "success",
  "message": "Lead processing initiated",
  "data": {
    "conversation_id": "conv_789xyz",
    "workflow_id": "wf_automated_followup",
    "estimated_completion": "2025-01-29T11:00:00Z",
    "processing_node": "n8n_worker_01"
  }
}
```

### **Error Response**
```json
{
  "status": "error",
  "message": "Business hours restriction",
  "error_code": "OUTSIDE_BUSINESS_HOURS",
  "data": {
    "next_available_time": "2025-01-30T09:00:00Z",
    "retry_recommended": true
  }
}
```

---

## 🛡️ **Error Handling & Resilience**

### **QueueService Error Handling**
```typescript
// Webhook failures are NON-BLOCKING
try {
  const response = await fetch(webhookUrl, webhookPayload);
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
  
  console.log('✅ AgentDB webhook triggered successfully');
  
} catch (error) {
  console.error('❌ AgentDB webhook failed:', error);
  // 🔥 CRITICAL: Don't throw - webhook failure shouldn't break queue operations
  // Lead processing continues, webhook can be retried later
}
```

### **Retry Strategy**
- **Automatic Retry**: 3 attempts with exponential backoff
- **Retry Delays**: 30s, 2min, 10min
- **Failure Handling**: Queue operations continue regardless of webhook status
- **Status Tracking**: `webhook_status` field tracks delivery attempts

---

## 🔧 **Implementation in QueueService**

### **Webhook Trigger Points**
```typescript
// 1. Single Lead Processing
await QueueService.startProcessing();
// └─► Triggers: webhook(action: 'process_lead', single lead)

// 2. Batch Processing (if implemented)  
await QueueService.processBatch(leadIds);
// └─► Triggers: webhook(action: 'batch_process', multiple leads)

// 3. Queue Completion
await QueueService.completeQueue();
// └─► Triggers: webhook(action: 'queue_complete', summary)
```

### **Database Integration**
```sql
-- Webhook fields in lead_processing_queue table
ALTER TABLE lead_processing_queue ADD COLUMN 
  webhook_payload JSONB,           -- Sent payload
  webhook_response JSONB,          -- AgentDB response  
  webhook_status TEXT DEFAULT 'pending' CHECK (
    webhook_status IN ('pending', 'sent', 'success', 'failed')
  ),
  agent_trigger_id TEXT,           -- AgentDB workflow ID
  agent_conversation_id TEXT;      -- AgentDB conversation ID
```

---

## 🎯 **AgentDB Implementation Requirements**

### **Webhook Endpoint Must:**
1. ✅ **Accept POST requests** with JSON payload
2. ✅ **Validate authorization** header (Bearer token)
3. ✅ **Process action types**: `process_lead`, `batch_process`, `queue_complete`
4. ✅ **Extract lead data** from `leadProcessingQueue` array
5. ✅ **Respect business hours** from `userSettings`
6. ✅ **Return proper HTTP status codes** (200/400/500)
7. ✅ **Provide response data** with conversation/workflow IDs

### **Business Logic Integration**
```javascript
// Example AgentDB N8N Workflow
if (payload.action === 'process_lead') {
  const lead = payload.leadProcessingQueue[0];
  const businessHours = payload.userSettings.businessHours;
  
  // Check business hours
  if (!isWithinBusinessHours(businessHours)) {
    return { status: 'error', error_code: 'OUTSIDE_BUSINESS_HOURS' };
  }
  
  // Start AI conversation workflow
  const conversationId = await startWhatsAppConversation(lead);
  
  return { 
    status: 'success', 
    data: { conversation_id: conversationId }
  };
}
```

---

## 🔍 **Testing & Monitoring**

### **Webhook Testing**
```bash
# Test webhook endpoint
curl -X POST "https://imnyrhjdoaccxenxyfam.supabase.co/functions/v1/queue-trigger" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-service-key" \
  -d @webhook-test-payload.json
```

### **Monitoring Points**
- ✅ **Webhook Success Rate**: Track delivery success/failure
- ✅ **Response Times**: Monitor AgentDB processing speed
- ✅ **Error Patterns**: Identify common failure reasons
- ✅ **Business Hours Compliance**: Verify timing restrictions work

---

## 📊 **Status Dashboard Integration**

### **Queue Status with Webhook Data**
```typescript
interface QueueMetrics {
  // ... existing metrics ...
  
  // Webhook Integration Status
  webhookStatus: {
    successRate: number;          // % successful deliveries
    lastDelivery: Date;          // Most recent webhook call
    pendingWebhooks: number;     // Undelivered webhooks
    avgResponseTime: number;     // AgentDB response speed
  };
  
  // AgentDB Processing Status  
  agentProcessing: {
    activeConversations: number; // Ongoing AI chats
    completedToday: number;      // Finished conversations
    avgConversationTime: number; // Time to completion
  };
}
```

---

## 🚀 **Benefits of This Design**

### **For OvenAI Queue System:**
- ✅ **Decoupled Architecture**: Queue works independently of AgentDB
- ✅ **Failure Resilience**: Webhook failures don't break lead processing
- ✅ **Comprehensive Context**: AgentDB gets all necessary lead data
- ✅ **Status Tracking**: Full visibility into webhook delivery

### **For AgentDB System:**
- ✅ **Rich Context**: Complete lead data + user settings in single call
- ✅ **Business Logic Ready**: Business hours, rate limits pre-configured
- ✅ **Flexible Processing**: Can handle single leads or batches
- ✅ **Implementation Freedom**: Any backend can implement the interface

### **For Future Scalability:**
- ✅ **Backend Agnostic**: Easy to switch from N8N to any other system
- ✅ **Multiple Providers**: Could send to multiple AI services
- ✅ **A/B Testing**: Route different leads to different processors
- ✅ **Load Balancing**: Distribute leads across multiple AgentDB instances

---

## 📝 **Implementation Checklist**

### **OvenAI (Site DB) Side:**
- ✅ QueueService webhook integration
- ✅ Database schema with webhook fields  
- ✅ Error handling & retry logic
- ✅ Status tracking & monitoring
- ✅ Comprehensive payload construction

### **AgentDB Side (To Be Implemented):**
- ⏳ Webhook endpoint creation
- ⏳ Payload parsing & validation  
- ⏳ Business hours compliance
- ⏳ N8N workflow integration
- ⏳ Response format standardization
- ⏳ Error handling & status codes

---

## 🎯 **Next Steps**

1. **Test Current Implementation**: Verify QueueService webhook calls work
2. **AgentDB Endpoint**: Implement webhook receiver in AgentDB
3. **End-to-End Testing**: Test complete lead processing flow
4. **Monitoring Setup**: Dashboard for webhook success rates
5. **Documentation**: AgentDB team webhook implementation guide

**🔥 The queue system is now ready for AgentDB integration!** 