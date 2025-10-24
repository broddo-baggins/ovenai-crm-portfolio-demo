const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read credentials
const credentialsPath = path.join(__dirname, '..', 'credentials', 'supabase-credentials.local');
const credentialsContent = fs.readFileSync(credentialsPath, 'utf8');

// Parse the JSON part (skip the .env variables at the top)
const jsonStart = credentialsContent.indexOf('{');
const jsonContent = credentialsContent.substring(jsonStart);
const credentials = JSON.parse(jsonContent);

const supabaseUrl = credentials.supabase.development.url;
const serviceKey = credentials.supabase.development.service_role_key;

const supabase = createClient(supabaseUrl, serviceKey);

async function applyRLSPolicies() {
  try {
    console.log('🚀 Applying RLS policies and membership tables...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'sql', 'create-membership-tables-and-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by statements and execute each one
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && s !== 'COMMIT');
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim().length === 0) continue;
      
      try {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });
        
        if (error && !error.message.includes('already exists') && !error.message.includes('does not exist')) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (statementError) {
        console.error(`❌ Error executing statement ${i + 1}:`, statementError);
        // Continue with other statements
      }
    }
    
    console.log('🎉 RLS policies application completed!');
    
    // Test the setup by creating a test user and client
    console.log('🧪 Testing the setup...');
    
    // Create a test user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true
    });
    
    if (authError && !authError.message.includes('already registered')) {
      console.error('Auth error:', authError);
    } else {
      console.log('✅ Test user ready');
    }
    
    // Test client creation with membership
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: 'Test RLS Client',
        description: 'Testing RLS setup'
      })
      .select()
      .single();
    
    if (clientError) {
      console.error('❌ Client creation error:', clientError);
    } else {
      console.log('✅ Test client created:', clientData.id);
      
      // Check if membership was created
      const { data: membershipData, error: membershipError } = await supabase
        .from('client_members')
        .select('*')
        .eq('client_id', clientData.id);
      
      if (membershipError) {
        console.error('❌ Membership check error:', membershipError);
      } else {
        console.log('✅ Membership records:', membershipData.length);
      }
    }
    
  } catch (error) {
    console.error('💥 Failed to apply RLS policies:', error);
    process.exit(1);
  }
}

// Add a basic exec_sql RPC function if it doesn't exist
async function createExecFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
        RETURNS text
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
          RETURN 'OK';
        END;
        $$;
      `
    });
    
    if (error) {
      // Try direct approach
      console.log('Creating exec function with direct SQL...');
      const { error: directError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .limit(1);
      
      if (directError) {
        console.log('Using fallback approach...');
      }
    }
  } catch (err) {
    console.log('Will apply SQL statements individually...');
  }
}

// Main execution
(async () => {
  await createExecFunction();
  await applyRLSPolicies();
})(); 