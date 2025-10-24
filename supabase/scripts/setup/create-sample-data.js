#!/usr/bin/env node

// Sample Data Creator Script
// This script creates comprehensive sample data to test the entire CRM system

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load credentials from local file
const credentialsPath = './supabase-credentials.local';
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

console.log('\n🚀 Creating Sample Data for CRM System\n');

// Sample data templates
const sampleClients = [
  {
    name: "Acme Corporation",
    description: "Leading technology solutions provider",
    status: "ACTIVE"
  },
  {
    name: "Tech Solutions Inc",
    description: "Innovative software development company",
    status: "ACTIVE"
  },
  {
    name: "Global Industries Ltd",
    description: "International manufacturing and distribution",
    status: "ACTIVE"
  }
];

const projectTemplates = [
  {
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design",
    status: "active"
  },
  {
    name: "Mobile App Development",
    description: "Native iOS and Android app for customer engagement",
    status: "active"
  },
  {
    name: "CRM Implementation",
    description: "Deploy and customize CRM system for sales team",
    status: "completed"
  },
  {
    name: "Digital Marketing Campaign",
    description: "Multi-channel marketing campaign for Q1 2024",
    status: "active"
  }
];

const leadTemplates = [
  {
    first_name: "Alex",
    last_name: "Rodriguez",
    email: "alex.rodriguez@email.com",
    phone: "+1-555-1001",
    status: "new",
    source: "website"
  },
  {
    first_name: "Emma",
    last_name: "Thompson",
    email: "emma.thompson@email.com",
    phone: "+1-555-1002",
    status: "contacted",
    source: "referral"
  },
  {
    first_name: "David",
    last_name: "Kim",
    email: "david.kim@email.com",
    phone: "+1-555-1003",
    status: "qualified",
    source: "social_media"
  },
  {
    first_name: "Lisa",
    last_name: "Martinez",
    email: "lisa.martinez@email.com",
    phone: "+1-555-1004",
    status: "converted",
    source: "email_campaign"
  },
  {
    first_name: "James",
    last_name: "Wilson",
    email: "james.wilson@email.com",
    phone: "+1-555-1005",
    status: "lost",
    source: "cold_call"
  }
];

// Create sample user profiles
const userProfiles = [
  {
    first_name: "Admin",
    last_name: "User",
    email: "admin@crm.com",
    phone: "+1-555-0001",
    role: "admin",
    status: "active"
  },
  {
    first_name: "Sales",
    last_name: "Manager",
    email: "sales@crm.com",
    phone: "+1-555-0002",
    role: "manager",
    status: "active"
  }
];

