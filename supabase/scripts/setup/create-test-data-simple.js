#!/usr/bin/env node

// Simple Test Data Creator
// This script creates test data using proper UUIDs and bypasses trigger issues

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';

// Load credentials from local file
const credentialsPath = '../../supabase-credentials.local';
let credentials;

try {
  const credentialsContent = readFileSync(credentialsPath, 'utf8');
  credentials = {};
  
  credentialsContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      credentials[key.trim()] = value.trim();
    }
  });
  
  console.log('✅ Credentials loaded successfully');
} catch (error) {
  console.error('❌ Failed to load credentials:', error.message);
  process.exit(1);
}

// Create Supabase admin client
const supabaseUrl = credentials.SUPABASE_URL;
const serviceRoleKey = credentials.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('\n🚀 Creating Simple Test Data\n');

async function createTestData() {
  try {
    console.log('🏢 Creating test clients...');
    
    // Create clients with simple structure (no triggers)
    const clientsToCreate = [
      { name: "Acme Corporation", description: "Leading technology solutions", status: "ACTIVE" },
      { name: "Tech Solutions Inc", description: "Innovative software development", status: "ACTIVE" },
      { name: "Global Industries", description: "International manufacturing", status: "ACTIVE" }
    ];
    
    const createdClients = [];
    
    for (const clientData of clientsToCreate) {
      try {
        // Use direct SQL to bypass triggers
        const { data, error } = await supabaseAdmin.rpc('create_client_simple', {
          client_name: clientData.name,
          client_description: clientData.description,
          client_status: clientData.status
        });
        
        if (error) {
          // If RPC doesn't exist, try direct insert
          console.log('Trying direct insert...');
          const { data: directData, error: directError } = await supabaseAdmin
            .from('clients')
            .insert(clientData)
            .select()
            .single();
          
          if (directError) {
            console.log(`⚠️  Client creation failed: ${directError.message}`);
            // Try without triggers by using a minimal insert
            console.log('Trying minimal insert...');
            const minimalClient = { name: clientData.name };
            const { data: minData, error: minError } = await supabaseAdmin
              .from('clients')
              .insert(minimalClient)
              .select()
              .single();
            
            if (!minError && minData) {
              createdClients.push(minData);
              console.log(`✅ Created client (minimal): ${minData.name}`);
            } else {
              console.log(`❌ All insert methods failed for: ${clientData.name}`);
            }
          } else {
            createdClients.push(directData);
            console.log(`✅ Created client: ${directData.name}`);
          }
        } else {
          createdClients.push(data);
          console.log(`✅ Created client via RPC: ${data.name}`);
        }
      } catch (error) {
        console.log(`❌ Error creating client ${clientData.name}: ${error.message}`);
      }
    }
    
    if (createdClients.length === 0) {
      console.log('\n⚠️  No clients created due to database constraints');
      console.log('💡 Recommendation: Use Supabase dashboard to manually insert data');
      return {
        clients: [],
        projects: [],
        leads: []
      };
    }
    
    console.log(`\n📁 Creating projects for ${createdClients.length} clients...`);
    const createdProjects = [];
    
    for (const client of createdClients) {
      const projectData = {
        name: `Website Redesign - ${client.name}`,
        description: "Complete website overhaul project",
        client_id: client.id,
        status: "active"
      };
      
      try {
        const { data: project, error } = await supabaseAdmin
          .from('projects')
          .insert(projectData)
          .select()
          .single();
        
        if (error) {
          console.log(`⚠️  Project creation failed: ${error.message}`);
        } else {
          createdProjects.push(project);
          console.log(`✅ Created project: ${project.name}`);
        }
      } catch (error) {
        console.log(`❌ Error creating project: ${error.message}`);
      }
    }
    
    console.log(`\n📋 Creating leads for ${createdProjects.length} projects...`);
    const createdLeads = [];
    
    for (const project of createdProjects) {
      const leadsData = [
        {
          project_id: project.id,
          first_name: "John",
          last_name: "Smith",
          email: `john.smith.${Date.now()}@example.com`,
          phone: "+1234567890",
          status: "new",
          source: "website"
        },
        {
          project_id: project.id,
          first_name: "Sarah",
          last_name: "Johnson",
          email: `sarah.johnson.${Date.now()}@example.com`,
          phone: "+1234567891",
          status: "converted",
          source: "referral"
        }
      ];
      
      for (const leadData of leadsData) {
        try {
          const { data: lead, error } = await supabaseAdmin
            .from('leads')
            .insert(leadData)
            .select()
            .single();
          
          if (error) {
            console.log(`⚠️  Lead creation failed: ${error.message}`);
          } else {
            createdLeads.push(lead);
            console.log(`✅ Created lead: ${lead.first_name} ${lead.last_name}`);
          }
        } catch (error) {
          console.log(`❌ Error creating lead: ${error.message}`);
        }
      }
    }
    
    // Summary
    console.log('\n🎉 Test Data Creation Summary');
    console.log('═'.repeat(40));
    console.log(`📊 Results:`);
    console.log(`   • Clients: ${createdClients.length}`);
    console.log(`   • Projects: ${createdProjects.length}`);
    console.log(`   • Leads: ${createdLeads.length}`);
    
    return {
      clients: createdClients,
      projects: createdProjects,
      leads: createdLeads
    };
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
    return {
      clients: [],
      projects: [],
      leads: []
    };
  }
}

