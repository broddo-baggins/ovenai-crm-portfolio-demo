#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function initializeQueueSettingsLocal() {
  console.log('🚀 INITIALIZING QUEUE SETTINGS (LOCAL)');
  console.log('='.repeat(45));

  try {
    // Load credentials from local file
    const credentialsPath = path.join(__dirname, '../../credentials/supabase-credentials.local');
    const credentialsRaw = fs.readFileSync(credentialsPath, 'utf8');
    
    // Extract credentials
    const lines = credentialsRaw.split('\n');
    const siteUrl = lines.find(l => l.startsWith('SUPABASE_URL='))?.split('=')[1];
    const serviceKey = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY='))?.split('=')[1];
    
    if (!siteUrl || !serviceKey) {
      throw new Error('Could not parse Supabase credentials from local file');
    }

    console.log(`🔗 Connecting to: ${siteUrl}`);
    const supabase = createClient(siteUrl, serviceKey);

    // Step 1: Check existing users
    console.log('\n1️⃣ Finding users that need queue settings...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .limit(50);

    if (profilesError) {
      console.log('❌ Could not fetch profiles, trying auth.users directly...');
      
      // Fallback: Try to create settings for a known test user
      const testUserId = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'; // From the user_queue_settings_rows.sql
      
      console.log(`🔧 Creating queue settings for test user: ${testUserId}`);
      
      const defaultSettings = {
        user_id: testUserId,
        work_days: {
          enabled: true,
          work_days: [1, 2, 3, 4, 5],
          business_hours: {
            start: "09:00",
            end: "17:00", 
            timezone: "Asia/Jerusalem"
          },
          exclude_holidays: true,
          custom_holidays: ["2025-01-01", "2025-12-25"]
        },
        processing_targets: {
          target_leads_per_month: 1000,
          target_leads_per_work_day: 45,
          max_daily_capacity: 200,
          weekend_processing: {
            enabled: false,
            reduced_target_percentage: 25
          }
        },
        automation: {
          auto_queue_preparation: true,
          queue_preparation_time: "18:00",
          auto_start_processing: false,
          pause_on_weekends: true,
          pause_on_holidays: true,
          max_retry_attempts: 3,
          retry_delay_minutes: 15
        },
        advanced: {
          priority_scoring: {
            enabled: true,
            factors: ["heat_score", "bant_score", "days_since_contact"],
            weights: {heat_score: 0.4, bant_score: 0.4, days_since_contact: 0.2}
          },
          batch_processing: {
            enabled: true,
            batch_size: 50,
            batch_delay_seconds: 30
          },
          rate_limiting: {
            messages_per_hour: 1000,
            messages_per_day: 10000,
            respect_business_hours: true
          }
        }
      };

      const { error: insertError } = await supabase
        .from('user_queue_settings')
        .upsert(defaultSettings);

      if (insertError) {
        console.log(`❌ Failed to create test user settings: ${insertError.message}`);
      } else {
        console.log('✅ Test user queue settings created successfully');
      }
      
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No users found in profiles table');
      return;
    }

    console.log(`📊 Found ${profiles.length} users in profiles table`);

    // Step 2: Check which users already have queue settings
    const { data: existingSettings, error: settingsError } = await supabase
      .from('user_queue_settings')
      .select('user_id');

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw new Error(`Failed to check existing settings: ${settingsError.message}`);
    }

    const existingUserIds = new Set(existingSettings?.map(s => s.user_id) || []);
    const usersNeedingSettings = profiles.filter(user => !existingUserIds.has(user.id));

    console.log(`🔍 ${existingUserIds.size} users already have settings`);
    console.log(`⚙️  ${usersNeedingSettings.length} users need initialization`);

    // Step 3: Create settings for users who don't have them
    if (usersNeedingSettings.length > 0) {
      console.log('\n2️⃣ Creating queue settings...');
      
      for (const user of usersNeedingSettings) {
        try {
          const defaultSettings = {
            user_id: user.id,
            work_days: {
              enabled: true,
              work_days: [1, 2, 3, 4, 5], // Monday to Friday
              business_hours: {
                start: "09:00",
                end: "17:00", 
                timezone: "Asia/Jerusalem"
              },
              exclude_holidays: true,
              custom_holidays: ["2025-01-01", "2025-12-25"]
            },
            processing_targets: {
              target_leads_per_month: 1000,
              target_leads_per_work_day: 45,
              max_daily_capacity: 200,
              weekend_processing: {
                enabled: false,
                reduced_target_percentage: 25
              }
            },
            automation: {
              auto_queue_preparation: true,
              queue_preparation_time: "18:00",
              auto_start_processing: false,
              pause_on_weekends: true,
              pause_on_holidays: true,
              max_retry_attempts: 3,
              retry_delay_minutes: 15
            },
            advanced: {
              priority_scoring: {
                enabled: true,
                factors: ["heat_score", "bant_score", "days_since_contact"],
                weights: {heat_score: 0.4, bant_score: 0.4, days_since_contact: 0.2}
              },
              batch_processing: {
                enabled: true,
                batch_size: 50,
                batch_delay_seconds: 30
              },
              rate_limiting: {
                messages_per_hour: 1000,
                messages_per_day: 10000,
                respect_business_hours: true
              }
            }
          };

          const { error: insertError } = await supabase
            .from('user_queue_settings')
            .insert(defaultSettings);

          if (insertError) {
            console.log(`❌ Failed to create settings for ${user.email}: ${insertError.message}`);
          } else {
            console.log(`✅ Created settings for ${user.email || user.first_name || user.id.substring(0, 8)}`);
          }
        } catch (error) {
          console.log(`❌ Error processing user: ${error.message}`);
        }
      }
    }

    // Step 4: Verify final state
    console.log('\n3️⃣ Verification...');
    
    const { data: finalSettings, error: finalError } = await supabase
      .from('user_queue_settings')
      .select('user_id, created_at')
      .limit(100);

    if (finalError) {
      console.log(`⚠️  Could not verify final state: ${finalError.message}`);
    } else {
      console.log(`📊 Total queue settings records: ${finalSettings?.length || 0}`);
      
      if (finalSettings && finalSettings.length > 0) {
        console.log('✅ Queue settings initialization completed successfully!');
        console.log('\n📋 Recent settings:');
        finalSettings.slice(0, 3).forEach(setting => {
          const date = new Date(setting.created_at).toLocaleDateString();
          console.log(`   User ID: ${setting.user_id.substring(0, 8)}... (${date})`);
        });
      }
    }

    console.log('\n🎯 Next Steps:');
    console.log('   1. Check Queue Management page in the application');
    console.log('   2. Verify settings can be loaded and updated');
    console.log('   3. Test queueing some leads for processing');

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
}

// Run the initialization
initializeQueueSettingsLocal(); 