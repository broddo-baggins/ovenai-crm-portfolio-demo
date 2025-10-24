#!/usr/bin/env node

/**
 * Initialize Vlad CEO User Settings - CORRECT SCHEMA VERSION
 * This script uses the correct table structure with JSONB columns
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

async function initializeVladCorrect() {
  console.log('🚀 INITIALIZING VLAD CEO - CORRECT SCHEMA');
  console.log('==========================================\n');
  
  try {
    // 1. App Preferences with JSONB structure
    console.log('1. Creating app preferences...');
    const { error: appError } = await supabase
      .from('user_app_preferences')
      .upsert({
        user_id: VLAD_USER_ID,
        interface_settings: {
          theme: "system",
          language: "en", // English for CEO
          rtl: false,
          density: "comfortable",
          sidebarCollapsed: false,
          colorScheme: "default"
        },
        data_preferences: {
          dateFormat: "DD/MM/YYYY", // Israeli format
          timeFormat: "24h",
          numberFormat: "en-US",
          currency: "ILS", // Israeli Shekel
          pagination: 25,
          sortPreferences: {}
        },
        feature_preferences: {
          betaFeatures: true, // CEO gets beta features
          advancedMode: true, // CEO gets advanced mode
          debugMode: false,
          analytics: true,
          tutorials: false // CEO doesn't need tutorials
        },
        integration_settings: {
          calendly: { enabled: true, autoSync: true },
          whatsapp: { enabled: true, autoSync: true },
          email: { enabled: true, provider: "outlook" }
        }
      });
    
    if (appError) {
      console.log('   ❌ App preferences failed:', appError.message);
    } else {
      console.log('   ✅ App preferences created');
    }
    
    // 2. Dashboard Settings with JSONB structure
    console.log('2. Creating dashboard settings...');
    const { error: dashError } = await supabase
      .from('user_dashboard_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        widget_visibility: {
          metrics: true,
          monthlyPerformance: true,
          leadsConversions: true,
          revenueChannel: true,
          pieCharts: true,
          recentActivity: true,
          insights: true,
          performanceTargets: true
        },
        widget_layout: [],
        dashboard_preferences: {
          defaultView: "enhanced", // CEO gets enhanced view
          autoRefresh: true,
          refreshInterval: 30000, // 30 seconds for CEO
          compactMode: false,
          showTooltips: false, // CEO knows the interface
          animationsEnabled: true
        }
      });
    
    if (dashError) {
      console.log('   ❌ Dashboard settings failed:', dashError.message);
    } else {
      console.log('   ✅ Dashboard settings created');
    }
    
    // 3. Notification Settings with JSONB structure
    console.log('3. Creating notification settings...');
    const { error: notifError } = await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        email_notifications: {
          leadUpdates: true,
          meetingReminders: true,
          systemAlerts: true,
          weeklyReports: true,
          bantQualifications: true,
          calendlyBookings: true,
          heatProgressions: true
        },
        push_notifications: {
          leadUpdates: true,
          meetingReminders: true,
          systemAlerts: true,
          realTimeUpdates: true // CEO wants real-time updates
        },
        sms_notifications: {
          urgentAlerts: true, // CEO gets urgent SMS
          meetingReminders: true,
          leadUpdates: false
        },
        notification_schedule: {
          workingHours: { start: "08:00", end: "20:00" }, // CEO works long hours
          timezone: "Asia/Jerusalem",
          weekends: true, // CEO works weekends
          quietHours: { enabled: false } // CEO has no quiet hours
        }
      });
    
    if (notifError) {
      console.log('   ❌ Notification settings failed:', notifError.message);
    } else {
      console.log('   ✅ Notification settings created');
    }
    
    // 4. Performance Targets with individual columns
    console.log('4. Creating performance targets...');
    const { error: perfError } = await supabase
      .from('user_performance_targets')
      .upsert({
        user_id: VLAD_USER_ID,
        target_leads_per_month: 500, // CEO-level targets
        target_conversion_rate: 30.0,
        target_meetings_per_month: 100,
        target_messages_per_week: 500,
        target_response_rate: 95.0,
        target_reach_rate: 98.0,
        target_bant_qualification_rate: 85.0,
        target_cold_to_warm_rate: 60.0,
        target_warm_to_hot_rate: 80.0,
        target_hot_to_burning_rate: 90.0,
        target_burning_to_meeting_rate: 85.0,
        target_calendly_booking_rate: 40.0,
        custom_targets: {
          ceo_special_kpis: {
            team_performance_improvement: 20.0,
            system_optimization_rate: 95.0,
            admin_console_usage: 100.0
          }
        }
      });
    
    if (perfError) {
      console.log('   ❌ Performance targets failed:', perfError.message);
    } else {
      console.log('   ✅ Performance targets created');
    }
    
    // 5. Session State with JSONB structure
    console.log('5. Creating session state...');
    const { error: sessionError } = await supabase
      .from('user_session_state')
      .upsert({
        user_id: VLAD_USER_ID,
        session_id: 'ceo-session-' + Date.now(),
        current_context: {
          selectedProject: null,
          selectedClient: null,
          currentPage: "admin-console",
          filters: {},
          searches: {}
        },
        ui_state: {
          openPanels: ["admin-console", "system-monitoring"],
          selectedItems: [],
          viewModes: { 
            admin: "enhanced",
            dashboard: "ceo-view",
            leads: "advanced"
          },
          temporarySettings: {
            ceo_mode: true,
            advanced_features: true
          }
        },
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for CEO
      });
    
    if (sessionError) {
      console.log('   ❌ Session state failed:', sessionError.message);
    } else {
      console.log('   ✅ Session state created');
    }
    
    // 6. Queue Settings with JSONB structure (if table exists)
    console.log('6. Creating queue settings...');
    const { error: queueError } = await supabase
      .from('user_queue_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        work_days_enabled: true,
        work_days: [1, 2, 3, 4, 5, 6, 7], // CEO works all days
        business_hours_start: '07:00:00',
        business_hours_end: '22:00:00',
        business_timezone: 'Asia/Jerusalem',
        exclude_holidays: false, // CEO works holidays
        custom_holidays: [],
        target_leads_per_month: 1000,
        target_leads_per_work_day: 50,
        override_daily_target: 75, // CEO override
        max_daily_capacity: 200,
        weekend_processing_enabled: true,
        weekend_target_percentage: 80, // CEO processes more on weekends
        auto_queue_preparation: true,
        queue_preparation_time: '18:00:00',
        auto_start_processing: false, // CEO prefers manual control
        processing_start_time: '07:00:00',
        pause_on_weekends: false,
        pause_on_holidays: false,
        priority_new_leads: 8,
        priority_follow_ups: 9
      });
    
    if (queueError) {
      console.log('   ❌ Queue settings failed:', queueError.message);
    } else {
      console.log('   ✅ Queue settings created');
    }
    
    // 7. Create Self-Serve client membership for CEO
    console.log('7. Setting up CEO client access...');
    
    // First, ensure Self-Serve client exists
    const { data: selfServeClient, error: clientError } = await supabase
      .from('clients')
      .upsert({
        name: 'Self-Serve',
        status: 'active',
        email: 'ceo@ovenai.com',
        phone: '+972-50-000-0000',
        address: 'Tel Aviv, Israel',
        city: 'Tel Aviv'
      }, { onConflict: 'name' })
      .select()
      .single();
    
    if (clientError) {
      console.log('   ❌ Self-Serve client creation failed:', clientError.message);
    } else {
      console.log('   ✅ Self-Serve client ready:', selfServeClient.id);
      
      // Create CEO membership
      const { error: membershipError } = await supabase
        .from('client_members')
        .upsert({
          user_id: VLAD_USER_ID,
          client_id: selfServeClient.id,
          role: 'admin' // CEO is admin of Self-Serve
        });
      
      if (membershipError) {
        console.log('   ❌ CEO client membership failed:', membershipError.message);
      } else {
        console.log('   ✅ CEO client membership created');
      }
    }
    
    // 8. Create welcome notification for CEO
    console.log('8. Creating CEO welcome notification...');
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: VLAD_USER_ID,
        title: 'Welcome to OvenAI Admin Console! 🎯',
        message: 'Your CEO account has been fully initialized with admin privileges. You now have access to all system management features.',
        type: 'success',
        metadata: { 
          source: 'ceo_initialization',
          priority: 'high',
          ceo_onboarding: true
        }
      });
    
    if (notificationError) {
      console.log('   ❌ Welcome notification failed:', notificationError.message);
    } else {
      console.log('   ✅ CEO welcome notification created');
    }
    
    // 9. Verification
    console.log('\n🔍 Verifying CEO initialization...');
    await verifyInitialization();
    
  } catch (error) {
    console.error('❌ Error during CEO initialization:', error.message);
  }
}

async function verifyInitialization() {
  const tables = [
    'user_app_preferences',
    'user_dashboard_settings', 
    'user_notification_settings',
    'user_performance_targets',
    'user_session_state'
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
  
  // Check notifications
  const { count: notificationCount, error: notifCountError } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', VLAD_USER_ID);
  
  if (notifCountError) {
    console.log('   ❌ notifications: Check failed');
  } else {
    console.log(`   ✅ notifications: ${notificationCount || 0} notifications`);
    successCount++;
  }
  
  const totalComponents = tables.length + 2; // +2 for memberships and notifications
  console.log(`\n🎯 Final CEO Status: ${successCount}/${totalComponents} components initialized (${Math.round(successCount/totalComponents*100)}%)`);
  
  if (successCount === totalComponents) {
    console.log('\n🎉 VLAD CEO USER IS FULLY INITIALIZED!');
    console.log('👑 CEO Features Enabled:');
    console.log('   ✅ Advanced Mode & Beta Features');
    console.log('   ✅ Enhanced Dashboard View');
    console.log('   ✅ Real-time Notifications');
    console.log('   ✅ Admin Console Access');
    console.log('   ✅ Client Management Rights');
    console.log('   ✅ CEO-level Performance Targets');
    console.log('   ✅ Extended Work Hours (7AM-10PM)');
    console.log('   ✅ Weekend & Holiday Processing');
    console.log('\n🔑 Login credentials:');
    console.log('   Email: vladtzadik@gmail.com');
    console.log('   Password: VladCEO2024!');
    console.log('\n🚀 Ready for comprehensive admin console testing!');
  } else {
    console.log('\n⚠️ Some initialization incomplete. Check errors above.');
  }
}

// Run the initialization
initializeVladCorrect().then(() => {
  console.log('\n✅ CEO initialization completed');
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}); 