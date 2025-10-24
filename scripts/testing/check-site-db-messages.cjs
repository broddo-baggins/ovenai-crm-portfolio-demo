const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

// Use Site DB credentials
const supabaseUrl = credentials.supabase.development.url;
const supabaseServiceRoleKey = credentials.supabase.development.service_role_key;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkSiteDBMessages() {
  console.log('🔍 CHECKING SITE DB MESSAGES AND CONVERSATIONS\n');
  console.log('Database:', supabaseUrl);
  console.log('='*60 + '\n');

  try {
    // 1. Check conversations table structure
    console.log('📊 CONVERSATIONS TABLE ANALYSIS:');
    const { data: conversationSample, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(5);

    if (convError) {
      console.log('❌ Error accessing conversations:', convError.message);
    } else {
      console.log(`✅ Found ${conversationSample?.length || 0} sample conversations`);
      
      if (conversationSample && conversationSample.length > 0) {
        console.log('\n📋 Sample conversation structure:');
        const sampleConv = conversationSample[0];
        console.log('Fields:', Object.keys(sampleConv).join(', '));
        
        // Count total conversations
        const { count: totalConvs } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });
        console.log(`\n📊 Total conversations in DB: ${totalConvs}`);
        
        // Count conversations with message content
        const { count: convWithContent } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .not('message_content', 'is', null);
        console.log(`📝 Conversations with message_content: ${convWithContent}`);
        
        // Count WhatsApp specific conversations
        const { count: whatsappConvs } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .or('sender_number.not.is.null,receiver_number.not.is.null,wamid.not.is.null');
        console.log(`📱 WhatsApp conversations (with phone numbers): ${whatsappConvs}`);
      }
    }

    // 2. Check whatsapp_messages view
    console.log('\n\n📊 WHATSAPP_MESSAGES VIEW ANALYSIS:');
    const { data: whatsappMessages, error: wmError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(5);

    if (wmError) {
      console.log('❌ Error accessing whatsapp_messages view:', wmError.message);
    } else {
      console.log(`✅ WhatsApp messages view accessible`);
      console.log(`📋 Sample messages found: ${whatsappMessages?.length || 0}`);
      
      if (whatsappMessages && whatsappMessages.length > 0) {
        console.log('\nSample WhatsApp message:');
        console.log(JSON.stringify(whatsappMessages[0], null, 2));
      }
    }

    // 3. Check messages table (if exists)
    console.log('\n\n📊 MESSAGES TABLE CHECK:');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(5);

    if (msgError) {
      if (msgError.message.includes('does not exist')) {
        console.log('❌ Messages table does not exist (expected - using conversations instead)');
      } else {
        console.log('❌ Error accessing messages table:', msgError.message);
      }
    } else {
      console.log(`✅ Messages table exists with ${messages?.length || 0} sample records`);
    }

    // 4. Check specific lead's conversations
    console.log('\n\n📊 CHECKING CONVERSATIONS FOR SPECIFIC LEADS:');
    
    // Get a sample lead with conversations
    const { data: leadWithConvs } = await supabase
      .from('conversations')
      .select('lead_id')
      .not('lead_id', 'is', null)
      .limit(1)
      .single();

    if (leadWithConvs) {
      console.log(`\n🔍 Checking conversations for lead: ${leadWithConvs.lead_id}`);
      
      const { data: leadConvs, count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact' })
        .eq('lead_id', leadWithConvs.lead_id)
        .order('created_at', { ascending: false });

      console.log(`📊 Found ${count} conversations for this lead`);
      
      if (leadConvs && leadConvs.length > 0) {
        console.log('\nConversation details:');
        leadConvs.forEach((conv, idx) => {
          console.log(`\n${idx + 1}. Conversation ${conv.id}:`);
          console.log(`   - Message Type: ${conv.message_type || 'not set'}`);
          console.log(`   - Has Content: ${!!conv.message_content}`);
          console.log(`   - Sender Number: ${conv.sender_number || 'none'}`);
          console.log(`   - Direction: ${conv.direction || conv.message_type || 'unknown'}`);
          console.log(`   - Created: ${conv.created_at}`);
        });
      }
    }

    // 5. Test user access check
    console.log('\n\n📊 TEST USER ACCESS CHECK:');
    
    // Get test user ID
    const { data: testUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'test@test.test')
      .single();

    if (testUser) {
      console.log(`✅ Test user found: ${testUser.id}`);
      
      // Check client memberships
      const { data: clientMemberships } = await supabase
        .from('client_members')
        .select('client_id')
        .eq('user_id', testUser.id);
      
      console.log(`\n👥 Client memberships: ${clientMemberships?.length || 0}`);
      
      if (clientMemberships && clientMemberships.length > 0) {
        // Get accessible leads count
        const clientIds = clientMemberships.map(m => m.client_id);
        const { count: accessibleLeads } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('client_id', clientIds);
        
        console.log(`📋 Accessible leads through client membership: ${accessibleLeads}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSiteDBMessages(); 