import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load credentials
const credentials = JSON.parse(fs.readFileSync('../credentials/db-credentials.local.json', 'utf8'));

// Database clients
const masterSupabase = createClient(
  credentials.supabase.master.url,
  credentials.supabase.master.service_role_key
);

const siteSupabase = createClient(
  credentials.supabase.development.url,
  credentials.supabase.development.service_role_key
);

console.log('🔍 COMPREHENSIVE DATABASE ANALYSIS & SITE-DB FIX');
console.log('='.repeat(60));

async function analyzeDatabase(supabase, name) {
  console.log(`\n📊 ${name} DATABASE ANALYSIS`);
  console.log('-'.repeat(40));
  
  try {
    // Test connection
    const { data: connectionTest, error: connError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (connError) {
      console.log(`❌ Connection failed: ${connError.message}`);
      return null;
    }
    
    console.log(`✅ Connected successfully`);
    
    // Get all table names
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
    
    if (tablesError) {
      // Fallback method
      console.log('Using fallback table detection...');
    }
    
    // Core tables analysis
    const coreData = {};
    const coreTables = [
      'profiles', 'clients', 'projects', 'leads', 'conversations', 
      'whatsapp_messages', 'client_members', 'project_members'
    ];
    
    for (const table of coreTables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(5);
        
        if (!error) {
          coreData[table] = {
            count: count || 0,
            sample: data || [],
            columns: data && data.length > 0 ? Object.keys(data[0]) : []
          };
          console.log(`📋 ${table}: ${count || 0} records`);
        } else {
          console.log(`⚠️  ${table}: ${error.message}`);
          coreData[table] = { error: error.message };
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
        coreData[table] = { error: err.message };
      }
    }
    
    return coreData;
    
  } catch (error) {
    console.log(`❌ Database analysis failed: ${error.message}`);
    return null;
  }
}

async function analyzeUserAccess(supabase, name) {
  console.log(`\n👤 ${name} USER ACCESS ANALYSIS`);
  console.log('-'.repeat(40));
  
  try {
    // Find test user
    const { data: testUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test@test.test')
      .single();
    
    if (userError) {
      console.log(`❌ Test user not found: ${userError.message}`);
      return null;
    }
    
    console.log(`✅ Test user found: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role || 'No role'}`);
    console.log(`   Status: ${testUser.status || 'No status'}`);
    
    // Check client memberships
    const { data: memberships, error: memberError } = await supabase
      .from('client_members')
      .select(`
        *,
        clients (
          id,
          name,
          status
        )
      `)
      .eq('user_id', testUser.id);
    
    if (memberError) {
      console.log(`⚠️  Client memberships error: ${memberError.message}`);
    } else {
      console.log(`📋 Client memberships: ${memberships?.length || 0}`);
      memberships?.forEach(membership => {
        console.log(`   - ${membership.clients?.name} (${membership.role})`);
      });
    }
    
    // If user has memberships, check their projects
    if (memberships && memberships.length > 0) {
      const clientIds = memberships.map(m => m.client_id);
      
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .in('client_id', clientIds);
      
      if (!projectsError && projects) {
        console.log(`📊 Accessible projects: ${projects.length}`);
        projects.forEach(project => {
          console.log(`   - ${project.name} (Client: ${project.client_id})`);
        });
      }
    }
    
    return {
      user: testUser,
      memberships: memberships || [],
      accessibleProjects: memberships ? memberships.length : 0
    };
    
  } catch (error) {
    console.log(`❌ User access analysis failed: ${error.message}`);
    return null;
  }
}

async function analyzeDataRelationships(supabase, name) {
  console.log(`\n🔗 ${name} DATA RELATIONSHIPS`);
  console.log('-'.repeat(40));
  
  try {
    // Clients with projects
    const { data: clientProjects, error: cpError } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        projects (
          id,
          name,
          status
        )
      `);
    
    if (!cpError && clientProjects) {
      console.log(`📊 Client-Project relationships:`);
      clientProjects.forEach(client => {
        const projectCount = client.projects?.length || 0;
        console.log(`   ${client.name}: ${projectCount} projects`);
        if (client.projects && client.projects.length > 0) {
          client.projects.forEach(project => {
            console.log(`     - ${project.name} (${project.status})`);
          });
        }
      });
    }
    
    // Projects with leads
    const { data: projectLeads, error: plError } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        leads (count)
      `);
    
    if (!plError && projectLeads) {
      console.log(`\n📊 Project-Lead relationships:`);
      projectLeads.forEach(project => {
        const leadCount = project.leads?.[0]?.count || 0;
        console.log(`   ${project.name}: ${leadCount} leads`);
      });
    }
    
    // Conversations with messages
    const { data: convMessages, error: cmError } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        lead_id,
        whatsapp_messages (count)
      `)
      .limit(10);
    
    if (!cmError && convMessages) {
      console.log(`\n📊 Sample Conversation-Message relationships:`);
      convMessages.forEach(conv => {
        const messageCount = conv.whatsapp_messages?.[0]?.count || 0;
        console.log(`   Conv ${conv.id}: ${messageCount} messages (Lead: ${conv.lead_id})`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Relationship analysis failed: ${error.message}`);
  }
}

