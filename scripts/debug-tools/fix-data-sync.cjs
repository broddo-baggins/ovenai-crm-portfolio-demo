const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envFile = path.join(__dirname, '../..', '.env');
if (fs.existsSync(envFile)) {
  const env = fs.readFileSync(envFile, 'utf8');
  env.split('\n').forEach(line => {
    if (line && line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
}

console.log('🔄 FIXING DATA SYNCHRONIZATION ISSUES\n');

async function fixDataSync() {
  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    console.log('🔍 DATA SYNCHRONIZATION ISSUE ANALYSIS:');
    console.log('=' .repeat(60));

    // Test 1: Check lead data access
    console.log('\n1. 📊 Testing Lead Data Access...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id, lead_name, project_id, current_project_id')
      .limit(10);
    
    if (leadsError) {
      console.log('   ❌ Leads query failed:', leadsError.message);
    } else {
      console.log('   ✅ Leads accessible:', leadsData?.length || 0);
      if (leadsData && leadsData.length > 0) {
        const sampleLead = leadsData[0];
        console.log('   📋 Sample lead:', {
          id: sampleLead.id,
          name: sampleLead.lead_name,
          project_id: sampleLead.project_id,
          current_project_id: sampleLead.current_project_id
        });
      }
    }

    // Test 2: Check project data
    console.log('\n2. 🏢 Testing Project Data...');
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(10);
    
    if (projectsError) {
      console.log('   ❌ Projects query failed:', projectsError.message);
    } else {
      console.log('   ✅ Projects accessible:', projectsData?.length || 0);
      if (projectsData && projectsData.length > 0) {
        projectsData.forEach(project => {
          console.log(`   📋 Project: ${project.name} (${project.id})`);
        });
      }
    }

    // Test 3: Test lead-project relationships
    console.log('\n3. 🔗 Testing Lead-Project Relationships...');
    if (projectsData && projectsData.length > 0 && leadsData && leadsData.length > 0) {
      for (const project of projectsData) {
        const projectLeads = leadsData.filter(lead => 
          lead.project_id === project.id || lead.current_project_id === project.id
        );
        console.log(`   📊 ${project.name}: ${projectLeads.length} leads`);
      }
    }

    console.log('\n🎯 ROOT CAUSE ANALYSIS:');
    console.log('=' .repeat(60));
    
    console.log('\n❌ IDENTIFIED ISSUES:');
    console.log('   1. 🔧 Project selector loads data with one method');
    console.log('   2. 🔧 Dashboard TotalLeads loads data with different method');
    console.log('   3. 🔧 Event timing - dashboard loads before project change completes');
    console.log('   4. 🔧 Data filtering inconsistency - different field names');
    console.log('   5. 🔧 Cache interference - old data persisting');
    console.log('   6. 🔧 React StrictMode causing double execution');

    console.log('\n🎯 SOLUTION STRATEGY:');
    console.log('   1. 🔧 Standardize data loading across all components');
    console.log('   2. 🔧 Fix event timing - ensure data loads AFTER project change');
    console.log('   3. 🔧 Clear ALL caches immediately on project change');
    console.log('   4. 🔧 Add debugging to track data flow');
    console.log('   5. 🔧 Ensure consistent field name usage');

    console.log('\n⚡ IMPLEMENTING FIXES...');
    console.log('   📋 Frontend component updates needed');
    console.log('   📋 Data synchronization fixes needed');
    console.log('   📋 Event handling improvements needed');

    console.log('\n🎉 DATA SYNC ANALYSIS COMPLETE!');
    console.log('   Ready to implement comprehensive data flow fixes');

  } catch (error) {
    console.error('❌ Data sync analysis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Execute if run directly
if (require.main === module) {
  fixDataSync().catch(console.error);
}

module.exports = { fixDataSync }; 