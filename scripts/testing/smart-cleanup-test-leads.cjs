#!/usr/bin/env node

/**
 * 🧠 SMART TEST LEAD CLEANUP
 * 
 * Intelligently cleans up test leads while preserving valuable ones.
 * Allows selective keeping based on quality criteria.
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

console.log('🧠 SMART TEST LEAD CLEANUP');
console.log('===========================');
console.log('Analyzing test leads for intelligent cleanup...');
console.log('');

// Patterns to identify test leads
const TEST_PATTERNS = [
  'RegressionLead',
  'QueueLead', 
  'TestSurname',
  'TestLead',
  'DemoLead',
  'BackendTest',
  'StressTest',
  'SampleLead'
];

// Quality criteria for keeping leads
const QUALITY_CRITERIA = {
  hasConversations: true,    // Has associated conversations
  hasInteractions: true,     // Has interaction_count > 0
  hasFollowUp: true,         // Has follow_up scheduling
  recentActivity: true,      // Updated in last 7 days
  goodStatus: true,          // Has meaningful status (not just 'new')
  hasMetadata: true,         // Has rich metadata
  isHumanReviewed: true     // Requires human review flag
};

async function analyzeTestLeads() {
  console.log('🔍 Analyzing test leads...');
  
  try {
    // Get all test leads with related data
    const { data: testLeads, error } = await supabase
      .from('leads')
      .select(`
        id, first_name, last_name, phone, status, state, 
        interaction_count, follow_up_count, requires_human_review,
        created_at, updated_at, lead_metadata, queue_metadata
      `)
      .or(TEST_PATTERNS.map(pattern => `first_name.ilike.%${pattern}%,last_name.ilike.%${pattern}%`).join(','))
      .limit(200);
    
    if (error) {
      console.error('❌ Error fetching test leads:', error.message);
      return { keepLeads: [], deleteLeads: [] };
    }
    
    if (!testLeads || testLeads.length === 0) {
      console.log('✅ No test leads found!');
      return { keepLeads: [], deleteLeads: [] };
    }
    
    console.log(`📊 Found ${testLeads.length} test leads to analyze`);
    
    // Categorize leads
    const keepLeads = [];
    const deleteLeads = [];
    
    for (const lead of testLeads) {
      const quality = assessLeadQuality(lead);
      
      if (quality.score >= 3) {
        keepLeads.push({ ...lead, quality });
      } else {
        deleteLeads.push({ ...lead, quality });
      }
    }
    
    return { keepLeads, deleteLeads };
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    return { keepLeads: [], deleteLeads: [] };
  }
}

function assessLeadQuality(lead) {
  const quality = {
    score: 0,
    reasons: [],
    issues: []
  };
  
  // Check for conversations separately (removed from main query due to schema issues)
  // This would need to be checked separately if needed
  
  if (lead.interaction_count && lead.interaction_count > 0) {
    quality.score += 1;
    quality.reasons.push(`${lead.interaction_count} interactions`);
  }
  
  if (lead.follow_up_count && lead.follow_up_count > 0) {
    quality.score += 1;
    quality.reasons.push(`${lead.follow_up_count} follow-ups scheduled`);
  }
  
  // Recent activity (last 7 days)
  const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate <= 7) {
    quality.score += 1;
    quality.reasons.push(`Updated ${daysSinceUpdate} days ago`);
  }
  
  // Good status (not just basic ones)
  if (lead.status && !['new', 'unqualified'].includes(lead.status)) {
    quality.score += 1;
    quality.reasons.push(`Meaningful status: ${lead.status}`);
  }
  
  // Has rich metadata
  if (lead.lead_metadata && Object.keys(lead.lead_metadata).length > 3) {
    quality.score += 1;
    quality.reasons.push('Rich metadata');
  }
  
  // Human review flag
  if (lead.requires_human_review) {
    quality.score += 1;
    quality.reasons.push('Requires human review');
  }
  
  // Issues that reduce quality
  if (!lead.phone || lead.phone.length < 10) {
    quality.issues.push('Missing/invalid phone');
  }
  
  if (!lead.first_name || !lead.last_name) {
    quality.issues.push('Missing name info');
  }
  
  return quality;
}

async function showAnalysisResults(keepLeads, deleteLeads) {
  console.log('\n📋 ANALYSIS RESULTS:');
  console.log(`✅ Quality leads to KEEP: ${keepLeads.length}`);
  console.log(`🗑️  Low-quality leads to DELETE: ${deleteLeads.length}`);
  
  if (keepLeads.length > 0) {
    console.log('\n✅ HIGH-QUALITY TEST LEADS TO KEEP:');
    keepLeads.slice(0, 10).forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name} (Score: ${lead.quality.score})`);
      console.log(`     Reasons: ${lead.quality.reasons.join(', ')}`);
    });
    
    if (keepLeads.length > 10) {
      console.log(`   ... and ${keepLeads.length - 10} more quality leads`);
    }
  }
  
  if (deleteLeads.length > 0) {
    console.log('\n🗑️  LOW-QUALITY TEST LEADS TO DELETE:');
    deleteLeads.slice(0, 10).forEach(lead => {
      console.log(`   • ${lead.first_name} ${lead.last_name} (Score: ${lead.quality.score})`);
      if (lead.quality.issues.length > 0) {
        console.log(`     Issues: ${lead.quality.issues.join(', ')}`);
      }
    });
    
    if (deleteLeads.length > 10) {
      console.log(`   ... and ${deleteLeads.length - 10} more low-quality leads`);
    }
  }
}

async function executeCleanup(deleteLeads, dryRun = true) {
  if (deleteLeads.length === 0) {
    console.log('\n🎉 No leads need deletion!');
    return 0;
  }
  
  if (dryRun) {
    console.log('\n🧪 DRY RUN MODE - No actual deletions performed');
    console.log(`Would delete ${deleteLeads.length} low-quality test leads`);
    return 0;
  }
  
  console.log('\n🗑️  Starting cleanup of low-quality test leads...');
  
  let deletedCount = 0;
  const batchSize = 10;
  
  for (let i = 0; i < deleteLeads.length; i += batchSize) {
    const batch = deleteLeads.slice(i, i + batchSize);
    const leadIds = batch.map(lead => lead.id);
    
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', leadIds);
      
      if (error) {
        console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} failed:`, error.message);
      } else {
        deletedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: Deleted ${batch.length} leads`);
      }
    } catch (err) {
      console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} exception:`, err.message);
    }
  }
  
  return deletedCount;
}

async function main() {
  try {
    // Analyze test leads
    const { keepLeads, deleteLeads } = await analyzeTestLeads();
    
    // Show results
    await showAnalysisResults(keepLeads, deleteLeads);
    
    // Check command line arguments
    const args = process.argv.slice(2);
    const dryRun = !args.includes('--execute');
    
    // Execute cleanup
    const deletedCount = await executeCleanup(deleteLeads, dryRun);
    
    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`✅ Quality leads preserved: ${keepLeads.length}`);
    console.log(`🗑️  Low-quality leads ${dryRun ? 'would be deleted' : 'deleted'}: ${deleteLeads.length}`);
    if (!dryRun && deletedCount > 0) {
      console.log(`✅ Successfully deleted: ${deletedCount}/${deleteLeads.length} leads`);
    }
    
    if (dryRun) {
      console.log('\n💡 To actually delete the low-quality leads, run:');
      console.log('   node scripts/testing/smart-cleanup-test-leads.cjs --execute');
    }
    
    console.log('\n🎯 Database now optimized with quality test data!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
} 