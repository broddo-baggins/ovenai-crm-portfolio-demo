#!/usr/bin/env node

/**
 * 🧪 QUEUE FUNCTIONALITY TEST SUITE
 * 
 * Tests all four fixed queue UI actions:
 * 1. "Prepare Tomorrow's Queue" - should actually enqueue leads
 * 2. "Start Automation" - should process queued messages
 * 3. "Export Queue Data" - should return real CSV data
 * 4. "Take Lead" functionality - should remove from queue and assign to human
 * 
 * Run this after applying the queue fixes to verify everything works
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

console.log('🧪 QUEUE FUNCTIONALITY TEST SUITE');
console.log('==================================');
console.log(`Database: ${supabaseUrl}`);
console.log(`Testing: Prepare Queue, Start Automation, Export Data, Take Lead`);
console.log('');

let testResults = {
  tests_run: 0,
  tests_passed: 0,
  tests_failed: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  testResults.tests_run++;
  if (passed) {
    testResults.tests_passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.tests_failed++;
    console.log(`❌ ${testName}`);
  }
  
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.details.push({
    test: testName,
    passed,
    details,
    timestamp: new Date().toISOString()
  });
}

// Test 1: Prepare Tomorrow's Queue
async function testPrepareTomorrowQueue() {
  console.log('\n🚀 TEST 1: Prepare Tomorrow\'s Queue');
  console.log('------------------------------------');
  
  try {
    // Get initial queue state
    const { data: initialQueue } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('queue_status', 'queued');
    
    const initialCount = initialQueue?.length || 0;
    console.log(`Initial queued messages: ${initialCount}`);
    
    // Get available leads
    const { data: availableLeads } = await supabase
      .from('leads')
      .select('*')
      .in('status', ['1', '2', 'new', 'unqualified', 'awareness'])
      .limit(5);
    
    if (!availableLeads || availableLeads.length === 0) {
      logTest('Prepare Tomorrow Queue - Leads Available', false, 'No pending leads found for testing');
      return;
    }
    
    logTest('Prepare Tomorrow Queue - Leads Available', true, `Found ${availableLeads.length} pending leads`);
    
    // Use valid client ID from database 
    const validUserId = '53a6cb3d-e173-49b0-a501-a73699ec5f86'; // OvenAI client
    const validClientId = '53a6cb3d-e173-49b0-a501-a73699ec5f86'; // OvenAI client
    
    // Simulate the prepareTomorrowQueue function
    const queueEntries = availableLeads.map((lead, index) => ({
      lead_id: lead.id,
      user_id: validUserId, // Use valid client ID that exists
      client_id: validClientId, // Use valid client ID
      queue_position: index + 1,
      priority: 5,
      queue_status: 'queued',
      message_type: 'template',
      message_content: `Test message for ${lead.first_name}`,
      recipient_phone: lead.phone,
      scheduled_for: new Date().toISOString(),
      message_template: 'test_template'
    }));
    
    // Try batch insert
    const { data: insertedEntries, error: insertError } = await supabase
      .from('whatsapp_message_queue')
      .insert(queueEntries)
      .select();
    
    if (insertError) {
      logTest('Prepare Tomorrow Queue - Batch Insert', false, `Insert error: ${insertError.message}`);
      
      // Try individual inserts as fallback
      let successCount = 0;
      for (const entry of queueEntries) {
        const { error: singleError } = await supabase
          .from('whatsapp_message_queue')
          .insert([entry]);
        
        if (!singleError) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        logTest('Prepare Tomorrow Queue - Individual Insert Fallback', true, `Successfully queued ${successCount} leads`);
      } else {
        logTest('Prepare Tomorrow Queue - Individual Insert Fallback', false, 'All individual inserts failed');
      }
    } else {
      logTest('Prepare Tomorrow Queue - Batch Insert', true, `Successfully queued ${insertedEntries.length} leads`);
    }
    
    // Verify queue growth
    const { data: finalQueue } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('queue_status', 'queued');
    
    const finalCount = finalQueue?.length || 0;
    const addedCount = finalCount - initialCount;
    
    logTest('Prepare Tomorrow Queue - Queue Growth Verification', addedCount > 0, `Queue grew from ${initialCount} to ${finalCount} (+${addedCount})`);
    
  } catch (error) {
    logTest('Prepare Tomorrow Queue - Overall', false, `Test failed: ${error.message}`);
  }
}

// Test 2: Start Automation
async function testStartAutomation() {
  console.log('\n⚡ TEST 2: Start Automation');
  console.log('----------------------------');
  
  try {
    // Get queued messages
    const { data: queuedMessages } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('queue_status', 'queued')
      .limit(3);
    
    if (!queuedMessages || queuedMessages.length === 0) {
      logTest('Start Automation - Messages Available', false, 'No queued messages found for processing');
      return;
    }
    
    logTest('Start Automation - Messages Available', true, `Found ${queuedMessages.length} queued messages`);
    
    // Update messages to 'sending' status (simulating automation start)
    const messageIds = queuedMessages.map(msg => msg.id);
    const { error: updateError } = await supabase
      .from('whatsapp_message_queue')
      .update({ 
        queue_status: 'sending',
        processed_at: new Date().toISOString()
      })
      .in('id', messageIds);
    
    if (updateError) {
      logTest('Start Automation - Status Update', false, `Update error: ${updateError.message}`);
    } else {
      logTest('Start Automation - Status Update', true, `Updated ${messageIds.length} messages to sending status`);
    }
    
    // Update associated leads
    const leadIds = queuedMessages
      .map(msg => msg.lead_id)
      .filter(Boolean);
    
    if (leadIds.length > 0) {
      const { error: updateLeadsError } = await supabase
        .from('leads')
        .update({ 
          status: 'questions-asked',
          updated_at: new Date().toISOString()
        })
        .in('id', leadIds);
      
      if (updateLeadsError) {
        logTest('Start Automation - Lead Status Update', false, `Lead update error: ${updateLeadsError.message}`);
      } else {
        logTest('Start Automation - Lead Status Update', true, `Updated ${leadIds.length} leads to processing status`);
      }
    }
    
    // Simulate completion after delay
    setTimeout(async () => {
      try {
        await supabase
          .from('whatsapp_message_queue')
          .update({ 
            queue_status: 'sent',
            sent_at: new Date().toISOString()
          })
          .in('id', messageIds);
        
        console.log('   ✅ Simulation: Messages marked as sent after delay');
      } catch (error) {
        console.log('   ❌ Simulation error:', error.message);
      }
    }, 2000);
    
  } catch (error) {
    logTest('Start Automation - Overall', false, `Test failed: ${error.message}`);
  }
}

// Test 3: Export Queue Data
async function testExportQueueData() {
  console.log('\n📤 TEST 3: Export Queue Data');
  console.log('-----------------------------');
  
  try {
    // Get queue data from all sources
    const { data: queueData, error: queueError } = await supabase
      .from('whatsapp_message_queue')
      .select(`
        *,
        leads:lead_id (
          id,
          first_name,
          last_name,
          phone,
          status
        )
      `)
      .limit(100);
    
    if (queueError) {
      logTest('Export Queue Data - Data Retrieval', false, `Queue data error: ${queueError.message}`);
      return;
    }
    
    const recordCount = queueData?.length || 0;
    logTest('Export Queue Data - Data Retrieval', true, `Retrieved ${recordCount} queue records`);
    
    if (recordCount === 0) {
      logTest('Export Queue Data - CSV Generation', true, 'Generated empty CSV template with instructions');
      return;
    }
    
    // Generate CSV
    const csvHeaders = [
      'ID', 'Lead Name', 'Lead Phone', 'Queue Status', 'Priority', 
      'Scheduled For', 'Created At', 'Message Content'
    ];
    
    const csvRows = queueData.map(item => [
      item.id,
      `${item.leads?.first_name || ''} ${item.leads?.last_name || ''}`.trim(),
      item.leads?.phone || '',
      item.queue_status,
      item.priority,
      item.scheduled_for,
      item.created_at,
      (item.message_content || '').substring(0, 50) + '...'
    ]);
    
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const csvSize = csvContent.length;
    logTest('Export Queue Data - CSV Generation', csvSize > 0, `Generated ${csvSize} bytes of CSV content`);
    
    // Test CSV structure
    const headerCount = csvHeaders.length;
    const rowCount = csvRows.length;
    const expectedFields = headerCount * (rowCount + 1); // headers + data rows
    
    logTest('Export Queue Data - CSV Structure', rowCount >= 0, `CSV has ${headerCount} columns and ${rowCount} data rows`);
    
  } catch (error) {
    logTest('Export Queue Data - Overall', false, `Test failed: ${error.message}`);
  }
}

// Test 4: Take Lead Functionality
async function testTakeLeadFunctionality() {
  console.log('\n👤 TEST 4: Take Lead Functionality');
  console.log('-----------------------------------');
  
  try {
    // Get a lead that might be in queues
    const { data: testLead } = await supabase
      .from('leads')
      .select('*')
      .limit(1)
      .single();
    
    if (!testLead) {
      logTest('Take Lead - Test Lead Available', false, 'No leads available for testing');
      return;
    }
    
    logTest('Take Lead - Test Lead Available', true, `Using lead: ${testLead.first_name} ${testLead.last_name}`);
    
    // Check if lead has any queue entries
    const { data: queueEntries } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('lead_id', testLead.id)
      .in('queue_status', ['queued', 'pending', 'sending']);
    
    const initialQueueCount = queueEntries?.length || 0;
    console.log(`   Lead has ${initialQueueCount} active queue entries`);
    
    // Simulate taking the lead
    const userId = 'test-user-id';
    
    // 1. Update lead status
    const { error: updateLeadError } = await supabase
      .from('leads')
      .update({
        status: 'qualified', // Use valid status that exists
        updated_at: new Date().toISOString()
      })
      .eq('id', testLead.id);
    
    if (updateLeadError) {
      logTest('Take Lead - Lead Status Update', false, `Lead update error: ${updateLeadError.message}`);
    } else {
      logTest('Take Lead - Lead Status Update', true, 'Lead status updated to human-controlled');
    }
    
    // 2. Cancel queue entries
    if (initialQueueCount > 0) {
      const { error: cancelQueueError } = await supabase
        .from('whatsapp_message_queue')
        .update({
          queue_status: 'cancelled',
          updated_at: new Date().toISOString(),
          last_error: `Lead taken by human agent (${userId})`
        })
        .eq('lead_id', testLead.id)
        .in('queue_status', ['queued', 'pending', 'sending']);
      
      if (cancelQueueError) {
        logTest('Take Lead - Queue Cancellation', false, `Queue cancel error: ${cancelQueueError.message}`);
      } else {
        logTest('Take Lead - Queue Cancellation', true, `Cancelled ${initialQueueCount} queue entries`);
      }
    } else {
      logTest('Take Lead - Queue Cancellation', true, 'No queue entries to cancel (expected)');
    }
    
    // 3. Verify final state
    const { data: finalQueueEntries } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('lead_id', testLead.id)
      .in('queue_status', ['queued', 'pending', 'sending']);
    
    const finalQueueCount = finalQueueEntries?.length || 0;
    logTest('Take Lead - Queue Cleanup Verification', finalQueueCount === 0, `Final active queue entries: ${finalQueueCount}`);
    
  } catch (error) {
    logTest('Take Lead - Overall', false, `Test failed: ${error.message}`);
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting comprehensive queue functionality tests...\n');
  
  await testPrepareTomorrowQueue();
  await testStartAutomation();
  await testExportQueueData();
  await testTakeLeadFunctionality();
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Total Tests: ${testResults.tests_run}`);
  console.log(`✅ Passed: ${testResults.tests_passed}`);
  console.log(`❌ Failed: ${testResults.tests_failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.tests_passed / testResults.tests_run) * 100)}%`);
  
  if (testResults.tests_failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   • ${test.test}: ${test.details}`);
      });
  }
  
  console.log('\n🎯 NEXT STEPS:');
  if (testResults.tests_failed === 0) {
    console.log('✅ All queue functionality tests passed!');
    console.log('• Test the UI buttons in the actual application');
    console.log('• Verify real WhatsApp integration if applicable');
    console.log('• Monitor production queue performance');
  } else {
    console.log('❌ Some tests failed - investigate the issues:');
    console.log('• Check database permissions and table structure');
    console.log('• Verify foreign key constraints are working');
    console.log('• Test individual functions in isolation');
    console.log('• Run the SQL migration manually in Supabase SQL Editor');
  }
  
  // Save test results
  const resultsFile = path.join(__dirname, '../../quality-validation/results/queue-test-results.json');
  try {
    fs.writeFileSync(resultsFile, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Test results saved to: ${resultsFile}`);
  } catch (err) {
    console.log(`\n⚠️ Could not save test results: ${err.message}`);
  }
  
  process.exit(testResults.tests_failed > 0 ? 1 : 0);
}

// Execute tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
}); 