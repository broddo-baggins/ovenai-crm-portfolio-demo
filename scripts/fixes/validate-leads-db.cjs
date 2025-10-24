const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ajszzemkpenbfnghqiyz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateLeadsData() {
  console.log('📊 Validating leads data in database...');
  
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, first_name, last_name, status, current_project_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Database error:', error.message);
      return { total: 0, status: 'error', error: error.message };
    }

    const total = leads?.length || 0;
    console.log(`✅ Found ${total} leads in database`);

    if (total > 0) {
      console.log('📋 Sample leads:');
      leads.slice(0, 3).forEach((lead, i) => {
        console.log(`  ${i + 1}. ${lead.first_name} ${lead.last_name} - ${lead.status} (${lead.id})`);
      });

      const statusCounts = leads.reduce((acc, lead) => {
        const status = lead.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      console.log('📊 Status breakdown:', statusCounts);
    }

    return { total, status: 'success', data: leads };
  } catch (error) {
    console.error('❌ Validation error:', error.message);
    return { total: 0, status: 'error', error: error.message };
  }
}

validateLeadsData().then(result => {
  console.log('\n📋 Validation Summary:');
  console.log(`  - Total leads: ${result.total}`);
  console.log(`  - Status: ${result.status}`);
  if (result.error) {
    console.log(`  - Error: ${result.error}`);
  }
  process.exit(0);
}).catch(err => {
  console.error('❌ Script error:', err);
  process.exit(1);
});