async function createSampleData() {
  try {
    console.log('🏢 Creating sample clients...');
    const createdClients = [];
    
    for (const clientData of sampleClients) {
      const { data: client, error } = await supabaseAdmin
        .from('clients')
        .insert(clientData)
        .select()
        .single();
      
      if (error) throw error;
      createdClients.push(client);
      console.log(`   ✅ Created client: ${client.name}`);
    }

    console.log('\n👤 Creating sample user profiles...');
    const createdProfiles = [];
    for (const profileData of userProfiles) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(profileData)
        .select();
      
      if (error && !error.message.includes('duplicate')) {
        console.log(`   ⚠️  Profile creation skipped: ${error.message}`);
      } else if (!error && data) {
        createdProfiles.push(data[0]);
        console.log(`   ✅ Created profile: ${profileData.first_name} ${profileData.last_name}`);
      }
    }

    console.log('\n📁 Creating sample projects...');
    const createdProjects = [];
    
    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      
      // Create 1-2 projects per client
      const projectCount = Math.floor(Math.random() * 2) + 1;
      
      for (let j = 0; j < projectCount; j++) {
        const projectTemplate = projectTemplates[Math.floor(Math.random() * projectTemplates.length)];
        
        const projectData = {
          name: `${projectTemplate.name} - ${client.name}`,
          description: projectTemplate.description,
          client_id: client.id,
          status: projectTemplate.status
        };

        const { data: project, error } = await supabaseAdmin
          .from('projects')
          .insert(projectData)
          .select()
          .single();
        
        if (error) throw error;
        createdProjects.push(project);
        console.log(`   ✅ Created project: ${project.name}`);
      }
    }

    console.log('\n📋 Creating sample leads...');
    let totalLeads = 0;
    
    for (const project of createdProjects) {
      // Create 2-5 leads per project
      const leadCount = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < leadCount; i++) {
        const leadTemplate = leadTemplates[Math.floor(Math.random() * leadTemplates.length)];
        
        const leadData = {
          project_id: project.id,
          first_name: leadTemplate.first_name + ` ${i + 1}`,
          last_name: leadTemplate.last_name,
          email: `${leadTemplate.first_name.toLowerCase()}${i + 1}.${leadTemplate.last_name.toLowerCase()}@email.com`,
          phone: leadTemplate.phone.replace('1001', `${1001 + totalLeads}`),
          status: leadTemplate.status,
          source: leadTemplate.source,
          notes: `Sample lead for ${project.name}`
        };

        const { data: lead, error } = await supabaseAdmin
          .from('leads')
          .insert(leadData)
          .select()
          .single();
        
        if (error) throw error;
        totalLeads++;
        console.log(`   ✅ Created lead: ${lead.first_name} ${lead.last_name} (${lead.status})`);
      }
    }

    // Create some client members relationships
    console.log('\n👥 Creating client member relationships...');
    for (let i = 0; i < Math.min(createdClients.length, createdProfiles.length); i++) {
      const memberData = {
        client_id: createdClients[i].id,
        user_id: createdProfiles[i].id,
        role: i === 0 ? 'admin' : 'member'
      };

      const { error } = await supabaseAdmin
        .from('client_members')
        .insert(memberData);
      
      if (error && !error.message.includes('duplicate')) {
        console.log(`   ⚠️  Member relationship skipped: ${error.message}`);
      } else if (!error) {
        console.log(`   ✅ Added user to client: ${createdProfiles[i].first_name} → ${createdClients[i].name}`);
      }
    }

    // Summary
    console.log('\n🎉 Sample Data Creation Complete!');
    console.log('══════════════════════════════════════');
    console.log(`📊 Created:`);
    console.log(`   • ${createdClients.length} clients`);
    console.log(`   • ${createdProjects.length} projects`);
    console.log(`   • ${totalLeads} leads`);
    console.log(`   • ${createdProfiles.length} user profiles`);
    console.log(`   • Client-user relationships`);
    
    return {
      clients: createdClients,
      projects: createdProjects,
      leadCount: totalLeads
    };

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
}

// Test data relationships
async function testDataRelationships() {
  console.log('\n🔗 Testing Data Relationships...');
  
  try {
    // Test client with projects
    const { data: clientsWithProjects, error: clientError } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        projects:projects(*)
      `);
    
    if (clientError) throw clientError;
    console.log(`✅ Clients with projects: ${clientsWithProjects.length}`);

    // Test projects with leads
    const { data: projectsWithLeads, error: projectError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        client:clients(name),
        leads:leads(*)
      `);
    
    if (projectError) throw projectError;
    console.log(`✅ Projects with leads: ${projectsWithLeads.length}`);

    // Test lead statistics
    const totalLeads = projectsWithLeads.reduce((sum, project) => sum + (project.leads?.length || 0), 0);
    const convertedLeads = projectsWithLeads.reduce((sum, project) => 
      sum + (project.leads?.filter(lead => lead.status === 'converted').length || 0), 0);
    
    console.log(`✅ Lead statistics:`);
    console.log(`   • Total leads: ${totalLeads}`);
    console.log(`   • Converted leads: ${convertedLeads}`);
    console.log(`   • Conversion rate: ${totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0}%`);

  } catch (error) {
    console.error('❌ Error testing relationships:', error);
  }
}

// Main execution
async function main() {
  await createSampleData();
  await testDataRelationships();
  
  console.log('\n🚀 Ready for UI Testing!');
  console.log('════════════════════════════');
  console.log('You can now:');
  console.log('1. Open your client management page');
  console.log('2. Test creating new clients');
  console.log('3. Verify projects and leads display');
  console.log('4. Test dashboard analytics');
  console.log('5. Check all CRUD operations');
}

main().catch(console.error); 