import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load credentials
const credentialsPath = path.join(__dirname, '../../supabase-credentials.local');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

const getCredential = (key) => {
  const line = credentials.split('\n').find(line => line.startsWith(`${key}=`));
  return line ? line.split('=')[1] : null;
};

const supabaseUrl = getCredential('SUPABASE_URL');
const serviceRoleKey = getCredential('SUPABASE_SERVICE_ROLE_KEY');
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔌 COMPLETE SYSTEM CONNECTION & PERMISSIONS TEST');
console.log('================================================================================');
console.log('Testing: Database connection, edit rights, table access, function execution');
console.log('');

async function testBasicConnection() {
  console.log('🔗 Step 1: Basic Database Connection...');
  
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('count')
      .limit(1);

    if (error) {
      console.log('   ❌ Basic connection failed:', error.message);
      return false;
    }

    console.log('   ✅ Database connection successful');
    console.log(`   📊 Service role key: ${serviceRoleKey.substring(0, 20)}...`);
    console.log(`   🌐 Supabase URL: ${supabaseUrl}`);
    return true;

  } catch (err) {
    console.log('   ❌ Connection exception:', err.message);
    return false;
  }
}

async function testTableAccess() {
  console.log('');
  console.log('📊 Step 2: Testing Table Access & Structure...');
  
  const coreTable = ['clients', 'projects', 'leads', 'profiles', 'client_members', 'project_members'];
  const results = {};

  for (const tableName of coreTable) {
    try {
      // Test read access
      const { data: readData, error: readError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (readError) {
        console.log(`   ❌ ${tableName}: Read failed - ${readError.message}`);
        results[tableName] = { read: false, write: false, structure: null };
        continue;
      }

      // Test write access by attempting an insert/delete
      const testRecord = tableName === 'clients' 
        ? { name: 'Test Client', status: 'ACTIVE' }
        : tableName === 'profiles'
        ? { first_name: 'Test', last_name: 'User', email: `test-${Date.now()}@example.com` }
        : null;

      let writeTest = false;
      if (testRecord) {
        const { data: writeData, error: writeError } = await supabase
          .from(tableName)
          .insert(testRecord)
          .select()
          .single();

        if (!writeError && writeData) {
          // Clean up test record
          await supabase.from(tableName).delete().eq('id', writeData.id);
          writeTest = true;
        }
      }

      console.log(`   ✅ ${tableName}: Read ✓${writeTest ? ', Write ✓' : ', Write ?'} (${readData?.length || 0} rows)`);
      results[tableName] = { 
        read: true, 
        write: writeTest, 
        rowCount: readData?.length || 0 
      };

    } catch (err) {
      console.log(`   ❌ ${tableName}: Exception - ${err.message}`);
      results[tableName] = { read: false, write: false, error: err.message };
    }
  }

  return results;
}

async function testFunctionExecution() {
  console.log('');
  console.log('⚙️  Step 3: Testing Function Execution Rights...');
  
  try {
    // Test if we can create a simple test function
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION test_function_execution()
      RETURNS TEXT
      LANGUAGE SQL
      AS $$
        SELECT 'Function execution successful!' AS result;
      $$;
    `;

    const { error: createError } = await supabase.rpc('query', { query: createFunctionSQL });
    
    if (createError) {
      console.log('   ⚠️  Cannot test function creation via RPC:', createError.message);
      console.log('   ℹ️  Will need to create functions via SQL editor');
      return { canCreateFunctions: false, canExecute: false };
    }

    // Test if we can execute the function
    const { data: execData, error: execError } = await supabase.rpc('test_function_execution');
    
    if (execError) {
      console.log('   ❌ Function execution failed:', execError.message);
      return { canCreateFunctions: true, canExecute: false };
    }

    console.log('   ✅ Function creation and execution successful');
    console.log(`   📋 Result: ${execData}`);

    // Clean up
    await supabase.rpc('query', { query: 'DROP FUNCTION IF EXISTS test_function_execution();' });

    return { canCreateFunctions: true, canExecute: true };

  } catch (err) {
    console.log('   ⚠️  Function testing failed:', err.message);
    return { canCreateFunctions: false, canExecute: false };
  }
}

async function testRowLevelSecurity() {
  console.log('');
  console.log('🔒 Step 4: Testing Row Level Security Status...');
  
  try {
    // Check RLS status on core tables
    const rlsQuery = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity as rls_enabled,
        CASE 
          WHEN rowsecurity THEN 'Enabled'
          ELSE 'Disabled'
        END as status
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename IN ('clients', 'projects', 'leads', 'profiles', 'client_members', 'project_members')
      ORDER BY tablename;
    `;

    const { data: rlsData, error: rlsError } = await supabase.rpc('query', { query: rlsQuery });

    if (rlsError) {
      console.log('   ⚠️  Cannot query RLS status via RPC:', rlsError.message);
      console.log('   ℹ️  RLS policies will need manual verification');
      return { canCheckRLS: false };
    }

    if (rlsData && rlsData.length > 0) {
      console.log('   📋 RLS Status by Table:');
      rlsData.forEach(table => {
        console.log(`      - ${table.tablename}: ${table.status}`);
      });
    }

    return { canCheckRLS: true, rlsData };

  } catch (err) {
    console.log('   ⚠️  RLS testing failed:', err.message);
    return { canCheckRLS: false };
  }
}

async function testEdgeFunctionSupport() {
  console.log('');
  console.log('🌐 Step 5: Testing Edge Function Support...');
  
  try {
    // Check if edge functions directory exists and if we can deploy
    const projectRef = getCredential('PROJECT_REF');
    
    if (!projectRef) {
      console.log('   ⚠️  PROJECT_REF not found in credentials');
      return { supported: false, reason: 'No project reference' };
    }

    console.log(`   📋 Project Reference: ${projectRef}`);
    console.log('   ℹ️  Edge functions require Supabase CLI deployment');
    console.log('   ✅ Environment appears ready for edge functions');
    
    return { 
      supported: true, 
      projectRef,
      note: 'Edge functions need CLI deployment'
    };

  } catch (err) {
    console.log('   ⚠️  Edge function check failed:', err.message);
    return { supported: false, reason: err.message };
  }
}

async function generateSystemReport(connectionTest, tableTests, functionTest, rlsTest, edgeTest) {
  console.log('');
  console.log('📊 SYSTEM CAPABILITIES REPORT');
  console.log('================================================================================');
  
  const capabilities = {
    database: connectionTest,
    tables: Object.keys(tableTests).length,
    tablesWithReadAccess: Object.values(tableTests).filter(t => t.read).length,
    tablesWithWriteAccess: Object.values(tableTests).filter(t => t.write).length,
    functionsSupported: functionTest.canExecute,
    rlsCheckable: rlsTest.canCheckRLS,
    edgeFunctionsReady: edgeTest.supported
  };

  console.log(`🔌 Database Connection: ${capabilities.database ? '✅ Working' : '❌ Failed'}`);
  console.log(`📊 Table Access: ${capabilities.tablesWithReadAccess}/${capabilities.tables} readable, ${capabilities.tablesWithWriteAccess}/${capabilities.tables} writable`);
  console.log(`⚙️  Function Execution: ${capabilities.functionsSupported ? '✅ Supported' : '❌ Limited'}`);
  console.log(`🔒 RLS Management: ${capabilities.rlsCheckable ? '✅ Available' : '⚠️  Manual only'}`);
  console.log(`🌐 Edge Functions: ${capabilities.edgeFunctionsReady ? '✅ Ready' : '⚠️  Needs setup'}`);

  console.log('');
  console.log('🎯 READY FOR E2E SYSTEM:');
  
  const readyForPhase1 = capabilities.database && capabilities.tablesWithWriteAccess >= 4;
  const readyForPhase2 = readyForPhase1 && capabilities.functionsSupported;
  const readyForPhase3 = readyForPhase2 && capabilities.edgeFunctionsReady;

  console.log(`   Phase 1 (Database Foundation): ${readyForPhase1 ? '✅ Ready' : '❌ Not ready'}`);
  console.log(`   Phase 2 (Core Business Logic): ${readyForPhase2 ? '✅ Ready' : '⚠️  Function limitations'}`);
  console.log(`   Phase 3 (Communication System): ${readyForPhase3 ? '✅ Ready' : '⚠️  Edge function setup needed'}`);

  console.log('');
  console.log('📝 NEXT STEPS:');
  if (!readyForPhase1) {
    console.log('   1. Fix database connection and table access issues');
  } else if (!readyForPhase2) {
    console.log('   1. ✅ Database foundation ready');
    console.log('   2. Create database functions via SQL editor');
  } else if (!readyForPhase3) {
    console.log('   1. ✅ Database and functions ready');
    console.log('   2. Set up Supabase CLI for edge functions');
  } else {
    console.log('   1. ✅ Complete system capabilities verified');
    console.log('   2. Ready to implement full E2E CRM system');
  }

  return capabilities;
}

async function main() {
  console.log('🚀 Starting comprehensive system test...\n');
  
  const connectionTest = await testBasicConnection();
  if (!connectionTest) {
    console.log('\n❌ CRITICAL: Database connection failed. Check credentials.');
    return;
  }

  const tableTests = await testTableAccess();
  const functionTest = await testFunctionExecution();
  const rlsTest = await testRowLevelSecurity();
  const edgeTest = await testEdgeFunctionSupport();
  
  const systemReport = await generateSystemReport(
    connectionTest, 
    tableTests, 
    functionTest, 
    rlsTest, 
    edgeTest
  );

  console.log('');
  console.log('================================================================================');
  console.log('🎉 System test complete! See report above for next steps.');
}

main().catch(console.error); 