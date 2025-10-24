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

console.log('🔍 FINDING & REMOVING REMAINING WORKFLOW FUNCTIONS');
console.log('================================================================================');
console.log('Current tables: clients, leads, projects, profiles, client_members, project_members');
console.log('Problem: Functions still reference deleted workflow_triggers table');
console.log('');

async function testConnection() {
  console.log('🔌 Testing connection...');
  try {
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
      return false;
    }
    console.log('   ✅ Connected successfully');
    return true;
  } catch (err) {
    console.log('   ❌ Connection error:', err.message);
    return false;
  }
}

async function findWorkflowFunctions() {
  console.log('');
  console.log('🔍 Finding functions that reference workflow tables...');
  
  try {
    // Get all functions in public schema
    const { data: functions, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          routine_name,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND (
          routine_definition ILIKE '%workflow_triggers%' OR
          routine_definition ILIKE '%workflow_definitions%' OR
          routine_definition ILIKE '%workflow_instances%' OR
          routine_definition ILIKE '%workflow_steps%'
        );
      `
    });

    if (error) {
      console.log('   ⚠️  Could not query functions:', error.message);
      return [];
    }

    if (functions && functions.length > 0) {
      console.log(`   📋 Found ${functions.length} functions referencing workflow tables:`);
      functions.forEach(func => {
        console.log(`      - ${func.routine_name}`);
      });
      return functions;
    } else {
      console.log('   ℹ️  No functions found referencing workflow tables');
      return [];
    }

  } catch (error) {
    console.log('   ❌ Function search failed:', error.message);
    return [];
  }
}

async function findTriggers() {
  console.log('');
  console.log('🔍 Finding triggers that might call workflow functions...');
  
  try {
    const { data: triggers, error } = await supabase.rpc('sql', {
      query: `
        SELECT 
          t.tgname as trigger_name,
          c.relname as table_name,
          p.proname as function_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.tgisinternal = false;
      `
    });

    if (error) {
      console.log('   ⚠️  Could not query triggers:', error.message);
      return [];
    }

    if (triggers && triggers.length > 0) {
      console.log(`   📋 Found ${triggers.length} triggers:`);
      triggers.forEach(trigger => {
        console.log(`      - ${trigger.trigger_name} on ${trigger.table_name} → calls ${trigger.function_name}()`);
      });
      return triggers;
    } else {
      console.log('   ℹ️  No triggers found');
      return [];
    }

  } catch (error) {
    console.log('   ❌ Trigger search failed:', error.message);
    return [];
  }
}

async function dropWorkflowFunctions(functions) {
  console.log('');
  console.log('🗑️  Dropping workflow functions...');
  
  for (const func of functions) {
    try {
      const { error } = await supabase.rpc('sql', {
        query: `DROP FUNCTION IF EXISTS public.${func.routine_name}() CASCADE;`
      });
      
      if (error) {
        console.log(`   ❌ Failed to drop ${func.routine_name}:`, error.message);
      } else {
        console.log(`   ✅ Dropped function: ${func.routine_name}`);
      }
    } catch (err) {
      console.log(`   ❌ Error dropping ${func.routine_name}:`, err.message);
    }
  }
}

async function testClientCreation() {
  console.log('');
  console.log('🧪 Testing client creation...');
  
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: 'Test Client',
        description: 'Testing workflow function removal',
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (error) {
      console.log('   ❌ Client creation failed:', error.message);
      return false;
    } else {
      console.log('   ✅ Client creation successful!');
      
      // Clean up test client
      await supabase.from('clients').delete().eq('id', client.id);
      console.log('   🧹 Test client removed');
      return true;
    }
  } catch (err) {
    console.log('   ❌ Client test error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting workflow function cleanup...\n');
  
  const connected = await testConnection();
  if (!connected) return;

  const functions = await findWorkflowFunctions();
  const triggers = await findTriggers();

  if (functions.length > 0) {
    await dropWorkflowFunctions(functions);
  }

  const clientWorking = await testClientCreation();

  console.log('');
  console.log('================================================================================');
  if (clientWorking) {
    console.log('✅ SUCCESS: Database is clean and ready!');
    console.log('🎉 You can now create Sarah Martinez data');
    console.log('');
    console.log('Next: Run "node 02-create-sarah-data.js"');
  } else {
    console.log('⚠️  Issues remain. Check the errors above.');
  }
}

main().catch(console.error); 