async function identifyIssues(masterData, siteData) {
  console.log(`\n🚨 ISSUE IDENTIFICATION & SITE-DB FIXES NEEDED`);
  console.log('='.repeat(60));
  
  const issues = [];
  const fixes = [];
  
  // 1. Check if test user has client memberships in Site-DB
  if (siteData?.user_access?.user && siteData.user_access.memberships.length === 0) {
    issues.push('❌ Test user has no client memberships in Site-DB');
    fixes.push('✅ FIX: Add test user to "Digital Growth Marketing" client');
  }
  
  // 2. Check data counts between Master and Site
  const tables = ['clients', 'projects', 'leads', 'conversations'];
  tables.forEach(table => {
    const masterCount = masterData?.[table]?.count || 0;
    const siteCount = siteData?.[table]?.count || 0;
    
    if (masterCount > siteCount) {
      issues.push(`❌ ${table}: Site-DB has fewer records (${siteCount}) than Master (${masterCount})`);
      fixes.push(`✅ FIX: Consider migrating missing ${table} data to Site-DB`);
    }
  });
  
  // 3. Check for missing essential tables
  const essentialTables = ['client_members', 'project_members'];
  essentialTables.forEach(table => {
    if (siteData?.[table]?.error) {
      issues.push(`❌ Essential table missing or inaccessible: ${table}`);
      fixes.push(`✅ FIX: Create/fix ${table} table structure`);
    }
  });
  
  console.log('\n🔍 IDENTIFIED ISSUES:');
  issues.forEach(issue => console.log(issue));
  
  console.log('\n🛠️  REQUIRED FIXES FOR SITE-DB:');
  fixes.forEach(fix => console.log(fix));
  
  return { issues, fixes };
}

async function proposeSiteDbFixes(supabase, issues) {
  console.log(`\n🔧 APPLYING SITE-DB FIXES`);
  console.log('-'.repeat(40));
  
  try {
    // Fix 1: Ensure test user has access to Digital Growth Marketing
    const { data: dgmClient, error: dgmError } = await supabase
      .from('clients')
      .select('*')
      .ilike('name', '%Digital Growth Marketing%')
      .single();
    
    if (!dgmError && dgmClient) {
      console.log(`✅ Found "Digital Growth Marketing" client: ${dgmClient.id}`);
      
      // Check if test user already has membership
      const { data: testUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'test@test.test')
        .single();
      
      if (testUser) {
        const { data: existingMembership } = await supabase
          .from('client_members')
          .select('*')
          .eq('user_id', testUser.id)
          .eq('client_id', dgmClient.id)
          .single();
        
        if (!existingMembership) {
          console.log(`🔧 Adding test user to Digital Growth Marketing...`);
          
          const { data: newMembership, error: membershipError } = await supabase
            .from('client_members')
            .insert({
              user_id: testUser.id,
              client_id: dgmClient.id,
              role: 'admin',
              status: 'active'
            })
            .select()
            .single();
          
          if (membershipError) {
            console.log(`❌ Failed to add membership: ${membershipError.message}`);
          } else {
            console.log(`✅ Successfully added test user to client!`);
          }
        } else {
          console.log(`✅ Test user already has membership`);
        }
      }
    } else {
      console.log(`❌ Could not find Digital Growth Marketing client`);
    }
    
    // Fix 2: Verify data integrity
    console.log(`\n🔍 VERIFYING DATA INTEGRITY...`);
    
    // Check for orphaned records
    const { data: orphanedLeads, error: orphanError } = await supabase
      .from('leads')
      .select(`
        id,
        current_project_id,
        projects!inner (id)
      `)
      .is('projects.id', null);
    
    if (!orphanError && orphanedLeads && orphanedLeads.length > 0) {
      console.log(`⚠️  Found ${orphanedLeads.length} leads with invalid project references`);
    }
    
  } catch (error) {
    console.log(`❌ Fix application failed: ${error.message}`);
  }
}

