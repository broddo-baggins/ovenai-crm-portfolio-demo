# 🎬 WhatsApp Take Lead - Manual Demo Guide for App Review

This guide helps demonstrate the "Take Lead" functionality for the Meta WhatsApp Business app review.

## 🎯 What the Reviewers Need to See

Meta wants to see:
1. **Template Management** - Creating and managing WhatsApp templates
2. **Send First Message** - Actually sending a WhatsApp message from the UI
3. **Lead Takeover** - Agent taking over from AI automation

---

## 📋 Pre-Demo Checklist

### ✅ Environment Setup
- [ ] App running at `http://localhost:3000`
- [ ] Logged in as `test@test.test` / `testtesttest`
- [ ] WhatsApp credentials configured in `.env.local`
- [ ] At least 1 lead in the system
- [ ] Screen recording software ready

### ✅ WhatsApp Requirements
- [ ] WhatsApp Business account verified
- [ ] At least 1 approved template (e.g., `hello_world`)
- [ ] Test phone number approved for messaging
- [ ] Access token and phone number ID configured

---

## 🎬 Demo Script (5-7 minutes)

### **1. Template Management Demo (2 minutes)**

1. **Navigate to Lead Pipeline**
   ```
   1. Go to /lead-pipeline
   2. Click "WhatsApp Manager" tab
   3. Show the Template Manager interface
   ```

2. **Show Template Features**
   ```
   - Point out existing templates
   - Click "Create New Template" 
   - Show the template creation form
   - Explain approval process
   - Close dialog (don't actually create)
   ```

### **2. Take Lead Demo (3-4 minutes)**

1. **Navigate to Leads Page**
   ```
   1. Go to /leads
   2. Show the leads list with data
   3. Point out "Take Lead" buttons
   ```

2. **Execute Take Lead Workflow**
   ```
   1. Click "Take Lead" button on any lead
   2. Dialog opens - explain the purpose
   3. Select an approved template (e.g., hello_world)
   4. Enter a valid phone number (must be approved)
   5. Click "Take Lead & Send"
   ```

3. **Show Success & Impact**
   ```
   1. Success toast appears
   2. Lead status changes to "contacted"
   3. Conversation record is created
   4. Show the lead is now "taken over" by agent
   ```

### **3. Integration Status Demo (1 minute)**

1. **Show WhatsApp Integration**
   ```
   1. Navigate to WhatsApp setup/diagnostics
   2. Show configuration status
   3. Demonstrate API connectivity
   ```

---

## 🗣️ Key Talking Points

### **Business Value**
- "This allows our sales agents to take over cold leads from AI automation"
- "Templates ensure compliance with WhatsApp policies"
- "Personal touch increases conversion rates significantly"

### **Technical Integration**
- "Direct integration with WhatsApp Business API"
- "Template management follows Meta guidelines"
- "Automated lead status tracking and conversation logging"

### **User Experience**
- "One-click lead takeover with template selection"
- "Clear feedback on message delivery status"
- "Seamless transition from AI to human agent"

---

## 🎥 Recording Tips

### **What to Show**
- ✅ Clear navigation between pages
- ✅ Actual template selection and sending
- ✅ Success confirmations and status updates
- ✅ Professional UI with clear labeling
- ✅ Real data (not Lorem ipsum)

### **What to Avoid**
- ❌ Long loading times or errors
- ❌ Developer tools or console logs
- ❌ Test data that looks fake
- ❌ Rushed clicking without explanation
- ❌ Audio issues or background noise

---

## 🔧 Troubleshooting

### **If Take Lead Button Missing**
1. Check if leads exist in the system
2. Verify user permissions
3. Check console for JavaScript errors
4. Create a test lead manually

### **If Template Selection Fails**
1. Verify WhatsApp credentials in `.env.local`
2. Check approved templates in Meta Business Manager
3. Ensure template names match exactly
4. Test with `hello_world` template first

### **If Message Sending Fails**
1. Verify phone number is approved in Meta
2. Check WhatsApp access token validity
3. Ensure edge function is deployed
4. Check Supabase edge function logs

---

## 📞 Test Phone Numbers

Use these approved test numbers for demo:
- Your own WhatsApp number (if approved)
- WhatsApp test numbers from Meta Business Manager
- **Never** use random numbers in production

---

## 📊 Expected Results

After successful demo:
- ✅ Template management clearly visible
- ✅ Message actually sent via WhatsApp
- ✅ Lead status updated in real-time
- ✅ Professional user experience demonstrated
- ✅ Clear business value communicated

---

*Last Updated: [Current Date]*
*Prepared for: Meta WhatsApp Business API Review* 