/**
 * Generate Mock Data for User
 * Usage: node generate-mock-data.js [USER_ID] [EMAIL]
 * 
 * Creates complete mock data set for a user:
 * - 1 client company
 * - 2 projects
 * - 6 leads
 * - 2 conversations
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadCredentials() {
  const localCredsPath = path.join(__dirname, 'supabase-credentials.local');
  const localContent = fs.readFileSync(localCredsPath, 'utf8');
  const localCreds = {};
  
  localContent.split('\n').forEach(line => {
    if (line.startsWith('SUPABASE_URL=')) {
      localCreds.url = line.split('=')[1];
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      localCreds.serviceKey = line.split('=')[1];
    }
  });
  
  return localCreds;
}

// Mock data templates
const projectTypes = [
  'Real Estate Development',
  'Property Management',
  'Residential Sales',
  'Commercial Leasing',
  'Investment Portfolio',
  'Property Renovation'
];

const leadSources = [
  'Website Contact',
  'Referral',
  'Social Media',
  'Cold Outreach',
  'Trade Show',
  'Partner Network'
];

const leadTemperatures = ['Cold', 'Cool', 'Warm', 'Hot', 'Scheduled'];

function generateRandomPhone() {
  return `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function generateRandomAddress() {
  const streets = ['Main St', 'Oak Ave', 'Pine Dr', 'Cedar Ln', 'Maple Ct', 'Elm Way'];
  const number = Math.floor(Math.random() * 9999) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  return `${number} ${street}, Demo City, DC 12345`;
}

async function generateMockDataForUser(userId, userEmail) {
  try {
    console.log('🎲 GENERATING MOCK DATA FOR USER');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${userEmail}`);
    
    const creds = loadCredentials();
    const supabase = createClient(creds.url, creds.serviceKey);
    
    const companyName = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
    const timestamp = new Date().toISOString();
    
    // 1. Create Mock Client
    console.log('\n🏢 Creating mock client company...');
    
    const { data: mockClient, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: `${companyName} Company`,
        email: userEmail,
        phone: generateRandomPhone(),
        address: generateRandomAddress(),
        status: 'active',
        notes: `Demo client created for user ${userEmail}. This is mock data for testing purposes.`,
        created_at: timestamp,
        updated_at: timestamp
      })
      .select()
      .single();

    if (clientError) {
      throw new Error(`Mock client creation failed: ${clientError.message}`);
    }

    console.log(`✅ Created client: ${mockClient.name} (ID: ${mockClient.id})`);

    // 2. Create Mock Projects
    console.log('\n📁 Creating mock projects...');
    
    const mockProjects = [];
    for (let i = 1; i <= 2; i++) {
      const projectType = projectTypes[Math.floor(Math.random() * projectTypes.length)];
      
      const { data: mockProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: `${projectType} Project ${i}`,
          description: `This is demo project ${i} for ${mockClient.name}. A ${projectType.toLowerCase()} initiative with mock data for testing and development purposes.`,
          client_id: mockClient.id,
          status: i === 1 ? 'active' : 'planning',
          budget: Math.floor(Math.random() * 500000) + 100000, // $100k - $600k
          start_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in last 30 days
          end_date: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Random date in next 6 months
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (!projectError) {
        mockProjects.push(mockProject);
        console.log(`✅ Created project: ${mockProject.name}`);
      } else {
        console.warn(`⚠️  Project ${i} creation failed: ${projectError.message}`);
      }
    }

    // 3. Create Mock Leads
    console.log('\n👥 Creating mock leads...');
    
    const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    
    const mockLeads = [];
    let leadCount = 0;
    
    for (const project of mockProjects) {
      for (let i = 1; i <= 3; i++) {
        leadCount++;
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const leadEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@demo-lead.local`;
        
        const { data: mockLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: leadEmail,
            phone: generateRandomPhone(),
            project_id: project.id,
            status: Math.floor(Math.random() * 6), // Random status 0-5
            temperature: leadTemperatures[Math.floor(Math.random() * leadTemperatures.length)],
            source: leadSources[Math.floor(Math.random() * leadSources.length)],
            notes: `Demo lead ${leadCount} for ${project.name}. This is mock data generated for user ${userEmail}.`,
            budget: Math.floor(Math.random() * 100000) + 10000, // $10k - $110k
            created_at: timestamp,
            updated_at: timestamp
          })
          .select()
          .single();

        if (!leadError) {
          mockLeads.push(mockLead);
        } else {
          console.warn(`⚠️  Lead creation failed: ${leadError.message}`);
        }
      }
    }

    console.log(`✅ Created ${mockLeads.length} mock leads`);

    // 4. Create Mock Conversations (for first 2 leads only)
    console.log('\n💬 Creating mock conversations...');
    
    const mockConversations = [];
    for (const lead of mockLeads.slice(0, 2)) {
      const { data: mockConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          lead_id: lead.id,
          status: 'active',
          created_at: timestamp,
          updated_at: timestamp
        })
        .select()
        .single();

      if (!convError) {
        mockConversations.push(mockConversation);
      } else {
        console.warn(`⚠️  Conversation creation failed: ${convError.message}`);
      }
    }

    console.log(`✅ Created ${mockConversations.length} mock conversations`);

    // 5. Summary
    const summary = {
      user_id: userId,
      user_email: userEmail,
      generated_at: timestamp,
      mock_data: {
        client: mockClient,
        projects: mockProjects,
        leads: mockLeads,
        conversations: mockConversations
      },
      counts: {
        clients: 1,
        projects: mockProjects.length,
        leads: mockLeads.length,
        conversations: mockConversations.length
      }
    };

    console.log('\n📊 MOCK DATA GENERATION SUMMARY:');
    console.log('─────────────────────────────────────────────────────');
    console.log(`✅ Client: ${summary.mock_data.client.name}`);
    console.log(`✅ Projects: ${summary.counts.projects}`);
    console.log(`✅ Leads: ${summary.counts.leads}`);
    console.log(`✅ Conversations: ${summary.counts.conversations}`);
    console.log('');
    console.log('🎯 WHAT THE USER WILL SEE:');
    console.log(`   - Company: ${summary.mock_data.client.name}`);
    console.log(`   - Active projects with realistic timelines`);
    console.log(`   - Leads with various temperatures and sources`);
    console.log(`   - Conversations ready for messaging interface`);
    
    return summary;

  } catch (error) {
    console.error('❌ Mock data generation failed:', error.message);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('📋 USAGE:');
    console.log('node generate-mock-data.js [USER_ID] [EMAIL]');
    console.log('');
    console.log('Examples:');
    console.log('node generate-mock-data.js "123e4567-e89b-12d3-a456-426614174000" "john@example.com"');
    console.log('node generate-mock-data.js "456e7890-e89b-12d3-a456-426614174000" "demo@company.com"');
    console.log('');
    console.log('This will create:');
    console.log('- 1 client company based on email');
    console.log('- 2 projects with realistic details');
    console.log('- 6 leads with contact info and status');
    console.log('- 2 conversations for testing messaging');
    process.exit(1);
  }
  
  const [userId, userEmail] = args;
  
  try {
    const summary = await generateMockDataForUser(userId, userEmail);
    console.log('\n🎉 MOCK DATA GENERATION COMPLETE!');
    console.log('\nUser can now login and see:');
    console.log('- Their company data');
    console.log('- Active projects');
    console.log('- Leads to manage');
    console.log('- Conversations to test');
  } catch (error) {
    console.error('\n❌ OPERATION FAILED:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
export { generateMockDataForUser };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 