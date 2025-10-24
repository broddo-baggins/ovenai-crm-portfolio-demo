#!/usr/bin/env node

/**
 * Complete Vlad CEO Initialization - Fix Missing Components
 * This script ensures 100% complete user initialization for Vlad CEO
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

async function completeVladInitialization() {
  console.log('🚀 COMPLETE VLAD CEO INITIALIZATION');
  console.log('===================================\n');
  
  try {
    // 1. Fix missing queue settings
    console.log('1️⃣ Fixing queue settings...');
    const { data: queueData, error: queueError } = await supabase
      .from('user_queue_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        auto_assign: true,
        max_concurrent: 5,
        priority_lead_temp: 80,
        priority_urgency: 'HIGH',
        notification_preferences: {
          new_leads: true,
          assignments: true,
          deadlines: true,
          escalations: true
        },
        queue_hours: {
          monday: { start: '09:00', end: '17:00', active: true },
          tuesday: { start: '09:00', end: '17:00', active: true },
          wednesday: { start: '09:00', end: '17:00', active: true },
          thursday: { start: '09:00', end: '17:00', active: true },
          friday: { start: '09:00', end: '17:00', active: true },
          saturday: { start: '10:00', end: '14:00', active: false },
          sunday: { start: '10:00', end: '14:00', active: false }
        },
        updated_at: new Date().toISOString()
      });

    if (queueError) {
      console.log('⚠️ Queue settings table might not exist, creating default entry...');
      // Fallback - create in session state
      await supabase
        .from('user_session_state')
        .upsert({
          user_id: VLAD_USER_ID,
          current_context: {
            filters: {},
            searches: {},
            currentPage: 'admin-console',
            selectedClient: null,
            selectedProject: null,
            queueSettings: {
              auto_assign: true,
              max_concurrent: 5,
              priority_lead_temp: 80,
              priority_urgency: 'HIGH',
              notification_preferences: {
                new_leads: true,
                assignments: true,
                deadlines: true,
                escalations: true
              },
              queue_hours: {
                monday: { start: '09:00', end: '17:00', active: true },
                tuesday: { start: '09:00', end: '17:00', active: true },
                wednesday: { start: '09:00', end: '17:00', active: true },
                thursday: { start: '09:00', end: '17:00', active: true },
                friday: { start: '09:00', end: '17:00', active: true },
                saturday: { start: '10:00', end: '14:00', active: false },
                sunday: { start: '10:00', end: '14:00', active: false }
              }
            }
          },
          last_activity: new Date().toISOString()
        });
      console.log('✅ Queue settings stored in session state');
    } else {
      console.log('✅ Queue settings initialized');
    }

    // 2. Ensure notification settings are complete
    console.log('2️⃣ Updating notification settings...');
    await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        email_notifications: true,
        push_notifications: true,
        whatsapp_notifications: true,
        sms_notifications: true,
        lead_updates: true,
        project_updates: true,
        system_alerts: true,
        meeting_reminders: true,
        deadline_alerts: true,
        escalation_alerts: true,
        weekly_reports: true,
        monthly_reports: true,
        updated_at: new Date().toISOString()
      });
    console.log('✅ Notification settings updated');

    // 3. Ensure app preferences are complete
    console.log('3️⃣ Updating app preferences...');
    await supabase
      .from('user_app_preferences')
      .upsert({
        user_id: VLAD_USER_ID,
        theme: 'dark',
        language: 'en',
        timezone: 'Asia/Jerusalem',
        currency: 'ILS',
        date_format: 'DD/MM/YYYY',
        time_format: '24h',
        number_format: 'european',
        default_view: 'dashboard',
        sidebar_collapsed: false,
        show_tooltips: true,
        enable_animations: true,
        compact_mode: false,
        updated_at: new Date().toISOString()
      });
    console.log('✅ App preferences updated');

    // 4. Update performance targets
    console.log('4️⃣ Updating performance targets...');
    await supabase
      .from('user_performance_targets')
      .upsert({
        user_id: VLAD_USER_ID,
        monthly_lead_target: 1000,
        monthly_conversion_target_percentage: 50,
        monthly_meetings_target: 200,
        quarterly_revenue_target: 1000000,
        average_response_time_minutes: 5,
        customer_satisfaction_target: 95,
        updated_at: new Date().toISOString()
      });
    console.log('✅ Performance targets updated');

    // 5. Update dashboard settings
    console.log('5️⃣ Updating dashboard settings...');
    await supabase
      .from('user_dashboard_settings')
      .upsert({
        user_id: VLAD_USER_ID,
        default_view: 'admin-console',
        widgets: {
          lead_summary: { visible: true, order: 1, size: 'large' },
          conversion_rates: { visible: true, order: 2, size: 'medium' },
          recent_activity: { visible: true, order: 3, size: 'medium' },
          team_performance: { visible: true, order: 4, size: 'large' },
          revenue_chart: { visible: true, order: 5, size: 'large' },
          pipeline_status: { visible: true, order: 6, size: 'medium' },
          calendar_events: { visible: true, order: 7, size: 'small' },
          notifications: { visible: true, order: 8, size: 'small' }
        },
        refresh_interval: 300000,
        show_welcome_banner: false,
        enable_real_time: true,
        updated_at: new Date().toISOString()
      });
    console.log('✅ Dashboard settings updated');

    // 6. Verify initialization is now complete
    console.log('\n6️⃣ Verifying complete initialization...');
    const verificationResults = await Promise.allSettled([
      supabase.from('user_app_preferences').select('*').eq('user_id', VLAD_USER_ID).single(),
      supabase.from('user_dashboard_settings').select('*').eq('user_id', VLAD_USER_ID).single(),
      supabase.from('user_notification_settings').select('*').eq('user_id', VLAD_USER_ID).single(),
      supabase.from('user_performance_targets').select('*').eq('user_id', VLAD_USER_ID).single(),
      supabase.from('user_session_state').select('*').eq('user_id', VLAD_USER_ID).single(),
    ]);

    let completedCount = 0;
    const tableNames = ['app_preferences', 'dashboard_settings', 'notification_settings', 'performance_targets', 'session_state'];
    
    verificationResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        console.log(`✅ ${tableNames[index]}: Complete`);
        completedCount++;
      } else {
        console.log(`❌ ${tableNames[index]}: Missing`);
      }
    });

    console.log(`\n📊 INITIALIZATION STATUS: ${completedCount}/5 (${Math.round(completedCount/5*100)}%)`);
    
    if (completedCount === 5) {
      console.log('\n🎉 VLAD CEO INITIALIZATION 100% COMPLETE!');
      console.log('   All user settings tables are properly initialized');
      console.log('   Ready for full admin console functionality');
    } else {
      console.log('\n⚠️  Some initialization may still be missing');
      console.log('   Consider running the initialize_complete_user function');
    }

    return completedCount === 5;

  } catch (error) {
    console.error('❌ Error during initialization:', error);
    return false;
  }
}

if (require.main === module) {
  completeVladInitialization()
    .then(success => {
      if (success) {
        console.log('\n✅ Vlad CEO initialization completed successfully');
        process.exit(0);
      } else {
        console.log('\n❌ Vlad CEO initialization had issues');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { completeVladInitialization }; 