async function testDataAccess() {
  console.log('\n🔍 Testing Data Access...');
  
  try {
    // Test fetching all data
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*');
    
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*');
    
    const { data: leads, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*');
    
    console.log('📊 Current Database Contents:');
    console.log(`   • Clients: ${clients?.length || 0} records`);
    console.log(`   • Projects: ${projects?.length || 0} records`);
    console.log(`   • Leads: ${leads?.length || 0} records`);
    
    // Test relationship queries
    if (clients && clients.length > 0) {
      console.log('\n🔗 Testing relationship queries...');
      
      const { data: clientsWithProjects, error: relationError } = await supabaseAdmin
        .from('clients')
        .select(`
          *,
          projects:projects(
            *,
            leads:leads(*)
          )
        `);
      
      if (relationError) {
        console.log(`⚠️  Relationship query failed: ${relationError.message}`);
      } else {
        console.log('✅ Relationship queries working');
        
        // Show sample relationship data
        if (clientsWithProjects && clientsWithProjects[0]) {
          const sample = clientsWithProjects[0];
          console.log(`🔍 Sample client data structure:`);
          console.log(`   • Client: ${sample.name}`);
          console.log(`   • Projects: ${sample.projects?.length || 0}`);
          if (sample.projects && sample.projects[0]) {
            console.log(`   • Leads in first project: ${sample.projects[0].leads?.length || 0}`);
          }
        }
      }
    }
    
    return {
      clients: clients || [],
      projects: projects || [],
      leads: leads || []
    };
    
  } catch (error) {
    console.log(`❌ Data access test failed: ${error.message}`);
    return { clients: [], projects: [], leads: [] };
  }
}

async function main() {
  // First, check what data already exists
  const existingData = await testDataAccess();
  
  if (existingData.clients.length > 0) {
    console.log('\n💡 Database already contains data. Skipping creation.');
    console.log('✅ Ready to test UI with existing data!');
  } else {
    console.log('\n📝 Database is empty. Creating test data...');
    await createTestData();
    
    // Verify the created data
    await testDataAccess();
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Navigate to client management page');
  console.log('3. Verify data displays correctly');
  console.log('4. Test creating new clients through UI');
  console.log('5. Check dashboard displays real metrics');
  
  console.log('\n🔧 If data creation failed:');
  console.log('• Use Supabase dashboard to manually add a client');
  console.log('• Test UI with empty state first');
  console.log('• Verify service connections are working');
}

main().catch(console.error); 