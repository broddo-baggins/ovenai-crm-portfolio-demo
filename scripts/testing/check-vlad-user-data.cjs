#!/usr/bin/env node

/**
 * Check Vlad CEO User Data Completeness
 * This script verifies all user data and settings for vladtzadik@gmail.com
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

const VLAD_EMAIL = 'vladtzadik@gmail.com';

async function checkVladUserData() {
  console.log('🔍 COMPREHENSIVE VLAD CEO USER DATA CHECK');
  console.log('==========================================\n');
  
  try {
    // 1. Check Auth User
    console.log('1️⃣ AUTH USER STATUS');
    console.log('-------------------');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Failed to list auth users:', authError.message);
      return;
    }
    
    const authUser = authUsers.users.find(u => u.email === VLAD_EMAIL);
    if (!authUser) {
      console.error('❌ Vlad not found in auth.users');
      return;
    }
    
    console.log('✅ Auth User Found:');
    console.log(`   ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Created: ${authUser.created_at}`);
    console.log(`   Role Metadata: ${JSON.stringify(authUser.user_metadata.role || 'none')}`);
    
    const userId = authUser.id;
    
    // 2. Check Profile
    console.log('\n2️⃣ PROFILE DATA');
    console.log('---------------');
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Profile not found:', profileError.message);
    } else {
      console.log('✅ Profile Found:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Name: ${profile.first_name || 'Not set'} ${profile.last_name || ''}`);
      console.log(`   Full Name: ${profile.full_name || 'Not set'}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Status: ${profile.status || 'Not set'}`);
      console.log(`   Created: ${profile.created_at}`);
    }
    
    // 3. Check User Settings Tables (5 tables)
    console.log('\n3️⃣ USER SETTINGS TABLES');
    console.log('------------------------');
    
    // 3.1 User App Preferences
    const { data: appPrefs, error: appPrefsError } = await supabase
      .from('user_app_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('📱 App Preferences:');
    if (appPrefsError) {
      console.log('   ❌ Not found:', appPrefsError.message);
    } else {
      console.log('   ✅ Found');
      console.log(`   Theme: ${appPrefs.theme || 'Not set'}`);
      console.log(`   Language: ${appPrefs.language || 'Not set'}`);
      console.log(`   Timezone: ${appPrefs.timezone || 'Not set'}`);
      console.log(`   Currency: ${appPrefs.currency || 'Not set'}`);
      console.log(`   Date Format: ${appPrefs.date_format || 'Not set'}`);
    }
    
    // 3.2 Dashboard Settings
    const { data: dashboardSettings, error: dashboardError } = await supabase
      .from('user_dashboard_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('\n📊 Dashboard Settings:');
    if (dashboardError) {
      console.log('   ❌ Not found:', dashboardError.message);
    } else {
      console.log('   ✅ Found');
      console.log(`   Default View: ${dashboardSettings.default_view || 'Not set'}`);
      console.log(`   Widgets: ${dashboardSettings.widgets_enabled ? JSON.stringify(dashboardSettings.widgets_enabled) : 'Not set'}`);
      console.log(`   Refresh Interval: ${dashboardSettings.refresh_interval || 'Not set'}`);
    }
    
    // 3.3 Notification Settings
    const { data: notificationSettings, error: notificationError } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('\n🔔 Notification Settings:');
    if (notificationError) {
      console.log('   ❌ Not found:', notificationError.message);
    } else {
      console.log('   ✅ Found');
      console.log(`   Email Notifications: ${notificationSettings.email_notifications ? 'Enabled' : 'Disabled'}`);
      console.log(`   Push Notifications: ${notificationSettings.push_notifications ? 'Enabled' : 'Disabled'}`);
      console.log(`   WhatsApp Notifications: ${notificationSettings.whatsapp_notifications ? 'Enabled' : 'Disabled'}`);
      console.log(`   Lead Updates: ${notificationSettings.lead_updates ? 'Enabled' : 'Disabled'}`);
    }
    
    // 3.4 Performance Targets
    const { data: performanceTargets, error: performanceError } = await supabase
      .from('user_performance_targets')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('\n🎯 Performance Targets:');
    if (performanceError) {
      console.log('   ❌ Not found:', performanceError.message);
    } else {
      console.log('   ✅ Found');
      console.log(`   Monthly Lead Target: ${performanceTargets.target_leads_per_month || 'Not set'}`);
      console.log(`   Monthly Conversion Target: ${performanceTargets.target_conversion_rate || 'Not set'}%`);
      console.log(`   Monthly Meetings Target: ${performanceTargets.target_meetings_per_month || 'Not set'}`);
    }
    
    // 3.5 Session State
    const { data: sessionState, error: sessionError } = await supabase
      .from('user_session_state')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('\n🖥️ Session State:');
    if (sessionError) {
      console.log('   ❌ Not found:', sessionError.message);
    } else {
      console.log('   ✅ Found');
      console.log(`   Last Activity: ${sessionState.last_activity || 'Not set'}`);
      console.log(`   Current Context: ${sessionState.current_context ? JSON.stringify(sessionState.current_context) : 'Not set'}`);
    }
    
    // 4. Check Client Relationships
    console.log('\n4️⃣ CLIENT & PROJECT ACCESS');
    console.log('---------------------------');
    
    const { data: clientMemberships, error: membershipError } = await supabase
      .from('client_members')
      .select(`
        *,
        clients (id, name, status)
      `)
      .eq('user_id', userId);
    
    if (membershipError) {
      console.log('❌ Client membership check failed:', membershipError.message);
    } else if (!clientMemberships || clientMemberships.length === 0) {
      console.log('⚠️ No client memberships found');
    } else {
      console.log(`✅ Client Memberships: ${clientMemberships.length}`);
      for (const membership of clientMemberships) {
        console.log(`   - Client: ${membership.clients?.name || 'Unknown'} (${membership.role})`);
        console.log(`     Status: ${membership.clients?.status || 'Unknown'}`);
        
        // Check projects for this client
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, status')
          .eq('client_id', membership.client_id);
        
        if (!projectsError && projects) {
          console.log(`     Projects: ${projects.length}`);
          projects.slice(0, 3).forEach(project => {
            console.log(`       → ${project.name} (${project.status})`);
          });
          if (projects.length > 3) {
            console.log(`       → ... and ${projects.length - 3} more`);
          }
        }
      }
    }
    
    // 5. Check Data Access (Leads, Conversations)
    console.log('\n5️⃣ DATA ACCESS VERIFICATION');
    console.log('----------------------------');
    
    // Check leads access
    const { count: leadsCount, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Total Leads in System: ${leadsError ? 'Error' : leadsCount || 0}`);
    
    // Check conversations access
    const { count: conversationsCount, error: conversationsError } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });
    
    console.log(`💬 Total Conversations in System: ${conversationsError ? 'Error' : conversationsCount || 0}`);
    
    // 6. Check Queue Settings (if exists)
    console.log('\n6️⃣ QUEUE MANAGEMENT SETTINGS');
    console.log('-----------------------------');
    
    const { data: queueSettings, error: queueError } = await supabase
      .from('user_queue_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (queueError) {
      console.log('❌ Queue settings not found:', queueError.message);
    } else {
      console.log('✅ Queue Settings Found');
      console.log(`   Work Days: ${queueSettings.work_days ? JSON.stringify(queueSettings.work_days) : 'Not set'}`);
      console.log(`   Processing Targets: ${queueSettings.processing_targets ? 'Configured' : 'Not set'}`);
      console.log(`   Automation: ${queueSettings.automation ? 'Configured' : 'Not set'}`);
    }
    
    // 7. Summary
    console.log('\n7️⃣ INITIALIZATION SUMMARY');
    console.log('--------------------------');
    
    const checks = [
      { name: 'Auth User', status: !!authUser },
      { name: 'Profile', status: !profileError },
      { name: 'App Preferences', status: !appPrefsError },
      { name: 'Dashboard Settings', status: !dashboardError },
      { name: 'Notification Settings', status: !notificationError },
      { name: 'Performance Targets', status: !performanceError },
      { name: 'Session State', status: !sessionError },
      { name: 'Client Memberships', status: !membershipError && clientMemberships?.length > 0 },
      { name: 'Queue Settings', status: !queueError }
    ];
    
    const successCount = checks.filter(check => check.status).length;
    const totalChecks = checks.length;
    
    console.log(`\n📊 Initialization Status: ${successCount}/${totalChecks} (${Math.round(successCount/totalChecks*100)}%)`);
    console.log('---');
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    if (successCount === totalChecks) {
      console.log('\n🎉 Vlad CEO user is FULLY INITIALIZED!');
    } else {
      console.log('\n⚠️ Some initialization is missing. Consider running:');
      console.log('   SELECT public.initialize_complete_user(\'' + userId + '\', \'' + VLAD_EMAIL + '\');');
    }
    
  } catch (error) {
    console.error('❌ Error checking Vlad user data:', error.message);
  }
}

// Run the check
checkVladUserData().then(() => {
  console.log('\n✅ Check completed');
}).catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
}); 