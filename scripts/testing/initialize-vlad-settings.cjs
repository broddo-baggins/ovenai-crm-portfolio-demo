#!/usr/bin/env node

/**
 * Initialize Missing User Settings for Vlad CEO
 * This script completes the user initialization that was missing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const VLAD_USER_ID = 'e98eec28-f681-4726-aa3b-a005dedbf1e7';
const VLAD_EMAIL = 'vladtzadik@gmail.com';

async function initializeVladSettings() {
  console.log('🚀 INITIALIZING VLAD CEO USER SETTINGS');
  console.log('======================================\n');
  
  try {
    // Call the initialization function using Supabase RPC
    console.log('📞 Calling initialization function...');
    
    const { data, error } = await supabase.rpc('initialize_complete_user', {
      user_id: VLAD_USER_ID,
      user_email: VLAD_EMAIL
    });
    
    if (error) {
      console.error('❌ Initialization function failed:', error.message);
      console.log('💡 Will try manual initialization instead...\n');
      
      // Manual initialization if function doesn't exist
      await manualInitialization();
    } else {
      console.log('✅ Initialization function completed successfully!');
      console.log('📊 Result:', JSON.stringify(data, null, 2));
    }
    
    // Verify the initialization worked
    console.log('\n🔍 Verifying initialization...');
    await verifyInitialization();
    
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
  }
}

async function manualInitialization() {
  console.log('🔧 MANUAL USER SETTINGS INITIALIZATION');
  console.log('--------------------------------------');
  
  // 1. App Preferences
  console.log('1. Creating app preferences...');
  const { error: appError } = await supabase
    .from('user_app_preferences')
    .upsert({
      user_id: VLAD_USER_ID,
      theme: 'system',
      language: 'en', // English for CEO
      timezone: 'Asia/Jerusalem',
      date_format: 'DD/MM/YYYY',
      time_format: '24h',
      currency: 'ILS',
      notifications_enabled: true,
      auto_save: true,
      sidebar_collapsed: false
    });
  
  if (appError) {
    console.log('   ❌ App preferences failed:', appError.message);
  } else {
    console.log('   ✅ App preferences created');
  }
  
  // 2. Dashboard Settings
  console.log('2. Creating dashboard settings...');
  const { error: dashError } = await supabase
    .from('user_dashboard_settings')
    .upsert({
      user_id: VLAD_USER_ID,
      default_view: 'overview',
      widgets_enabled: ['lead_stats', 'recent_conversations', 'performance_metrics', 'quick_actions'],
      chart_preferences: {
        chart_type: 'bar',
        time_range: '30d',
        show_animations: true
      },
      refresh_interval: 300,
      show_welcome_tour: false, // CEO doesn't need welcome tour
      custom_layout: {
        columns: 2,
        compact_mode: false
      }
    });
  
  if (dashError) {
    console.log('   ❌ Dashboard settings failed:', dashError.message);
  } else {
    console.log('   ✅ Dashboard settings created');
  }
  
  // 3. Notification Settings
  console.log('3. Creating notification settings...');
  const { error: notifError } = await supabase
    .from('user_notification_settings')
    .upsert({
      user_id: VLAD_USER_ID,
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      whatsapp_notifications: true,
      lead_updates: true,
      conversation_updates: true,
      system_alerts: true,
      marketing_emails: false,
      weekly_digest: true
    });
  
  if (notifError) {
    console.log('   ❌ Notification settings failed:', notifError.message);
  } else {
    console.log('   ✅ Notification settings created');
  }
  
  // 4. Performance Targets (CEO-level targets)
  console.log('4. Creating performance targets...');
  const { error: perfError } = await supabase
    .from('user_performance_targets')
    .upsert({
      user_id: VLAD_USER_ID,
      target_leads_per_month: 200, // CEO-level targets
      target_conversion_rate: 25.0,
      target_meetings_per_month: 50,
      target_messages_per_week: 300,
      target_response_rate: 85.0,
      target_reach_rate: 90.0,
      target_bant_qualification_rate: 80.0,
      target_cold_to_warm_rate: 50.0,
      target_warm_to_hot_rate: 70.0,
      target_hot_to_burning_rate: 85.0,
      target_burning_to_meeting_rate: 80.0,
      target_calendly_booking_rate: 30.0
    });
  
  if (perfError) {
    console.log('   ❌ Performance targets failed:', perfError.message);
  } else {
    console.log('   ✅ Performance targets created');
  }
  
  // 5. Session State
  console.log('5. Creating session state...');
  const { error: sessionError } = await supabase
    .from('user_session_state')
    .upsert({
      user_id: VLAD_USER_ID,
      session_id: 'ceo-session-' + Date.now(),
      current_context: {
        selectedProject: null,
        selectedClient: null,
        currentPage: 'admin-console',
        filters: {},
        searches: {}
      },
      ui_state: {
        openPanels: [],
        selectedItems: [],
        viewModes: { admin: 'enhanced' },
        temporarySettings: {}
      },
      last_activity: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    });
  
  if (sessionError) {
    console.log('   ❌ Session state failed:', sessionError.message);
  } else {
    console.log('   ✅ Session state created');
  }
  
  // 6. Queue Settings (CEO version)
  console.log('6. Creating queue settings...');
  const { error: queueError } = await supabase
    .from('user_queue_settings')
    .upsert({
      user_id: VLAD_USER_ID,
      work_days: {
        enabled: true,
        work_days: [1, 2, 3, 4, 5],
        business_hours: {
          start: "08:00",
          end: "19:00", // CEO works longer hours
          timezone: "Asia/Jerusalem"
        },
        exclude_holidays: true,
        custom_holidays: ["2025-01-01", "2025-12-25"]
      },
      processing_targets: {
        target_leads_per_month: 500, // Higher CEO targets
        target_leads_per_work_day: 25,
        max_daily_capacity: 100,
        weekend_processing: {
          enabled: true,
          reduced_target_percentage: 50
        }
      },
      automation: {
        auto_queue_preparation: true,
        queue_preparation_time: "18:00",
        auto_start_processing: false, // CEO prefers manual control
        pause_on_weekends: false,
        pause_on_holidays: true,
        max_retry_attempts: 5,
        retry_delay_minutes: 10
      },
      advanced: {
        priority_scoring: {
          enabled: true,
          factors: ["heat_score", "bant_score", "days_since_contact"],
          weights: {"heat_score": 0.5, "bant_score": 0.3, "days_since_contact": 0.2}
        },
        batch_processing: {
          enabled: true,
          batch_size: 75,
          batch_delay_seconds: 20
        },
        rate_limiting: {
          messages_per_hour: 2000,
          messages_per_day: 15000,
          respect_business_hours: false // CEO can work outside hours
        }
      }
    });
  
  if (queueError) {
    console.log('   ❌ Queue settings failed:', queueError.message);
  } else {
    console.log('   ✅ Queue settings created');
  }
  
  // 7. Create Self-Serve client membership for CEO
  console.log('7. Creating Self-Serve client membership...');
  
  // First, ensure Self-Serve client exists
  const { data: selfServeClient, error: clientError } = await supabase
    .from('clients')
    .upsert({
      id: 'self-serve-client',
      name: 'Self-Serve',
      status: 'active',
      contact_info: {
        email: 'ceo@ovenai.com',
        phone: '+972-50-000-0000'
      }
    }, { onConflict: 'id' })
    .select()
    .single();
  
  if (clientError) {
    console.log('   ❌ Self-Serve client creation failed:', clientError.message);
  } else {
    console.log('   ✅ Self-Serve client ready:', selfServeClient.id);
    
    // Create membership
    const { error: membershipError } = await supabase
      .from('client_members')
      .upsert({
        user_id: VLAD_USER_ID,
        client_id: selfServeClient.id,
        role: 'admin' // CEO is admin of Self-Serve
      });
    
    if (membershipError) {
      console.log('   ❌ Client membership failed:', membershipError.message);
    } else {
      console.log('   ✅ CEO client membership created');
    }
  }
}

async function verifyInitialization() {
  const tables = [
    'user_app_preferences',
    'user_dashboard_settings', 
    'user_notification_settings',
    'user_performance_targets',
    'user_session_state',
    'user_queue_settings'
  ];
  
  console.log('📊 Verification Results:');
  let successCount = 0;
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', VLAD_USER_ID)
      .single();
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: Initialized`);
      successCount++;
    }
  }
  
  // Check client membership
  const { data: membership, error: membershipError } = await supabase
    .from('client_members')
    .select('*, clients(name)')
    .eq('user_id', VLAD_USER_ID);
  
  if (membershipError || !membership?.length) {
    console.log('   ❌ client_members: No memberships found');
  } else {
    console.log(`   ✅ client_members: ${membership.length} memberships`);
    membership.forEach(m => {
      console.log(`      → ${m.clients?.name} (${m.role})`);
    });
    successCount++;
  }
  
  console.log(`\n🎯 Final Status: ${successCount}/${tables.length + 1} components initialized (${Math.round(successCount/(tables.length + 1)*100)}%)`);
  
  if (successCount === tables.length + 1) {
    console.log('\n🎉 Vlad CEO user is now FULLY INITIALIZED!');
    console.log('🔑 Login credentials:');
    console.log('   Email: vladtzadik@gmail.com');
    console.log('   Password: VladCEO2024!');
    console.log('🚀 Ready for admin console testing!');
  }
}

// Run the initialization
initializeVladSettings().then(() => {
  console.log('\n✅ Initialization completed');
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}); 