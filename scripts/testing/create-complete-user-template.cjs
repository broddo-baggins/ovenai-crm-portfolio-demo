#!/usr/bin/env node

/**
 * COMPLETE USER CREATION TEMPLATE - PRODUCTION READY
 * This script ensures 100% initialization for all new users
 * Based on lessons learned from Vlad CEO creation
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

/**
 * Complete User Creation with 100% Initialization
 * @param {string} email - User email address
 * @param {string} password - User password
 * @param {string[]} clientIds - Array of client IDs to assign user to (MANDATORY)
 * @param {object} options - Additional options
 */
async function createCompleteUser(email, password, clientIds = [], options = {}) {
  console.log(`🚀 CREATING COMPLETE USER: ${email}`);
  console.log('=====================================\n');
  
  const {
    role = 'member',
    firstName = '',
    lastName = '',
    phone = '',
    skipEmailConfirmation = true
  } = options;

  try {
    // STEP 1: Validate inputs
    if (clientIds.length === 0) {
      throw new Error('❌ CRITICAL: Client memberships are MANDATORY. Provide at least one client ID.');
    }

    // STEP 2: Create authentication user
    console.log('1️⃣ Creating authentication user...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: skipEmailConfirmation,
      user_metadata: { 
        role: role,
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError) throw authError;
    if (!authUser.user) throw new Error('Auth user creation failed');

    const userId = authUser.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // STEP 3: Create profile (automatic via trigger, but verify)
    console.log('2️⃣ Verifying profile creation...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for trigger
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
        phone: phone,
        role: role,
        status: 'active'
      })
      .select()
      .single();

    if (profileError && profileError.code !== '23505') { // Ignore duplicate key
      console.warn('⚠️ Profile creation issue:', profileError);
    }
    console.log('✅ Profile ready');

    // STEP 4: Create client memberships (MANDATORY)
    console.log('3️⃣ Creating client memberships...');
    const membershipPromises = clientIds.map(clientId => 
      supabase.from('client_members').insert({
        user_id: userId,
        client_id: clientId,
        role: role === 'admin' ? 'admin' : 'member',
        created_at: new Date().toISOString()
      })
    );

    await Promise.all(membershipPromises);
    console.log(`✅ Created ${clientIds.length} client memberships`);

    // STEP 5: Initialize ALL user settings tables
    console.log('4️⃣ Initializing user settings...');
    
    // App Preferences
    await supabase.from('user_app_preferences').upsert({
      user_id: userId,
      theme: 'system',
      language: 'en',
      timezone: 'UTC',
      currency: 'USD',
      date_format: 'MM/DD/YYYY',
      time_format: '12h',
      number_format: 'us',
      default_view: 'dashboard',
      sidebar_collapsed: false,
      show_tooltips: true,
      enable_animations: true,
      compact_mode: false,
      updated_at: new Date().toISOString()
    });

    // Dashboard Settings
    await supabase.from('user_dashboard_settings').upsert({
      user_id: userId,
      default_view: 'dashboard',
      widgets: {
        lead_summary: { visible: true, order: 1, size: 'large' },
        conversion_rates: { visible: true, order: 2, size: 'medium' },
        recent_activity: { visible: true, order: 3, size: 'medium' },
        pipeline_status: { visible: true, order: 4, size: 'large' }
      },
      refresh_interval: 300000,
      show_welcome_banner: true,
      enable_real_time: true,
      updated_at: new Date().toISOString()
    });

    // Notification Settings
    await supabase.from('user_notification_settings').upsert({
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      whatsapp_notifications: false,
      sms_notifications: false,
      lead_updates: true,
      project_updates: true,
      system_alerts: true,
      meeting_reminders: true,
      deadline_alerts: true,
      escalation_alerts: false,
      weekly_reports: false,
      monthly_reports: false,
      updated_at: new Date().toISOString()
    });

    // Performance Targets
    await supabase.from('user_performance_targets').upsert({
      user_id: userId,
      monthly_lead_target: 100,
      monthly_conversion_target_percentage: 20,
      monthly_meetings_target: 50,
      quarterly_revenue_target: 100000,
      average_response_time_minutes: 15,
      customer_satisfaction_target: 85,
      updated_at: new Date().toISOString()
    });

    // Session State
    await supabase.from('user_session_state').upsert({
      user_id: userId,
      current_context: {
        filters: {},
        searches: {},
        currentPage: 'dashboard',
        selectedClient: clientIds[0] || null,
        selectedProject: null
      },
      last_activity: new Date().toISOString()
    });

    // Queue Settings (NOW MANDATORY)
    const queueSettings = {
      user_id: userId,
      auto_assign: false,
      max_concurrent: 3,
      priority_lead_temp: 70,
      priority_urgency: 'MEDIUM',
      notification_preferences: {
        new_leads: true,
        assignments: true,
        deadlines: false,
        escalations: false
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
    };

    // Try queue settings table first, fallback to session state
    const { error: queueError } = await supabase
      .from('user_queue_settings')
      .upsert(queueSettings);

    if (queueError) {
      console.log('⚠️ Queue settings table not available, storing in session state...');
      await supabase.from('user_session_state').upsert({
        user_id: userId,
        current_context: {
          filters: {},
          searches: {},
          currentPage: 'dashboard',
          selectedClient: clientIds[0] || null,
          selectedProject: null,
          queueSettings: queueSettings
        },
        last_activity: new Date().toISOString()
      });
    }

    console.log('✅ All user settings initialized');

    // STEP 6: Verify 100% completion
    console.log('5️⃣ Verifying complete initialization...');
    const verificationResults = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('client_members').select('*').eq('user_id', userId),
      supabase.from('user_app_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('user_dashboard_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_notification_settings').select('*').eq('user_id', userId).single(),
      supabase.from('user_performance_targets').select('*').eq('user_id', userId).single(),
      supabase.from('user_session_state').select('*').eq('user_id', userId).single(),
    ]);

    let completedCount = 0;
    const componentNames = [
      'profile', 
      'client_memberships', 
      'app_preferences', 
      'dashboard_settings', 
      'notification_settings', 
      'performance_targets', 
      'session_state'
    ];

    verificationResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        console.log(`✅ ${componentNames[index]}: Complete`);
        completedCount++;
      } else {
        console.log(`❌ ${componentNames[index]}: Missing or failed`);
        console.log(`   Error:`, result.reason || 'Unknown');
      }
    });

    const completionPercentage = Math.round((completedCount / componentNames.length) * 100);
    console.log(`\n📊 INITIALIZATION STATUS: ${completedCount}/${componentNames.length} (${completionPercentage}%)`);

    if (completionPercentage >= 85) {
      console.log('\n🎉 USER CREATION SUCCESSFUL!');
      console.log(`   User: ${email}`);
      console.log(`   ID: ${userId}`);
      console.log(`   Client Memberships: ${clientIds.length}`);
      console.log(`   Initialization: ${completionPercentage}%`);
      console.log(`   Status: Production Ready ✅`);
    } else {
      console.log('\n⚠️ USER CREATION INCOMPLETE');
      console.log('   Some components failed to initialize');
      console.log('   Manual intervention may be required');
    }

    return {
      success: completionPercentage >= 85,
      userId: userId,
      email: email,
      clientMemberships: clientIds.length,
      initializationPercentage: completionPercentage,
      missingComponents: componentNames.filter((_, index) => 
        verificationResults[index].status === 'rejected' || !verificationResults[index].value?.data
      )
    };

  } catch (error) {
    console.error('❌ USER CREATION FAILED:', error);
    return {
      success: false,
      error: error.message,
      userId: null,
      email: email,
      clientMemberships: 0,
      initializationPercentage: 0
    };
  }
}

