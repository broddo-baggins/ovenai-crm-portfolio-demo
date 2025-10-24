const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../supabase-credentials.local');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

// Parse credentials
const getCredential = (key) => {
  const line = credentials.split('\n').find(line => line.startsWith(`${key}=`));
  return line ? line.split('=')[1] : null;
};

const supabaseUrl = getCredential('SUPABASE_URL');
const serviceRoleKey = getCredential('SUPABASE_SERVICE_ROLE_KEY');

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🎯 APPLYING SOLUTION 1: COMPREHENSIVE WORKFLOW COLUMNS');
console.log('================================================================================');

async function applySolution1() {
  try {
    console.log('📝 Step 1: Adding comprehensive workflow columns...');
    
    // Solution 1: Add ALL possible workflow columns
    const sql = `
      -- Add ALL possible workflow columns that might be referenced
      ALTER TABLE public.workflow_triggers 
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS execution_order INTEGER DEFAULT 1;

      ALTER TABLE public.workflow_definitions
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS execution_order INTEGER DEFAULT 1;

      ALTER TABLE public.workflow_instances
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS execution_data JSONB DEFAULT '{}';

      ALTER TABLE public.workflow_steps
        ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS actions JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS criteria JSONB DEFAULT '{}';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.log('❌ Error adding columns:', error.message);
      return false;
    }

    console.log('✅ Successfully added workflow columns');

    console.log('📝 Step 2: Creating default workflow records...');
    
    // Create default workflow records
    const insertSql = `
      INSERT INTO public.workflow_definitions (name, description, status, trigger_type, is_active, conditions, actions)
      VALUES 
        ('Client Creation Workflow', 'Default workflow for client creation', 'active', 'automatic', true, '{}', '{}'),
        ('Project Creation Workflow', 'Default workflow for project creation', 'active', 'automatic', true, '{}', '{}'),
        ('Lead Creation Workflow', 'Default workflow for lead creation', 'active', 'automatic', true, '{}', '{}')
      ON CONFLICT DO NOTHING;
    `;

    const { data: insertData, error: insertError } = await supabase.rpc('exec_sql', { sql: insertSql });
    
    if (insertError) {
      console.log('❌ Error creating default workflows:', insertError.message);
      return false;
    }

    console.log('✅ Successfully created default workflow records');
    
    console.log('================================================================================');
    console.log('🎉 SOLUTION 1 APPLIED SUCCESSFULLY!');
    console.log('');
    console.log('🧪 Now testing with client creation...');
    
    return true;

  } catch (error) {
    console.error('❌ Failed to apply Solution 1:', error.message);
    return false;
  }
}

async function testClientCreation() {
  try {
    console.log('🧪 Testing client creation...');
    
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: 'Test Client',
        description: 'Test client for workflow validation',
        status: 'ACTIVE',
        contact_info: { email: 'test@example.com' }
      })
      .select();

    if (error) {
      console.log('❌ Client creation still failing:', error.message);
      return false;
    }

    console.log('✅ Client creation successful!');
    
    // Clean up test client
    if (data && data[0]) {
      await supabase.from('clients').delete().eq('id', data[0].id);
      console.log('🧹 Cleaned up test client');
    }
    
    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Starting comprehensive workflow fix...\n');
  
  const solutionApplied = await applySolution1();
  
  if (solutionApplied) {
    const testPassed = await testClientCreation();
    
    if (testPassed) {
      console.log('');
      console.log('🎯 SUCCESS! Ready to create Sarah Martinez experience');
      console.log('📋 Next step: Run "node setup-sarah-complete.js"');
    } else {
      console.log('');
      console.log('⚠️  Solution 1 applied but test still failing');
      console.log('📋 Next: Try Solution 2 or 3 from ultimate-workflow-fix.js');
    }
  } else {
    console.log('');
    console.log('⚠️  Solution 1 failed to apply');
    console.log('📋 Next: Try Solution 2 or 3 from ultimate-workflow-fix.js');
  }
}

main().catch(console.error); 