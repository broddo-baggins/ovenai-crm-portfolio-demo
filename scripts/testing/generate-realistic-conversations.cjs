#!/usr/bin/env node

/**
 * 💬 REALISTIC CONVERSATION GENERATOR
 * 
 * Generates realistic WhatsApp conversations for test leads with:
 * - Natural conversation flow
 * - Hebrew/English content
 * - Scoring and sentiment analysis
 * - Multiple message exchanges
 * - Different conversation outcomes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

const supabaseUrl = credentials.supabase.development.url;
const supabaseKey = credentials.supabase.development.service_role_key;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('💬 REALISTIC CONVERSATION GENERATOR');
console.log('===================================');
console.log('Generating conversations for test leads...');
console.log('');

// Conversation templates and responses
const CONVERSATION_TEMPLATES = {
  // Hebrew business inquiries
  hebrew_business: [
    {
      sender: 'lead',
      content: 'שלום, ראיתי את המודעה שלכם ברשת. אני מעוניין לשמוע על השירותים שלכם.',
      sentiment: 'positive'
    },
    {
      sender: 'agent', 
      content: 'שלום! תודה שפנית אלינו. נשמח לעזור. איזה שירות עניין אותך במיוחד?',
      sentiment: 'positive'
    },
    {
      sender: 'lead',
      content: 'אני מחפש פתרון לניהול לקוחות לעסק שלי. יש לכם משהו מתאים?',
      sentiment: 'interested'
    },
    {
      sender: 'agent',
      content: 'בהחלט! יש לנו מערכת CRM מתקדמת שעוזרת לעסקים כמו שלך. מה גודל העסק? כמה לקוחות בערך?',
      sentiment: 'professional'
    },
    {
      sender: 'lead', 
      content: 'בערך 50-100 לקוחות חדשים בחודש. אני צריך משהו שיעזור לי לעקוב אחריהם.',
      sentiment: 'specific'
    }
  ],
  
  // English business inquiries
  english_business: [
    {
      sender: 'lead',
      content: 'Hi, I saw your ad online. Can you tell me more about your services?',
      sentiment: 'curious'
    },
    {
      sender: 'agent',
      content: 'Hello! Thanks for reaching out. We\'d love to help. What specific service were you interested in?',
      sentiment: 'welcoming'
    },
    {
      sender: 'lead',
      content: 'I need a better system to manage my customer relationships. Do you have something like that?',
      sentiment: 'problem_solving'
    },
    {
      sender: 'agent',
      content: 'Absolutely! Our CRM platform is perfect for growing businesses. What\'s your current setup like?',
      sentiment: 'solution_oriented'
    },
    {
      sender: 'lead',
      content: 'Right now I\'m using spreadsheets and it\'s getting messy. I need something more professional.',
      sentiment: 'frustrated_but_hopeful'
    }
  ],
  
  // Mixed Hebrew-English (common in Israel)
  mixed_language: [
    {
      sender: 'lead',
      content: 'Hi, אני רוצה לשמוע על ה-CRM שלכם',
      sentiment: 'direct'
    },
    {
      sender: 'agent',
      content: 'שלום! Our CRM system is great for Israeli businesses. איזה סוג עסק יש לך?',
      sentiment: 'adaptive'
    },
    {
      sender: 'lead',
      content: 'יש לי חברת marketing. אני צריך לעקוב אחרי leads וקמפיינים.',
      sentiment: 'specific_need'
    },
    {
      sender: 'agent',
      content: 'Perfect! המערכת שלנו תומכת בניהול campaigns and lead tracking. Want to schedule a demo?',
      sentiment: 'confident'
    }
  ],
  
  // Qualified lead conversations
  qualified_conversations: [
    {
      sender: 'lead',
      content: 'We\'ve been looking for a CRM solution for our company. What are your pricing options?',
      sentiment: 'buying_intent'
    },
    {
      sender: 'agent',
      content: 'Great question! Our pricing depends on team size and features. How many users would you need?',
      sentiment: 'qualifying'
    },
    {
      sender: 'lead',
      content: 'About 10-15 users. We need full sales pipeline management and reporting.',
      sentiment: 'informed_buyer'
    },
    {
      sender: 'agent',
      content: 'Perfect fit! For 15 users with advanced features, it would be $150/month. Shall we set up a demo?',
      sentiment: 'closing'
    },
    {
      sender: 'lead',
      content: 'That sounds reasonable. Yes, let\'s schedule a demo for next week.',
      sentiment: 'committed'
    }
  ]
};

// Sentiment scores and conversation context
const SENTIMENT_MAPPING = {
  'positive': { score: 0.8, temperature: 'warm' },
  'negative': { score: -0.6, temperature: 'cold' },
  'neutral': { score: 0.1, temperature: 'cool' },
  'interested': { score: 0.7, temperature: 'warm' },
  'frustrated_but_hopeful': { score: 0.3, temperature: 'cool' },
  'buying_intent': { score: 0.9, temperature: 'hot' },
  'committed': { score: 0.95, temperature: 'hot' },
  'curious': { score: 0.6, temperature: 'warm' },
  'professional': { score: 0.8, temperature: 'warm' },
  'welcoming': { score: 0.9, temperature: 'warm' },
  'solution_oriented': { score: 0.85, temperature: 'warm' },
  'qualifying': { score: 0.7, temperature: 'warm' },
  'closing': { score: 0.9, temperature: 'hot' },
  'specific': { score: 0.75, temperature: 'warm' },
  'informed_buyer': { score: 0.85, temperature: 'hot' }
};

async function getLeadsNeedingConversations() {
  console.log('🔍 Finding leads that need conversations...');
  
  try {
    // Get leads that have biblical Hebrew names
    const { data: leads, error } = await supabase
      .from('leads')
      .select(`
        id, first_name, last_name, phone, status, state,
        lead_metadata, current_project_id
      `)
      .eq('current_project_id', '2ba26935-4cdf-42b1-8d36-a6f57308b632') // Oven Project
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('❌ Error fetching leads:', error.message);
      return [];
    }
    
    // Filter to biblical Hebrew leads
    let hebrewLeads = leads?.filter(lead => {
      const hasBiblicalMetadata = lead.lead_metadata?.name_origin === 'biblical_hebrew';
      return hasBiblicalMetadata;
    }) || [];
    
    // Check which leads already have conversations
    const leadsWithoutConversations = [];
    for (const lead of hebrewLeads) {
      const { data: existingConversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('lead_id', lead.id)
        .limit(1);
      
      if (!existingConversations || existingConversations.length === 0) {
        leadsWithoutConversations.push(lead);
      }
    }
    
    hebrewLeads = leadsWithoutConversations;
    
    console.log(`📊 Found ${hebrewLeads.length} biblical Hebrew leads without conversations`);
    return hebrewLeads;
    
  } catch (error) {
    console.error('💥 Error fetching leads:', error);
    return [];
  }
}

function selectConversationTemplate(lead) {
  // Choose conversation type based on lead characteristics
  const templates = Object.keys(CONVERSATION_TEMPLATES);
  const leadStatus = lead.status || 'new';
  const leadState = lead.state || 'new';
  
  // Higher chance for qualified conversations if lead is qualified
  if (['qualified', 'consideration', 'interest'].includes(leadStatus)) {
    return Math.random() < 0.6 ? 'qualified_conversations' : 'english_business';
  }
  
  // Mix of templates for realistic variety
  const random = Math.random();
  if (random < 0.4) return 'hebrew_business';
  if (random < 0.7) return 'english_business';
  if (random < 0.9) return 'mixed_language';
  return 'qualified_conversations';
}

function generateConversationFlow(template, lead) {
  const baseFlow = CONVERSATION_TEMPLATES[template];
  const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Add some natural variations
  let messages = [...baseFlow];
  
  // Sometimes add extra exchanges
  if (Math.random() < 0.3) {
    messages.push({
      sender: 'agent',
      content: 'Is there anything else you\'d like to know about our solution?',
      sentiment: 'helpful'
    });
    
    messages.push({
      sender: 'lead', 
      content: 'That covers everything for now. Thank you!',
      sentiment: 'satisfied'
    });
  }
  
  return { conversationId, messages };
}

async function createConversationMessages(lead, conversationFlow) {
  const { conversationId, messages } = conversationFlow;
  const leadPhone = lead.phone || '+972501234567';
  const agentPhone = '+972501234568'; // Our business number
  
  let conversationContext = {
    lead_temperature: 'cool',
    interaction_stage: 'initial',
    intent_detected: 'business_inquiry',
    sentiment_trend: [],
    bant_score: { budget: 0, authority: 0, need: 0, timeline: 0 },
    next_action: 'follow_up'
  };
  
  let validationContext = {
    message_count: messages.length,
    response_rate: 1.0,
    engagement_score: 0.8,
    qualification_signals: [],
    risk_flags: []
  };
  
  const conversationRecords = [];
  let baseTimestamp = new Date();
  
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const isFromLead = message.sender === 'lead';
    
    // Add realistic time gaps between messages
    if (i > 0) {
      const delay = Math.random() * 300 + 30; // 30 seconds to 5 minutes
      baseTimestamp = new Date(baseTimestamp.getTime() + delay * 1000);
    }
    
    // Update conversation context based on sentiment
    const sentimentData = SENTIMENT_MAPPING[message.sentiment] || SENTIMENT_MAPPING['neutral'];
    conversationContext.sentiment_trend.push({
      message_index: i,
      sentiment: message.sentiment,
      score: sentimentData.score
    });
    
    // Update lead temperature
    if (sentimentData.temperature === 'hot' && conversationContext.lead_temperature !== 'hot') {
      conversationContext.lead_temperature = 'hot';
    } else if (sentimentData.temperature === 'warm' && conversationContext.lead_temperature === 'cool') {
      conversationContext.lead_temperature = 'warm';
    }
    
    // Detect BANT signals
    if (message.content.toLowerCase().includes('price') || message.content.includes('pricing')) {
      conversationContext.bant_score.budget += 0.3;
    }
    if (message.content.toLowerCase().includes('demo') || message.content.includes('meeting')) {
      conversationContext.bant_score.timeline += 0.4;
    }
    if (message.content.toLowerCase().includes('need') || message.content.includes('looking for')) {
      conversationContext.bant_score.need += 0.4;
    }
    if (message.content.toLowerCase().includes('decision') || message.content.includes('team')) {
      conversationContext.bant_score.authority += 0.3;
    }
    
    const conversationRecord = {
      id: `${conversationId}-msg-${i}`,
      lead_id: lead.id,
      message_content: message.content,
      sender_number: isFromLead ? leadPhone : agentPhone,
      receiver_number: isFromLead ? agentPhone : leadPhone,
      message_type: isFromLead ? 'incoming' : 'outgoing',
      status: 'delivered',
      timestamp: baseTimestamp.toISOString(),
      wa_timestamp: baseTimestamp.toISOString(),
      conversation_context: { ...conversationContext },
      validation_context: { ...validationContext },
      metadata: {
        conversation_id: conversationId,
        message_index: i,
        sentiment: message.sentiment,
        sentiment_score: sentimentData.score,
        auto_generated: true,
        generation_timestamp: new Date().toISOString()
      },
      created_at: baseTimestamp.toISOString(),
      updated_at: baseTimestamp.toISOString()
    };
    
    conversationRecords.push(conversationRecord);
  }
  
  return conversationRecords;
}

async function insertConversations(conversationRecords) {
  console.log(`💾 Inserting ${conversationRecords.length} conversation messages...`);
  
  let insertedCount = 0;
  const batchSize = 5;
  
  for (let i = 0; i < conversationRecords.length; i += batchSize) {
    const batch = conversationRecords.slice(i, i + batchSize);
    
    try {
      const { error } = await supabase
        .from('conversations')
        .insert(batch);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
      } else {
        insertedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Inserted ${batch.length} messages`);
      }
    } catch (err) {
      console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, err.message);
    }
  }
  
  return insertedCount;
}

async function updateLeadWithConversationData(lead, conversationFlow) {
  // Update lead with conversation insights
  const { messages } = conversationFlow;
  const lastMessage = messages[messages.length - 1];
  const sentimentData = SENTIMENT_MAPPING[lastMessage.sentiment] || SENTIMENT_MAPPING['neutral'];
  
  const updates = {
    interaction_count: messages.length,
    last_interaction: new Date().toISOString(),
    state_status_metadata: {
      ...lead.state_status_metadata,
      conversation_generated: true,
      final_sentiment: lastMessage.sentiment,
      engagement_level: sentimentData.temperature,
      message_count: messages.length
    }
  };
  
  // Update status based on conversation outcome
  if (sentimentData.temperature === 'hot') {
    updates.status = 'qualified';
    updates.state = 'consideration';
  } else if (sentimentData.temperature === 'warm') {
    updates.status = 'interested';
    updates.state = 'awareness';
  }
  
  try {
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', lead.id);
    
    if (error) {
      console.error(`❌ Error updating lead ${lead.id}:`, error.message);
    } else {
      console.log(`✅ Updated lead ${lead.first_name} ${lead.last_name} with conversation data`);
    }
  } catch (err) {
    console.error(`❌ Exception updating lead ${lead.id}:`, err.message);
  }
}

async function generateConversationsForLeads(leads) {
  console.log(`\n💬 Generating conversations for ${leads.length} leads...`);
  
  let totalConversations = 0;
  let totalMessages = 0;
  
  for (const lead of leads) {
    try {
      console.log(`\n👤 Processing ${lead.first_name} ${lead.last_name}...`);
      
      // Select conversation template
      const templateName = selectConversationTemplate(lead);
      console.log(`   Template: ${templateName}`);
      
      // Generate conversation flow
      const conversationFlow = generateConversationFlow(templateName, lead);
      console.log(`   Messages: ${conversationFlow.messages.length}`);
      
      // Create conversation records
      const conversationRecords = await createConversationMessages(lead, conversationFlow);
      
      // Insert conversations
      const insertedCount = await insertConversations(conversationRecords);
      
      // Update lead with conversation data
      await updateLeadWithConversationData(lead, conversationFlow);
      
      if (insertedCount > 0) {
        totalConversations++;
        totalMessages += insertedCount;
        console.log(`   ✅ Created conversation with ${insertedCount} messages`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error);
    }
  }
  
  return { totalConversations, totalMessages };
}

async function main() {
  try {
    // Get leads needing conversations
    const leads = await getLeadsNeedingConversations();
    
    if (leads.length === 0) {
      console.log('🎉 All biblical Hebrew leads already have conversations!');
      return;
    }
    
    // Generate conversations
    const { totalConversations, totalMessages } = await generateConversationsForLeads(leads);
    
    console.log('\n📊 CONVERSATION GENERATION COMPLETE');
    console.log('=====================================');
    console.log(`✅ Conversations created: ${totalConversations}`);
    console.log(`💬 Total messages generated: ${totalMessages}`);
    console.log(`📱 Leads processed: ${leads.length}`);
    console.log('');
    console.log('🎯 Features added to each conversation:');
    console.log('   • Realistic Hebrew/English content');
    console.log('   • Sentiment analysis & scoring');
    console.log('   • BANT qualification signals');
    console.log('   • Lead temperature tracking');
    console.log('   • Natural conversation flow');
    console.log('   • WhatsApp metadata');
    console.log('');
    console.log('🚀 Your test leads now have realistic conversation history!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
} 