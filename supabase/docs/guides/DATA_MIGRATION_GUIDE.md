# 🚀 DATA MIGRATION GUIDE
## Copy Real Production Data from Master Database to Local

### 📊 **WHAT YOU'RE GETTING**
- **499 real customer conversations** from the master database
- **1,296 real WhatsApp messages** from production
- Complete conversation history with metadata
- WhatsApp webhook data and message details

### 🎯 **CURRENT STATUS**
- ❌ **Conversations**: 0 in local database *(499 available in master)*
- ❌ **WhatsApp Messages**: 0 in local database *(1,296 available in master)*
- 🔄 **Ready to migrate**: Complete production dataset

---

## 🚀 **QUICK START - RUN COMPLETE MIGRATION**

### Option 1: One-Command Migration (Recommended)
```bash
# Run complete migration (all steps)
node supabase/migration-scripts/run-complete-migration.js
```

This will:
1. Create conversations table in your local database
2. Copy 499 conversations from master to local
3. Create whatsapp_messages table in your local database  
4. Copy 1,296 WhatsApp messages from master to local

### Option 2: Step-by-Step Migration
```bash
# Step 1: Create conversations table
node supabase/migration-scripts/01-create-conversations-table.js

# Step 2: Migrate conversations data
node supabase/migration-scripts/02-migrate-conversations-data.js

# Step 3: Create WhatsApp messages table
node supabase/migration-scripts/03-create-whatsapp-messages-table.js

# Step 4: Migrate WhatsApp messages data
node supabase/migration-scripts/04-migrate-whatsapp-messages-data.js
```

---

## 📋 **WHAT HAPPENS DURING MIGRATION**

### ✅ **Safe Operations** (What the scripts do)
- **Read-only access** to master database (no changes to production)
- **Batch processing** for stability (50 records at a time)
- **Duplicate handling** with upsert (safe to re-run)
- **Error recovery** with individual retries
- **Progress tracking** with detailed logs

### 🛡️ **Safety Guarantees**
- ✅ **No changes to master database** - read-only access only
- ✅ **No data loss** - upsert prevents duplicates
- ✅ **Retryable** - safe to run multiple times
- ✅ **Reversible** - local data can be cleared if needed

---

## 📊 **AFTER MIGRATION - WHAT YOU'LL SEE**

### In Your Supabase Interface:
1. **conversations table** with 499 real conversations
2. **whatsapp_messages table** with 1,296 real messages
3. Complete conversation history linked to leads
4. Real customer interaction data

### Sample Data Structure:

#### Conversations Table (499 records)
```javascript
{
  id: "uuid",
  lead_id: "uuid", 
  message_content: "Real customer message content",
  timestamp: "2024-01-15T10:30:00Z",
  metadata: { /* conversation metadata */ },
  message_id: "msg_123",
  message_type: "text",
  status: "active"
}
```

#### WhatsApp Messages Table (1,296 records)
```javascript
{
  id: "uuid",
  sender_number: "+1234567890",
  content: "Real WhatsApp message content", 
  wamid: "wamid.xyz123",
  payload: { /* WhatsApp webhook payload */ },
  phone_number_id: "123456789",
  message_type: "text",
  status: "received"
}
```

---

## 🔧 **TROUBLESHOOTING**

### If migration fails:
1. **Check credentials**: Ensure both `master-db-credentials.local` and `supabase-credentials.local` exist
2. **Run individual steps**: Use step-by-step migration to isolate issues
3. **Check Supabase connection**: Verify your local database is accessible
4. **Re-run safely**: All scripts use upsert - safe to retry

### Common issues:
- **Table doesn't exist**: Run table creation scripts first
- **Connection timeout**: Run again - uses batch processing for stability
- **Duplicate key errors**: Normal - scripts handle duplicates automatically

---

## 🎯 **VERIFICATION**

After migration, verify in your Supabase interface:

1. **Go to your Supabase dashboard**
2. **Table Editor → conversations** - should show 499 records
3. **Table Editor → whatsapp_messages** - should show 1,296 records
4. **Check sample data** - real customer conversation content

---

## 📈 **NEXT STEPS AFTER MIGRATION**

Once you have the real data:

1. **✅ Update your UI components** to display real conversations
2. **✅ Test with production data** instead of mock data
3. **✅ Build conversation views** with actual customer messages
4. **✅ Implement WhatsApp message display** with real message history
5. **✅ Connect leads to conversations** using real relationships

---

## 🚨 **IMPORTANT NOTES**

- **Read-only master access**: Scripts never modify the master database
- **Production data**: You're working with real customer conversations
- **Privacy**: Handle real customer data responsibly
- **Testing**: Perfect for development with real data patterns

---

## 🎊 **SUCCESS CONFIRMATION**

After successful migration, you'll see:
```
🎉 MIGRATION PROCESS COMPLETE
═══════════════════════════════════════════════════════════════
✅ Completed steps: 4/4
❌ Failed steps: 0/4

🎊 ALL MIGRATIONS SUCCESSFUL!
🔄 Your local database now contains:
   • All conversations from the master database
   • All WhatsApp messages from the master database  
   • Complete production data for development

🎯 Mission accomplished: You now have access to real customer data!
```

**Ready to migrate? Run:**
```bash
node supabase/migration-scripts/run-complete-migration.js
``` 