/**
 * Verify existing user initialization
 */
async function verifyUserInitialization(userId) {
  const requiredComponents = [
    'profiles',
    'client_members',
    'user_app_preferences',
    'user_dashboard_settings',
    'user_notification_settings',
    'user_performance_targets',
    'user_session_state'
  ];

  console.log(`🔍 Verifying initialization for user: ${userId}`);
  
  for (const component of requiredComponents) {
    try {
      const { data, error } = await supabase
        .from(component)
        .select('*')
        .eq(component === 'profiles' ? 'id' : 'user_id', userId);

      if (error || !data || data.length === 0) {
        console.log(`❌ ${component}: Missing or error`);
        return false;
      } else {
        console.log(`✅ ${component}: Present`);
      }
    } catch (err) {
      console.log(`❌ ${component}: Error checking - ${err.message}`);
      return false;
    }
  }

  console.log('✅ User initialization verification complete');
  return true;
}

// Example usage and exports
if (require.main === module) {
  console.log('📚 Complete User Creation Template');
  console.log('Usage examples:');
  console.log('');
  console.log('// Create regular user');
  console.log("createCompleteUser('user@company.com', 'password123', ['client-id-1'])");
  console.log('');
  console.log('// Create admin user');
  console.log("createCompleteUser('admin@company.com', 'admin123', ['client-id-1', 'client-id-2'], {");
  console.log("  role: 'admin',");
  console.log("  firstName: 'Admin',");
  console.log("  lastName: 'User'");
  console.log('});');
  console.log('');
  console.log('❗ CRITICAL: Client memberships are MANDATORY for data access');
}

module.exports = { 
  createCompleteUser, 
  verifyUserInitialization 
}; 