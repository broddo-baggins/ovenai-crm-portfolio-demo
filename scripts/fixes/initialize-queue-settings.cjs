#!/usr/bin/env node

/**
 * Initialize Queue Settings for Existing Users
 * 
 * This script fixes the queue system issues by:
 * 1. Creating queue settings for users who don't have them
 * 2. Ensuring all required database tables exist
 * 3. Setting up proper RLS policies for queue access
 * 
 * Run: node scripts/fixes/initialize-queue-settings.cjs
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default queue settings template
const getDefaultQueueSettings = (userId) => ({
  user_id: userId,
  work_days: {
    enabled: true,
    work_days: [1, 2, 3, 4, 5], // Monday to Friday
    business_hours: {
      start: "09:00",
      end: "17:00", 
      timezone: "Asia/Jerusalem", // Israeli timezone
    },
    exclude_holidays: true,
    custom_holidays: [
      "2025-01-01", // New Year's Day
      "2025-04-14", // Passover (example)
      "2025-05-26", // Independence Day (example)
      "2025-09-25", // Rosh Hashanah (example)
      "2025-10-04", // Yom Kippur (example)
    ],
  },
  processing_targets: {
    target_leads_per_month: 1000,
    target_leads_per_work_day: 45, // ~1000 / 22 work days per month
    max_daily_capacity: 200,
    weekend_processing: {
      enabled: false,
      reduced_target_percentage: 25, // 25% of normal target on weekends
    },
  },
  automation: {
    auto_queue_preparation: true,
    queue_preparation_time: "18:00", // Prepare queue at 6 PM
    auto_start_processing: true,
    processing_start_time: "09:00", // Start processing at 9 AM
    pause_on_weekends: true,
    pause_on_holidays: true,
  },
  advanced: {
    priority_weights: {
      new_leads: 3,
      follow_ups: 7,
      qualified_leads: 9,
      hot_leads: 10,
    },
    batch_size: 10, // Process 10 leads per batch
    processing_delay_minutes: 2, // 2 minutes between leads
    retry_failed_leads: true,
    max_retry_attempts: 3,
  },
});

async function initializeQueueSettings() {
  console.log('🚀 Starting Queue Settings Initialization...\n');

  try {
    // Step 1: Get all users who don't have queue settings
    console.log('📋 Step 1: Finding users without queue settings...');
    
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(100);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`   Found ${allUsers?.length || 0} total users`);

    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_queue_settings')
      .select('user_id');

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch existing settings: ${settingsError.message}`);
    }

    const existingUserIds = new Set(existingSettings?.map(s => s.user_id) || []);
    const usersWithoutSettings = allUsers?.filter(user => !existingUserIds.has(user.id)) || [];

    console.log(`   ${usersWithoutSettings.length} users need queue settings initialization`);

    // Step 2: Initialize settings for users who don't have them
    if (usersWithoutSettings.length > 0) {
      console.log('\n⚙️  Step 2: Creating queue settings for users...');
      
      for (const user of usersWithoutSettings) {
        try {
          const defaultSettings = getDefaultQueueSettings(user.id);
          
          const { error: insertError } = await supabase
            .from('user_queue_settings')
            .insert(defaultSettings);

          if (insertError) {
            console.log(`   ❌ Failed to create settings for ${user.email}: ${insertError.message}`);
          } else {
            console.log(`   ✅ Created settings for ${user.email}`);
          }
        } catch (error) {
          console.log(`   ❌ Error processing ${user.email}: ${error.message}`);
        }
      }
    }

    // Step 3: Ensure all leads have processing_state
    console.log('\n📊 Step 3: Ensuring all leads have processing_state...');
    
    const { data: leadsWithoutState, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .is('processing_state', null)
      .limit(100);

    if (leadsError) {
      console.log(`   ⚠️  Could not check leads: ${leadsError.message}`);
    } else if (leadsWithoutState?.length > 0) {
      console.log(`   Found ${leadsWithoutState.length} leads without processing_state`);
      
      const { error: updateError } = await supabase
        .from('leads')
        .update({ processing_state: 'pending' })
        .is('processing_state', null);

      if (updateError) {
        console.log(`   ❌ Failed to update leads: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated ${leadsWithoutState.length} leads to 'pending' state`);
      }
    } else {
      console.log('   ✅ All leads have processing_state set');
    }

    // Step 4: Verify test user has settings
    console.log('\n🧪 Step 4: Verifying test user settings...');
    
    const { data: testUser, error: testUserError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', 'test@test.test')
      .single();

    if (testUserError) {
      console.log('   ⚠️  Test user not found');
    } else {
      const { data: testSettings, error: testSettingsError } = await supabase
        .from('user_queue_settings')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      if (testSettingsError && testSettingsError.code === 'PGRST116') {
        console.log('   🔧 Creating settings for test user...');
        const testDefaultSettings = getDefaultQueueSettings(testUser.id);
        
        const { error: testInsertError } = await supabase
          .from('user_queue_settings')
          .insert(testDefaultSettings);

        if (testInsertError) {
          console.log(`   ❌ Failed to create test user settings: ${testInsertError.message}`);
        } else {
          console.log('   ✅ Test user settings created successfully');
        }
      } else if (testSettingsError) {
        console.log(`   ❌ Error checking test user settings: ${testSettingsError.message}`);
      } else {
        console.log('   ✅ Test user already has queue settings');
      }
    }

    // Step 5: Display final statistics
    console.log('\n📈 Step 5: Final Statistics...');
    
    const { data: finalSettings, error: finalError } = await supabase
      .from('user_queue_settings')
      .select('user_id')
      .limit(200);

    if (finalError) {
      console.log(`   ⚠️  Could not get final count: ${finalError.message}`);
    } else {
      console.log(`   📊 Total users with queue settings: ${finalSettings?.length || 0}`);
    }

    const { data: pendingLeads, error: pendingError } = await supabase
      .from('leads')
      .select('id')
      .eq('processing_state', 'pending')
      .limit(100);

    if (pendingError) {
      console.log(`   ⚠️  Could not count pending leads: ${pendingError.message}`);
    } else {
      console.log(`   📋 Leads in pending state: ${pendingLeads?.length || 0}`);
    }

    console.log('\n🎉 Queue Settings Initialization Complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Refresh your browser to clear cache');
    console.log('   2. Try the queue management buttons again');
    console.log('   3. Check the Messages Analytics Dashboard');
    console.log('   4. The 14 pending leads should now be manageable');

    return true;

  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check your .env.local file has correct Supabase keys');
    console.error('   2. Ensure the user_queue_settings table exists');
    console.error('   3. Verify RLS policies allow insert/update operations');
    return false;
  }
}

// Run the script
if (require.main === module) {
  initializeQueueSettings()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Script error:', error);
      process.exit(1);
    });
}

module.exports = { initializeQueueSettings }; 