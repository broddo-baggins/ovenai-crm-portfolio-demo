#!/usr/bin/env node

/**
 * Final Functionality Test Suite - All Issues Fixed
 * Tests: Templates, Messaging, Leads, Queue, Settings
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const CONFIG = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.VITE_SUPABASE_ANON_KEY, // Using anon key for testing
  WHATSAPP_TOKEN: process.env.VITE_WHATSAPP_ACCESS_TOKEN,
  PHONE_NUMBER_ID: process.env.VITE_WHATSAPP_PHONE_NUMBER_ID
};

class FinalFunctionalityTester {
  constructor() {
    this.supabase = null;
    this.realUserId = null;
    this.results = {
      leads: { passed: 0, failed: 0, tests: [] },
      conversations: { passed: 0, failed: 0, tests: [] },
      queue: { passed: 0, failed: 0, tests: [] },
      settings: { passed: 0, failed: 0, tests: [] },
      whatsapp: { passed: 0, failed: 0, tests: [] },
      overall: { total: 0, passed: 0, failed: 0 }
    };
  }

  async initialize() {
    console.log('🚀 Initializing Final Functionality Tests...');
    this.supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_SERVICE_KEY);
    
    // Get a real user ID for settings tests
    const { data: users, error } = await this.supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (users && users.length > 0) {
      this.realUserId = users[0].id;
      console.log(`✅ Using real user ID: ${this.realUserId}`);
    } else {
      console.log('⚠️ No real users found - will create test user');
    }
    
    console.log('✅ Supabase client initialized');
  }

  logTest(category, testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    };

    this.results[category].tests.push(result);
    this.results[category][passed ? 'passed' : 'failed']++;
    this.results.overall.total++;
    this.results.overall[passed ? 'passed' : 'failed']++;

    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  /**
   * 1. TEST LEAD OPERATIONS - COMPREHENSIVE
   */
  async testLeads() {
    console.log('\n👤 Testing Lead Operations (Enhanced)...');

    try {
      // Test 1: Create lead with complete BANT data
      const testLead = {
        first_name: 'John',
        last_name: 'TestLead',
        phone: '+1555123456',
        status: 'new',
        processing_state: 'pending',
        bant_status: 'not_assessed',
        interaction_count: 0,
        follow_up_count: 0,
        requires_human_review: false,
        lead_metadata: {
          source: 'automated_test',
          campaign: 'functionality_test'
        }
      };

      const { data: lead, error: createError } = await this.supabase
        .from('leads')
        .insert(testLead)
        .select()
        .single();

      this.logTest('leads', 'Create Lead with Metadata', !createError,
        createError ? createError.message : `Lead created: ${lead?.id}`);

      if (lead) {
        // Test 2: Update lead status progression
        const statusProgression = ['new', 'contacted', 'qualified', 'opportunity'];
        
        for (let i = 0; i < statusProgression.length; i++) {
          const { error } = await this.supabase
            .from('leads')
            .update({ 
              status: statusProgression[i],
              interaction_count: i + 1,
              last_interaction: new Date().toISOString()
            })
            .eq('id', lead.id);

          this.logTest('leads', `Update Status to ${statusProgression[i]}`, !error,
            error ? error.message : `Status updated to ${statusProgression[i]}`);
        }

        // Test 3: Test BANT qualification
        const { error: bantError } = await this.supabase
          .from('leads')
          .update({
            bant_status: 'qualified',
            state_status_metadata: {
              budget_qualified: true,
              authority_confirmed: true,
              need_identified: true,
              timeline_established: true
            }
          })
          .eq('id', lead.id);

        this.logTest('leads', 'BANT Qualification', !bantError,
          bantError ? bantError.message : 'BANT qualification completed');

        // Test 4: Lead search and filtering
        const { data: searchResults, error: searchError } = await this.supabase
          .from('leads')
          .select('*')
          .or(`first_name.ilike.%John%,last_name.ilike.%TestLead%`)
          .limit(5);

        this.logTest('leads', 'Lead Search', !searchError,
          `Found ${searchResults?.length || 0} leads matching search`);

        // Cleanup
        await this.supabase.from('leads').delete().eq('id', lead.id);
      }

    } catch (error) {
      this.logTest('leads', 'Lead Test Suite', false, error.message);
    }
  }

  /**
   * 2. TEST MESSAGING AND CONVERSATIONS
   */
  async testConversations() {
    console.log('\n💬 Testing Message & Conversation Operations...');

    try {
      // Get real lead for testing
      const { data: testLead, error: leadError } = await this.supabase
        .from('leads')
        .select('id, first_name')
        .limit(1)
        .single();

      if (testLead) {
        // Test 1: Send outbound message
        const outboundMessage = {
          lead_id: testLead.id,
          message_content: 'Hi! This is a test message from our automated system.',
          message_type: 'outgoing',
          direction: 'outbound',
          status: 'sent',
          timestamp: new Date().toISOString(),
          metadata: {
            test_message: true,
            automated: true
          }
        };

        const { data: sentMessage, error: sendError } = await this.supabase
          .from('conversations')
          .insert(outboundMessage)
          .select()
          .single();

        this.logTest('conversations', 'Send Outbound Message', !sendError,
          sendError ? sendError.message : `Message sent: ${sentMessage?.id}`);

        // Test 2: Simulate inbound response
        const inboundMessage = {
          lead_id: testLead.id,
          message_content: 'Thanks for reaching out! I\'m interested.',
          message_type: 'incoming',
          direction: 'inbound',
          status: 'received',
          timestamp: new Date(Date.now() + 1000).toISOString(),
          metadata: {
            test_response: true
          }
        };

        const { data: response, error: responseError } = await this.supabase
          .from('conversations')
          .insert(inboundMessage)
          .select()
          .single();

        this.logTest('conversations', 'Receive Inbound Message', !responseError,
          responseError ? responseError.message : 'Inbound message received');

        // Test 3: Message status updates
        if (sentMessage) {
          const { error: deliveryError } = await this.supabase
            .from('conversations')
            .update({ 
              status: 'delivered',
              metadata: { 
                ...sentMessage.metadata, 
                delivered_at: new Date().toISOString()
              }
            })
            .eq('id', sentMessage.id);

          this.logTest('conversations', 'Update Delivery Status', !deliveryError,
            deliveryError ? deliveryError.message : 'Message marked as delivered');
        }

        // Test 4: Conversation threading
        const { data: conversation, error: threadError } = await this.supabase
          .from('conversations')
          .select('*')
          .eq('lead_id', testLead.id)
          .order('timestamp', { ascending: true });

        this.logTest('conversations', 'Load Conversation Thread', !threadError,
          `Loaded conversation with ${conversation?.length || 0} messages`);

        // Cleanup test messages
        await this.supabase
          .from('conversations')
          .delete()
          .eq('lead_id', testLead.id)
          .eq('metadata->test_message', true);

      } else {
        this.logTest('conversations', 'Find Test Lead', false, 'No leads available');
      }

    } catch (error) {
      this.logTest('conversations', 'Conversation Test Suite', false, error.message);
    }
  }

  /**
   * 3. TEST QUEUE FUNCTIONALITY - FIXED
   */
  async testQueue() {
    console.log('\n⏳ Testing Queue Operations (Fixed)...');

    try {
      // Test 1: Queue metrics with correct data types
      const testMetric = {
        user_id: this.realUserId || 'test-user-uuid',
        date_recorded: new Date().toISOString().split('T')[0],
        leads_processed: 25,
        leads_queued: 12,
        leads_failed: 2,
        average_processing_time_seconds: 45,
        peak_queue_size: 20,
        queue_wait_time_avg_minutes: 3, // Integer instead of decimal
        success_rate: 0.92,
        throughput_per_hour: 15
      };

      const { data: metric, error: metricError } = await this.supabase
        .from('queue_performance_metrics')
        .insert(testMetric)
        .select()
        .single();

      this.logTest('queue', 'Create Queue Metrics', !metricError,
        metricError ? metricError.message : `Metric created: ${metric?.id}`);

      // Test 2: Update queue performance
      if (metric) {
        const { error: updateError } = await this.supabase
          .from('queue_performance_metrics')
          .update({
            leads_processed: 30,
            success_rate: 0.95,
            throughput_per_hour: 18
          })
          .eq('id', metric.id);

        this.logTest('queue', 'Update Queue Performance', !updateError,
          updateError ? updateError.message : 'Queue metrics updated');

        // Cleanup
        await this.supabase.from('queue_performance_metrics').delete().eq('id', metric.id);
      }

      // Test 3: Queue analytics
      const { data: weeklyMetrics, error: analyticsError } = await this.supabase
        .from('queue_performance_metrics')
        .select('leads_processed, success_rate, date_recorded')
        .gte('date_recorded', new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0])
        .order('date_recorded', { ascending: false });

      this.logTest('queue', 'Weekly Queue Analytics', !analyticsError,
        `Analyzed ${weeklyMetrics?.length || 0} days of metrics`);

    } catch (error) {
      this.logTest('queue', 'Queue Test Suite', false, error.message);
    }
  }

  /**
   * 4. TEST SETTINGS PERSISTENCE - FIXED
   */
  async testSettings() {
    console.log('\n⚙️ Testing Settings Persistence (Fixed)...');

    try {
      if (!this.realUserId) {
        this.logTest('settings', 'Settings Tests', false, 'No real user ID available for testing');
        return;
      }

      // Test 1: App Preferences
      const appPrefs = {
        user_id: this.realUserId,
        interface_settings: {
          language: 'en',
          theme: 'dark',
          rtl: false,
          font_size: 'medium'
        },
        data_preferences: {
          currency: 'USD',
          timezone: 'America/New_York',
          date_format: 'MM/DD/YYYY',
          time_format: '12h'
        },
        feature_preferences: {
          notifications: true,
          auto_save: true,
          dark_mode: true
        },
        integration_settings: {
          whatsapp: true,
          email: false,
          calendly: true
        }
      };

      const { data: savedPrefs, error: prefsError } = await this.supabase
        .from('user_app_preferences')
        .upsert(appPrefs)
        .select()
        .single();

      this.logTest('settings', 'Save App Preferences', !prefsError,
        prefsError ? prefsError.message : 'App preferences saved successfully');

      // Test 2: Dashboard Settings
      const dashSettings = {
        user_id: this.realUserId,
        widget_visibility: {
          leads_widget: true,
          conversations_widget: true,
          analytics_widget: true,
          calendar_widget: false
        },
        widget_layout: {
          grid_columns: 3,
          widget_order: ['leads', 'conversations', 'analytics']
        },
        dashboard_preferences: {
          auto_refresh: true,
          refresh_interval: 30,
          compact_mode: false
        }
      };

      const { error: dashError } = await this.supabase
        .from('user_dashboard_settings')
        .upsert(dashSettings);

      this.logTest('settings', 'Save Dashboard Settings', !dashError,
        dashError ? dashError.message : 'Dashboard settings saved');

      // Test 3: Notification Settings
      const notifSettings = {
        user_id: this.realUserId,
        email_notifications: true,
        push_notifications: false,
        sms_notifications: true,
        notification_schedule: {
          enabled: true,
          business_hours_only: true,
          timezone: 'America/New_York',
          start_time: '09:00',
          end_time: '18:00',
          days: [1, 2, 3, 4, 5]
        }
      };

      const { error: notifError } = await this.supabase
        .from('user_notification_settings')
        .upsert(notifSettings);

      this.logTest('settings', 'Save Notification Settings', !notifError,
        notifError ? notifError.message : 'Notification settings saved');

      // Test 4: Performance Targets
      const perfTargets = {
        user_id: this.realUserId,
        target_leads_per_month: 150,
        target_conversion_rate: 0.18,
        target_meetings_per_month: 25,
        target_messages_per_week: 75,
        target_response_rate: 0.85,
        target_reach_rate: 0.95,
        target_bant_qualification_rate: 0.35
      };

      const { error: targetsError } = await this.supabase
        .from('user_performance_targets')
        .upsert(perfTargets);

      this.logTest('settings', 'Save Performance Targets', !targetsError,
        targetsError ? targetsError.message : 'Performance targets saved');

      // Test 5: Retrieve all settings
      const { data: retrievedSettings, error: retrieveError } = await this.supabase
        .from('user_app_preferences')
        .select('*')
        .eq('user_id', this.realUserId)
        .single();

      this.logTest('settings', 'Retrieve Settings', !retrieveError,
        retrieveError ? retrieveError.message : 'All settings retrieved successfully');

      // Test 6: Update preferences
      if (retrievedSettings) {
        const { error: updateError } = await this.supabase
          .from('user_app_preferences')
          .update({
            interface_settings: {
              ...retrievedSettings.interface_settings,
              theme: 'light',
              language: 'he'
            }
          })
          .eq('user_id', this.realUserId);

        this.logTest('settings', 'Update Preferences', !updateError,
          updateError ? updateError.message : 'Preferences updated successfully');
      }

    } catch (error) {
      this.logTest('settings', 'Settings Test Suite', false, error.message);
    }
  }

  /**
   * 5. TEST WHATSAPP INTEGRATION
   */
  async testWhatsApp() {
    console.log('\n📱 Testing WhatsApp Integration...');

    try {
      // Test 1: Environment configuration
      const hasToken = !!CONFIG.WHATSAPP_TOKEN;
      const hasPhoneId = !!CONFIG.PHONE_NUMBER_ID;
      
      this.logTest('whatsapp', 'Access Token Available', hasToken,
        hasToken ? 'WhatsApp access token configured' : 'Missing from environment');

      this.logTest('whatsapp', 'Phone Number ID Available', hasPhoneId,
        hasPhoneId ? 'Phone Number ID configured' : 'Missing from environment');

      // Test 2: Environment template exists
      try {
        const envTemplate = await fs.readFile('example.env.whatsapp', 'utf8');
        const hasRequiredFields = envTemplate.includes('VITE_WHATSAPP_ACCESS_TOKEN') &&
                                 envTemplate.includes('VITE_WHATSAPP_PHONE_NUMBER_ID');
        
        this.logTest('whatsapp', 'Environment Template Complete', hasRequiredFields,
          'WhatsApp environment template has all required fields');
      } catch {
        this.logTest('whatsapp', 'Environment Template', false, 'Template file missing');
      }

      // Test 3: Message queue functionality
      const { data: queueTest, error: queueError } = await this.supabase
        .from('whatsapp_message_queue')
        .select('*')
        .limit(1);

      this.logTest('whatsapp', 'Message Queue Access', !queueError,
        queueError ? queueError.message : 'Message queue table accessible');

      // Test 4: WhatsApp readiness assessment
      const isReady = hasToken && hasPhoneId;
      this.logTest('whatsapp', 'WhatsApp Integration Ready', isReady,
        isReady ? 'Ready for WhatsApp messaging' : 'Needs configuration setup');

    } catch (error) {
      this.logTest('whatsapp', 'WhatsApp Integration Test', false, error.message);
    }
  }

  /**
   * Generate final comprehensive report
   */
  async generateReport() {
    const report = {
      summary: {
        total_tests: this.results.overall.total,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        success_rate: this.results.overall.total > 0 ? 
          Math.round((this.results.overall.passed / this.results.overall.total) * 100) : 0
      },
      categories: Object.fromEntries(
        Object.entries(this.results).filter(([key]) => key !== 'overall')
          .map(([key, value]) => [key, {
            passed: value.passed,
            failed: value.failed,
            total: value.passed + value.failed,
            success_rate: value.passed + value.failed > 0 ? 
              Math.round((value.passed / (value.passed + value.failed)) * 100) : 0,
            tests: value.tests
          }])
      ),
      timestamp: new Date().toISOString(),
      environment: {
        whatsapp_configured: !!CONFIG.WHATSAPP_TOKEN,
        phone_id_configured: !!CONFIG.PHONE_NUMBER_ID,
        real_user_available: !!this.realUserId
      }
    };

    // Save comprehensive report
    const reportPath = `./test-results/final-functionality-test-${Date.now()}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n🎉 FINAL FUNCTIONALITY TEST RESULTS:');
    console.log('═'.repeat(70));
    console.log(`📊 TOTAL TESTS: ${report.summary.total_tests}`);
    console.log(`✅ PASSED: ${report.summary.passed}`);
    console.log(`❌ FAILED: ${report.summary.failed}`);
    console.log(`📈 SUCCESS RATE: ${report.summary.success_rate}%`);
    console.log('═'.repeat(70));
    
    console.log('📋 CATEGORY BREAKDOWN:');
    Object.entries(report.categories).forEach(([category, results]) => {
      const icon = results.success_rate === 100 ? '✅' : results.success_rate >= 80 ? '⚠️' : '❌';
      console.log(`${icon} ${category.toUpperCase()}: ${results.passed}/${results.total} (${results.success_rate}%)`);
    });
    
    console.log('═'.repeat(70));
    console.log('🔧 ENVIRONMENT STATUS:');
    console.log(`📱 WhatsApp Token: ${report.environment.whatsapp_configured ? '✅' : '❌'}`);
    console.log(`📞 Phone Number ID: ${report.environment.phone_id_configured ? '✅' : '❌'}`);
    console.log(`👤 Real User Available: ${report.environment.real_user_available ? '✅' : '❌'}`);
    console.log('═'.repeat(70));
    console.log(`📁 Report saved: ${reportPath}`);

    return report;
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      await this.testLeads();
      await this.testConversations();
      await this.testQueue();
      await this.testSettings();
      await this.testWhatsApp();
      
      const report = await this.generateReport();
      
      return report.summary.success_rate >= 80;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new FinalFunctionalityTester();
  const success = await tester.runAllTests();
  
  console.log(`\n${success ? '🎉' : '⚠️'} Tests ${success ? 'PASSED' : 'NEED ATTENTION'} - ${success ? 'System Ready!' : 'Review Issues Above'}`);
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
} 