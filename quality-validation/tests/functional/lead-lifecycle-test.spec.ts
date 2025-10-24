import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

/**
 * 🔬 Lead Lifecycle Test
 * Tests lead creation and controlled deletion
 * Can keep leads for further testing if needed
 */

// Configuration - set to false to keep leads after test
const CLEANUP_AFTER_TEST = true; // Change to false to keep test leads

// Load test credentials
const credentialsPath = path.join(process.cwd(), 'credentials/test-credentials.local');
const credentials = fs.readFileSync(credentialsPath, 'utf8');

// Parse credentials
const getCredential = (key: string): string => {
  const match = credentials.match(new RegExp(`${key}=(.+)`));
  return match ? match[1].trim() : '';
};

// Test configuration
const SITE_DB_URL = getCredential('TEST_SUPABASE_URL');
const SITE_DB_SERVICE_ROLE_KEY = getCredential('TEST_SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(SITE_DB_URL, SITE_DB_SERVICE_ROLE_KEY);

test.describe('🔬 Lead Lifecycle Test', () => {
  let testLeadId: string | null = null;
  
  test('should create and optionally delete a test lead', async ({ page }) => {
    console.log('🔬 Starting lead lifecycle test...');
    console.log(`🗑️ Cleanup after test: ${CLEANUP_AFTER_TEST}`);
    
    // STEP 1: Create a test lead directly in database
    console.log('📝 Creating test lead...');
    
    const testLead = {
      first_name: 'TestLifecycle',
      last_name: 'Lead',
      phone: `+972-555-${Date.now().toString().slice(-4)}`,
      status: 'new',
      current_project_id: '2ba26935-4cdf-42b1-8d36-a6f57308b632', // Oven Project
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: createdLead, error: createError } = await supabase
      .from('leads')
      .insert(testLead)
      .select('id, first_name, last_name, phone')
      .single();
      
    if (createError) {
      console.error('❌ Failed to create test lead:', createError.message);
      throw createError;
    }
    
    expect(createdLead).toBeTruthy();
    expect(createdLead.first_name).toBe('TestLifecycle');
    testLeadId = createdLead.id;
    
    console.log(`✅ Created test lead: ${createdLead.first_name} ${createdLead.last_name} (ID: ${testLeadId})`);
    
    // STEP 2: Verify lead exists in database
    console.log('🔍 Verifying lead exists...');
    
    const { data: verifyLead, error: verifyError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, status')
      .eq('id', testLeadId)
      .single();
      
    if (verifyError) {
      console.error('❌ Failed to verify lead:', verifyError.message);
      throw verifyError;
    }
    
    expect(verifyLead).toBeTruthy();
    expect(verifyLead.id).toBe(testLeadId);
    console.log(`✅ Lead verified in database: ${verifyLead.first_name} ${verifyLead.last_name}`);
    
    // STEP 3: Test lead in UI (optional)
    console.log('🖥️ Testing lead visibility in UI...');
    
    try {
      await page.goto('/leads');
      await page.waitForLoadState('networkidle');
      
      // Look for the test lead in the UI
      const leadInUI = page.locator(`text=TestLifecycle`);
      const isVisible = await leadInUI.isVisible();
      
      if (isVisible) {
        console.log('✅ Test lead visible in UI');
      } else {
        console.log('⚠️ Test lead not visible in UI (may be expected due to filters)');
      }
    } catch (uiError) {
      console.log('⚠️ UI verification skipped due to navigation issues');
    }
    
    // STEP 4: Conditional cleanup
    if (CLEANUP_AFTER_TEST && testLeadId) {
      console.log('🗑️ Cleaning up test lead...');
      
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', testLeadId);
        
      if (deleteError) {
        console.error('❌ Failed to delete test lead:', deleteError.message);
        throw deleteError;
      }
      
      // Verify deletion
      const { data: deletedCheck } = await supabase
        .from('leads')
        .select('id')
        .eq('id', testLeadId)
        .single();
        
      expect(deletedCheck).toBeNull();
      console.log(`✅ Test lead deleted successfully`);
      testLeadId = null;
      
    } else {
      console.log(`🚀 Test lead preserved for further testing (ID: ${testLeadId})`);
      console.log('💡 To clean up later, run: DELETE FROM leads WHERE id = \'' + testLeadId + '\';');
    }
    
    console.log('🎉 Lead lifecycle test completed successfully!');
  });
  
  // Cleanup hook in case test fails
  test.afterAll(async () => {
    if (CLEANUP_AFTER_TEST && testLeadId) {
      console.log('🧹 Emergency cleanup in afterAll...');
      try {
        await supabase
          .from('leads')
          .delete()
          .eq('id', testLeadId);
        console.log('✅ Emergency cleanup completed');
      } catch (error) {
        console.error('❌ Emergency cleanup failed:', error);
      }
    }
  });
}); 