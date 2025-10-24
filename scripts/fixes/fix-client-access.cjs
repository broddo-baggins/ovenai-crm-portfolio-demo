const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
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

// Load credentials from credentials file
const credentialsFile = path.join(__dirname, '../..', 'credentials', 'supabase-credentials.local');
if (fs.existsSync(credentialsFile)) {
  const credentials = fs.readFileSync(credentialsFile, 'utf8');
  credentials.split('\n').forEach(line => {
    if (line && line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
    }
  });
}

console.log('Environment loaded:');
console.log('- SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixClientAccess() {
  try {
    console.log('\n🔍 Diagnosing client access issue...');
    
    // 1. Find test user
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      console.log('❌ Auth error:', usersError.message);
      return;
    }
    
    const testUser = users.find(u => u.email === 'test@test.test');
    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Test user found:', testUser.email);
    console.log('   User ID:', testUser.id);
    
    // 2. Check existing memberships
    const { data: memberships, error: memberError } = await supabase
      .from('client_members')
      .select('*')
      .eq('user_id', testUser.id);
    
    console.log('Current client memberships:', memberships?.length || 0);
    if (memberError) {
      console.log('❌ Membership error:', memberError.message);
    }
    
    // 3. Get all clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*');
    
    console.log('Total clients:', clients?.length || 0);
    if (clientsError) {
      console.log('❌ Clients error:', clientsError.message);
      return;
    }
    
    // 4. Create memberships for all clients
    console.log('\n🔧 Creating client memberships...');
    
    for (const client of clients || []) {
      const { error: insertError } = await supabase
        .from('client_members')
        .insert({
          user_id: testUser.id,
          client_id: client.id,
          role: 'OWNER'
        });
      
      if (insertError) {
        if (insertError.code === '23505') {
          console.log('ℹ️ Membership already exists for', client.name);
        } else {
          console.log('❌ Failed to create membership for', client.name, ':', insertError.message);
        }
      } else {
        console.log('✅ Created membership for', client.name);
      }
    }
    
    // 5. Verify fix
    const { data: newMemberships, error: verifyError } = await supabase
      .from('client_members')
      .select('*, clients(name)')
      .eq('user_id', testUser.id);
    
    if (verifyError) {
      console.log('❌ Verification error:', verifyError.message);
    } else {
      console.log('\n✅ Final verification - User has', newMemberships?.length || 0, 'client memberships:');
      newMemberships?.forEach(m => {
        console.log('  -', m.clients?.name, `(${m.role})`);
      });
    }
    
    console.log('\n🎉 Client access issue fixed! App should load projects now.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixClientAccess(); 