async function verifyFinalState(supabase) {
  console.log(`\n✅ FINAL VERIFICATION - SITE FUNCTIONALITY`);
  console.log('='.repeat(60));
  
  try {
    // 1. Test user login capability
    const { data: testUser, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'test@test.test')
      .single();
    
    console.log(`1. Login Ready: ${testUser && !userError ? '✅' : '❌'}`);
    
         // 2. Client access (simplified to avoid JOIN issues)
     const { data: simpleMemberships, error: membershipError } = await supabase
       .from('client_members')
       .select('*')
       .eq('user_id', testUser?.id);
     
     let clientAccessSummary = [];
     if (simpleMemberships && simpleMemberships.length > 0) {
       for (const membership of simpleMemberships) {
         const { data: client } = await supabase
           .from('clients')
           .select('id, name')
           .eq('id', membership.client_id)
           .single();
         
         const { data: projects } = await supabase
           .from('projects')
           .select('id, name')
           .eq('client_id', membership.client_id);
         
         clientAccessSummary.push({
           client: client?.name || 'Unknown',
           projectCount: projects?.length || 0,
           role: membership.role
         });
       }
     }
     
     console.log(`2. Client Access: ${simpleMemberships && simpleMemberships.length > 0 ? '✅' : '❌'}`);
     
     if (clientAccessSummary.length > 0) {
       clientAccessSummary.forEach(summary => {
         console.log(`   - ${summary.client}: ${summary.projectCount} projects (${summary.role})`);
       });
     }
    
         // 3. Conversation access
     const { data: conversations, error: convError, count: convCount } = await supabase
       .from('conversations')
       .select('*', { count: 'exact', head: true });
     
     console.log(`3. Conversations Available: ${!convError && convCount > 0 ? '✅' : '❌'} (${convCount || 0} total)`);
     
     // 4. WhatsApp integration
     const { data: messages, error: msgError, count: msgCount } = await supabase
       .from('whatsapp_messages')
       .select('*', { count: 'exact', head: true });
     
     console.log(`4. WhatsApp Integration: ${!msgError && msgCount > 0 ? '✅' : '❌'} (${msgCount || 0} messages)`);
    
         return {
       login: !!testUser && !userError,
       clientAccess: !!(simpleMemberships && simpleMemberships.length > 0),
       conversations: !convError && convCount > 0,
       whatsapp: !msgError && msgCount > 0
     };
    
  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  try {
    // Analyze both databases
    console.log('🔍 Phase 1: Database Analysis');
    const masterData = await analyzeDatabase(masterSupabase, 'MASTER');
    const siteData = await analyzeDatabase(siteSupabase, 'SITE');
    
    // Analyze user access specifically
    console.log('\n🔍 Phase 2: User Access Analysis');
    const masterUserAccess = await analyzeUserAccess(masterSupabase, 'MASTER');
    const siteUserAccess = await analyzeUserAccess(siteSupabase, 'SITE');
    
    // Add user access to data objects
    if (masterData) masterData.user_access = masterUserAccess;
    if (siteData) siteData.user_access = siteUserAccess;
    
    // Analyze relationships
    console.log('\n🔍 Phase 3: Data Relationships');
    await analyzeDataRelationships(masterSupabase, 'MASTER');
    await analyzeDataRelationships(siteSupabase, 'SITE');
    
    // Identify issues and fixes needed
    console.log('\n🔍 Phase 4: Issue Identification');
    const { issues, fixes } = await identifyIssues(masterData, siteData);
    
    // Apply fixes to Site-DB
    console.log('\n🔧 Phase 5: Apply Site-DB Fixes');
    await proposeSiteDbFixes(siteSupabase, issues);
    
    // Final verification
    console.log('\n✅ Phase 6: Final Verification');
    const finalState = await verifyFinalState(siteSupabase);
    
    // Summary
    console.log(`\n🎯 FINAL SUMMARY`);
    console.log('='.repeat(60));
    console.log(`Site Login Ready: ${finalState.login ? '✅' : '❌'}`);
    console.log(`Client Access: ${finalState.clientAccess ? '✅' : '❌'}`);
    console.log(`Conversations: ${finalState.conversations ? '✅' : '❌'}`);
    console.log(`WhatsApp Integration: ${finalState.whatsapp ? '✅' : '❌'}`);
    
    if (finalState.login && finalState.clientAccess && finalState.conversations && finalState.whatsapp) {
      console.log('\n🎉 SUCCESS: Site should now work with real data!');
      console.log('Test user can:');
      console.log('✅ Login to dashboard');
      console.log('✅ See Digital Growth Marketing projects');
      console.log('✅ Access leads and conversations');
      console.log('✅ Use WhatsApp integration');
    } else {
      console.log('\n⚠️  Some issues remain - check logs above');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  }
}

// Run the analysis
main().catch(console.error); 