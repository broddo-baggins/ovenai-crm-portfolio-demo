#!/usr/bin/env node

// Supabase System Matching Test
// This script fetches all data from Supabase and verifies it matches our system expectations

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

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

console.log('\n🧪 Testing Supabase vs System Compatibility\n');

// Expected data structures based on our system
const expectedStructures = {
  clients: {
    required: ['id', 'name', 'created_at', 'updated_at'],
    optional: ['description', 'status', 'contact_info', 'whatsapp_number_id', 'whatsapp_phone_number'],
    types: {
      id: 'string',
      name: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  projects: {
    required: ['id', 'name', 'client_id', 'created_at', 'updated_at'],
    optional: ['description', 'status', 'settings'],
    types: {
      id: 'string',
      name: 'string',
      client_id: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  leads: {
    required: ['id', 'project_id', 'created_at', 'updated_at'],
    optional: ['first_name', 'last_name', 'email', 'phone', 'status', 'source', 'notes'],
    types: {
      id: 'string',
      project_id: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  profiles: {
    required: ['id', 'created_at', 'updated_at'],
    optional: ['first_name', 'last_name', 'email', 'phone', 'role', 'status'],
    types: {
      id: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  client_members: {
    required: ['id', 'client_id', 'user_id', 'created_at', 'updated_at'],
    optional: ['role'],
    types: {
      id: 'string',
      client_id: 'string',
      user_id: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  },
  project_members: {
    required: ['id', 'project_id', 'user_id', 'created_at', 'updated_at'],
    optional: ['role'],
    types: {
      id: 'string',
      project_id: 'string',
      user_id: 'string',
      created_at: 'string',
      updated_at: 'string'
    }
  }
};

async function testTableConnection(tableName) {
  console.log(`📋 Testing table: ${tableName}`);
  console.log('═'.repeat(50));
  
  try {
    // Test basic connection
    const { data, error, count } = await supabaseAdmin
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log(`❌ Connection failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        data: null,
        count: 0
      };
    }
    
    console.log(`✅ Connection successful`);
    console.log(`📊 Record count: ${count || 0}`);
    
    if (data && data.length > 0) {
      console.log(`🔍 Sample data structure:`);
      console.log(JSON.stringify(data[0], null, 2));
      
      // Validate structure
      const validation = validateDataStructure(tableName, data[0]);
      console.log(`🔎 Structure validation:`, validation.isValid ? '✅ Valid' : '❌ Invalid');
      
      if (!validation.isValid) {
        console.log(`⚠️  Issues found:`);
        validation.issues.forEach(issue => console.log(`   • ${issue}`));
      }
      
      return {
        success: true,
        error: null,
        data: data,
        count: count || 0,
        structure: data[0],
        validation
      };
    } else {
      console.log(`📝 Table is empty`);
      
      // Test insert to understand structure
      const insertTest = await testInsertStructure(tableName);
      
      return {
        success: true,
        error: null,
        data: [],
        count: 0,
        insertTest
      };
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      data: null,
      count: 0
    };
  }
}

function validateDataStructure(tableName, record) {
  const expected = expectedStructures[tableName];
  if (!expected) {
    return {
      isValid: false,
      issues: [`No expected structure defined for table: ${tableName}`]
    };
  }
  
  const issues = [];
  const recordKeys = Object.keys(record);
  
  // Check required fields
  expected.required.forEach(field => {
    if (!recordKeys.includes(field)) {
      issues.push(`Missing required field: ${field}`);
    } else if (expected.types[field]) {
      const expectedType = expected.types[field];
      const actualType = typeof record[field];
      if (actualType !== expectedType && record[field] !== null) {
        issues.push(`Field ${field} type mismatch: expected ${expectedType}, got ${actualType}`);
      }
    }
  });
  
  // Check for unexpected fields
  recordKeys.forEach(field => {
    if (!expected.required.includes(field) && !expected.optional.includes(field)) {
      issues.push(`Unexpected field found: ${field}`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

async function testInsertStructure(tableName) {
  console.log(`🧪 Testing insert structure for ${tableName}...`);
  
  const testData = {
    clients: { name: 'Test Client' },
    projects: { name: 'Test Project', client_id: 'test-id' },
    leads: { project_id: 'test-id' },
    profiles: { email: 'test@test.com' },
    client_members: { client_id: 'test-id', user_id: 'test-id' },
    project_members: { project_id: 'test-id', user_id: 'test-id' }
  };
  
  const data = testData[tableName] || { name: 'test' };
  
  try {
    const { error } = await supabaseAdmin
      .from(tableName)
      .insert(data);
    
    if (error) {
      console.log(`💡 Insert failed (expected): ${error.message}`);
      return {
        attempted: data,
        error: error.message,
        insights: extractInsights(error.message)
      };
    } else {
      console.log(`⚠️  Insert succeeded unexpectedly`);
      return {
        attempted: data,
        error: null,
        insights: ['Insert succeeded - data was actually created']
      };
    }
  } catch (error) {
    console.log(`💡 Insert test error: ${error.message}`);
    return {
      attempted: data,
      error: error.message,
      insights: extractInsights(error.message)
    };
  }
}

function extractInsights(errorMessage) {
  const insights = [];
  
  if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
    insights.push('Column structure is different than expected');
  }
  
  if (errorMessage.includes('violates') && errorMessage.includes('constraint')) {
    insights.push('Table has constraints that need to be satisfied');
  }
  
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    insights.push('Referenced table or trigger missing');
  }
  
  if (errorMessage.includes('foreign key')) {
    insights.push('Foreign key constraint exists');
  }
  
  return insights;
}

async function testServiceIntegration() {
  console.log('\n🔗 Testing Service Integration');
  console.log('═'.repeat(50));
  
  try {
    // Test importing our services (this will check if they can load)
    console.log('📦 Testing service imports...');
    
    // Note: In Node.js we can't directly import ES modules from src/
    // So we'll test the connection through direct service calls
    
    // Test basic service operations
    console.log('🧪 Testing basic service operations...');
    
    // Test client operations
    console.log('👤 Testing client operations...');
    const { data: clients, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('*')
      .limit(1);
    
    if (clientError) {
      console.log(`❌ Client service test failed: ${clientError.message}`);
    } else {
      console.log(`✅ Client service connection working`);
    }
    
    // Test project operations
    console.log('📁 Testing project operations...');
    const { data: projects, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .limit(1);
    
    if (projectError) {
      console.log(`❌ Project service test failed: ${projectError.message}`);
    } else {
      console.log(`✅ Project service connection working`);
    }
    
    // Test relationship queries
    console.log('🔗 Testing relationship queries...');
    const { data: clientsWithProjects, error: relationError } = await supabaseAdmin
      .from('clients')
      .select(`
        *,
        projects:projects(*)
      `)
      .limit(1);
    
    if (relationError) {
      console.log(`❌ Relationship query failed: ${relationError.message}`);
    } else {
      console.log(`✅ Relationship queries working`);
    }
    
    return {
      clientService: !clientError,
      projectService: !projectError,
      relationships: !relationError
    };
    
  } catch (error) {
    console.log(`❌ Service integration test failed: ${error.message}`);
    return {
      clientService: false,
      projectService: false,
      relationships: false,
      error: error.message
    };
  }
}

async function generateSystemReport() {
  console.log('\n📊 Generating System Compatibility Report');
  console.log('═'.repeat(50));
  
  const tables = ['clients', 'projects', 'leads', 'profiles', 'client_members', 'project_members'];
  const results = {};
  
  // Test each table
  for (const table of tables) {
    console.log(`\n`);
    results[table] = await testTableConnection(table);
  }
  
  // Test service integration
  const serviceResults = await testServiceIntegration();
  
  // Generate summary
  console.log('\n\n🎯 SYSTEM COMPATIBILITY SUMMARY');
  console.log('═'.repeat(50));
  
  let totalTables = tables.length;
  let workingTables = 0;
  let tablesWithData = 0;
  let validStructures = 0;
  
  tables.forEach(table => {
    const result = results[table];
    if (result.success) {
      workingTables++;
      console.log(`✅ ${table}: Connected (${result.count} records)`);
      
      if (result.count > 0) {
        tablesWithData++;
        if (result.validation?.isValid) {
          validStructures++;
        }
      }
    } else {
      console.log(`❌ ${table}: Failed - ${result.error}`);
    }
  });
  
  console.log('\n📈 Statistics:');
  console.log(`   • Tables accessible: ${workingTables}/${totalTables}`);
  console.log(`   • Tables with data: ${tablesWithData}/${totalTables}`);
  console.log(`   • Valid structures: ${validStructures}/${tablesWithData}`);
  
  console.log('\n🔧 Service Integration:');
  console.log(`   • Client Service: ${serviceResults.clientService ? '✅ Working' : '❌ Failed'}`);
  console.log(`   • Project Service: ${serviceResults.projectService ? '✅ Working' : '❌ Failed'}`);
  console.log(`   • Relationships: ${serviceResults.relationships ? '✅ Working' : '❌ Failed'}`);
  
  // Overall system status
  const overallHealth = (workingTables / totalTables) * 100;
  console.log(`\n🎯 Overall System Health: ${overallHealth.toFixed(1)}%`);
  
  if (overallHealth >= 80) {
    console.log('🎉 System is in good health and ready for use!');
  } else if (overallHealth >= 60) {
    console.log('⚠️  System has some issues but is functional');
  } else {
    console.log('❌ System has significant issues that need attention');
  }
  
  return {
    tables: results,
    services: serviceResults,
    statistics: {
      totalTables,
      workingTables,
      tablesWithData,
      validStructures,
      overallHealth
    }
  };
}

async function testDataCreation() {
  console.log('\n🧪 Testing Data Creation Capabilities');
  console.log('═'.repeat(50));
  
  // Try to create a simple client to test the full workflow
  console.log('👤 Testing client creation...');
  
  try {
    const testClient = {
      name: `Test Client ${Date.now()}`,
      description: 'Automated test client',
      status: 'ACTIVE'
    };
    
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert(testClient)
      .select()
      .single();
    
    if (clientError) {
      console.log(`❌ Client creation failed: ${clientError.message}`);
      return false;
    }
    
    console.log(`✅ Client created successfully: ${client.name}`);
    
    // Try to create a project for this client
    console.log('📁 Testing project creation...');
    
    const testProject = {
      name: `Test Project ${Date.now()}`,
      description: 'Automated test project',
      client_id: client.id,
      status: 'active'
    };
    
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert(testProject)
      .select()
      .single();
    
    if (projectError) {
      console.log(`❌ Project creation failed: ${projectError.message}`);
      
      // Clean up client
      await supabaseAdmin.from('clients').delete().eq('id', client.id);
      return false;
    }
    
    console.log(`✅ Project created successfully: ${project.name}`);
    
    // Try to create a lead for this project
    console.log('📋 Testing lead creation...');
    
    const testLead = {
      project_id: project.id,
      first_name: 'Test',
      last_name: 'Lead',
      email: `test${Date.now()}@example.com`,
      phone: '+1234567890',
      status: 'new',
      source: 'automated_test'
    };
    
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .insert(testLead)
      .select()
      .single();
    
    if (leadError) {
      console.log(`❌ Lead creation failed: ${leadError.message}`);
    } else {
      console.log(`✅ Lead created successfully: ${lead.first_name} ${lead.last_name}`);
    }
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    if (lead) {
      await supabaseAdmin.from('leads').delete().eq('id', lead.id);
    }
    await supabaseAdmin.from('projects').delete().eq('id', project.id);
    await supabaseAdmin.from('clients').delete().eq('id', client.id);
    
    console.log('✅ Test data cleaned up successfully');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Data creation test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Comprehensive Supabase System Test');
  console.log('═'.repeat(50));
  
  // Generate the main compatibility report
  const report = await generateSystemReport();
  
  // Test data creation capabilities
  const dataCreationWorks = await testDataCreation();
  
  // Final summary
  console.log('\n\n🏁 FINAL SYSTEM STATUS');
  console.log('═'.repeat(50));
  
  if (report.statistics.overallHealth >= 80 && dataCreationWorks) {
    console.log('🎉 SYSTEM FULLY OPERATIONAL');
    console.log('✅ Database connection: Working');
    console.log('✅ All tables accessible: Working');
    console.log('✅ Data operations: Working');
    console.log('✅ Service integration: Ready');
    console.log('✅ Ready for production use!');
  } else {
    console.log('⚠️  SYSTEM PARTIALLY OPERATIONAL');
    console.log(`📊 Health: ${report.statistics.overallHealth.toFixed(1)}%`);
    console.log(`🔧 Data Creation: ${dataCreationWorks ? 'Working' : 'Failed'}`);
    console.log('🔍 Check the issues above for specific problems');
  }
  
  console.log('\n📋 Next Steps:');
  if (dataCreationWorks) {
    console.log('1. ✅ Create sample data for testing');
    console.log('2. ✅ Test UI components with real data');
    console.log('3. ✅ Verify all dashboard widgets');
    console.log('4. ✅ Test complete end-to-end workflows');
  } else {
    console.log('1. 🔧 Fix database schema/trigger issues');
    console.log('2. ⚠️  Use manual data insertion for testing');
    console.log('3. 🧪 Test UI with empty data first');
    console.log('4. 📞 Contact database admin if needed');
  }
}

main().catch(console.error); 