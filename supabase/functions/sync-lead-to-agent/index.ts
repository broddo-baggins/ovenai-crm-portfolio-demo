// @supabase/functions-js
// Configuration: verify_jwt: false
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// 🍺 HMBM UNIFIED: sync-lead-to-agent
// Updated for FRONTEND_BACKEND_FIELD_SYNC_HMBM complete conformity
// ATT Reference: FRONTEND_BACKEND_SYNC_HMBM_001 (Projects_ATT owned)
// Uses HMBM unified processing state: ['pending', 'queued', 'active', 'completed', 'failed', 'archived', 'rate_limited']
// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🍺 HMBM UNIFIED sync-lead-to-agent function called')

    // 🎯 CROSS-DATABASE SYNC: Frontend (Site) → Backend (Agent) 
    const agentDbUrl = 'https://imnyrhjdoaccxenxyfam.supabase.co'  // Backend Agent DB
    const agentDbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltbnlyaGpkb2FjY3hlbnh5ZmFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3Mzg0NTAsImV4cCI6MjA2MjMxNDQ1MH0._OfgQMiBmPUdpGa1T6-OJOe-LcDUM56DJZA4GEJgtM8'  // 🔥 SMASARA: ANON KEY
    
    console.log('🔍 HMBM UNIFIED Cross-Database Configuration:')
    console.log('📊 AGENT_DB_URL:', agentDbUrl)
    console.log('📊 Cross-database sync: Frontend Site DB → Backend Agent DB')
    console.log('📊 Using HMBM unified processing state schema')

    // ✅ Create clients for cross-database operations
    const agentDB = createClient(agentDbUrl, agentDbKey)  // Backend Agent DB
    
    // For site_lead_staging updates (same database as this function)
    const siteDbUrl = Deno.env.get('SUPABASE_URL') ?? 'https://ajszzemkpenbfnghqiyz.supabase.co'
    const siteDbKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMzMjk3NCwiZXhwIjoyMDYyOTA4OTc0fQ.9xN5Ci6uErpsHx-8IwC4B8vh2cCzD39L3frKO66CSos'
    const siteDB = createClient(siteDbUrl, siteDbKey)  // Frontend Site DB

    // Parse request body
    const requestBody = await req.json()
    console.log('📤 Request received:', requestBody)

    const { 
      lead_data,           // 🔥 STANDARDIZED: was form_data
      site_staging_id, 
      priority, 
      verification_token,
      client_id,
      current_project_id   // ✅ STANDARDIZED: now uses current_project_id (was project_id)
    } = requestBody

    // 🔥 HMBM UNIFIED: Use standardized field names and structure
    const finalClientId = client_id || '06a67ac1-bfac-4527-bf73-b1909602573a'
    const finalProjectId = current_project_id || 'caa0f72f-dc92-4dc1-8bc3-7ed0ee1a7a5a'
    
    console.log('📊 Using client_id:', finalClientId)
    console.log('📊 Using current_project_id:', finalProjectId)

    // Simple verification (optional)
    if (verification_token !== 'SAMSARA_SYNC_TOKEN_2025') {
      console.log('⚠️ Invalid verification token')
    }

    // 🔍 DEBUG: Test connection to BACKEND Agent DB
    console.log('🔍 Testing BACKEND Agent DB connection with HMBM unified schema...')
    const { data: testData, error: testError } = await agentDB
      .from('agent_lead_staging')  // Backend Agent DB table
      .select('*')
      .limit(1)

    if (testError) {
      console.error('❌ Connection test failed:', testError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Database connection failed',
          details: testError.message,
          schema_version: 'HMBM Unified Processing State'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ BACKEND Agent DB connection test passed with HMBM unified schema')

    // 🎯 HMBM UNIFIED: Build standardized lead_data structure
    let standardizedLeadData = {
      first_name: lead_data.first_name,
      family_name: lead_data.family_name || lead_data.last_name,
      email: lead_data.email,
      phone: lead_data.phone || '+10000000000',
      client_id: finalClientId,
      current_project_id: finalProjectId,  // ✅ STANDARDIZED: now uses current_project_id
      source: 'frontend_sync',
      sync_metadata: {
        original_site_staging_id: site_staging_id,
        sync_timestamp: new Date().toISOString(),
        sync_source: 'hmbm_unified_function',
        processing_state_version: 'HMBM_Unified'
      }
    }

    // 🍺 HMBM UNIFIED: Use unified processing state values
    let insertData = {
      lead_data: standardizedLeadData,               // ✅ Standardized field name
      processing_state: 'pending',                   // ✅ HMBM UNIFIED: 'pending' default (was 'new_lead')
      priority: priority || 5,
      site_staging_id: site_staging_id || null,
      // ✅ Let defaults handle: queued_at, created_at, updated_at
    }

    console.log('📊 Using HMBM unified schema with processing_state: pending')

    // 📊 Insert into BACKEND agent_lead_staging with HMBM unified schema
    console.log('📊 Attempting insert into BACKEND Agent DB with HMBM unified fields:', Object.keys(insertData))
    const { data, error } = await agentDB
      .from('agent_lead_staging')
      .insert([insertData])
      .select()

    if (error) {
      console.error('❌ Agent staging insert error:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          details: 'Failed to insert into agent_lead_staging with HMBM unified schema',
          debug: {
            insert_data: insertData,
            error_code: error.code,
            error_hint: error.hint,
            schema_version: 'HMBM Unified Processing State'
          }
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Lead synced to BACKEND agent_lead_staging with HMBM unified schema:', data?.[0]?.id)

    // 🧠🔥 HIGHER MIND: Update FRONTEND site_lead_staging with backend reference
    if (site_staging_id) {
      const { error: updateError } = await siteDB
        .from('site_lead_staging')
        .update({ 
          agent_staging_id: data?.[0]?.id,              // ✅ Backend staging ID reference
          processing_state: 'queued'                    // ✅ HMBM UNIFIED: 'queued' (staged to backend)
        })
        .eq('id', site_staging_id)

      if (updateError) {
        console.error('⚠️ Site staging update error:', updateError)
        // Continue anyway - sync was successful
      } else {
        console.log('✅ FRONTEND site staging updated with backend reference and processing_state: queued')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        agent_staging_id: data?.[0]?.id,
        message: 'Lead synced with HMBM unified processing state',
        debug: {
          schema_version: 'HMBM Unified Processing State',
          unified_processing_state: 'pending → queued',
          eliminated_fields: [
            'processing_status (eliminated)',
            'last_message_from (eliminated)'
          ],
          preserved_business_fields: [
            'state (preserved)',
            'status (preserved)', 
            'bant_status (preserved)',
            'interaction_count (preserved)'
          ],
          architecture: 'frontend-backend-unified',
          connection_test: 'passed',
          insert_success: true,
          processing_state: data?.[0]?.processing_state,
          lead_data_fields: Object.keys(data?.[0]?.lead_data || {}),
          att_reference: 'FRONTEND_BACKEND_SYNC_HMBM_001'
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('❌ Sync function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Unexpected error in HMBM unified sync function',
        schema_version: 'HMBM Unified Processing State'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 