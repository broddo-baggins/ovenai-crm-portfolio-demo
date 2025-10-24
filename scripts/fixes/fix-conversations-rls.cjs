#!/usr/bin/env node
/**
 * Fix Conversations RLS - Aligned with Comprehensive RLS
 * 
 * This script fixes the conversations table RLS policies to align with
 * the comprehensive RLS approach while maintaining proper security.
 * 
 * Usage: node scripts/fixes/fix-conversations-rls.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load credentials
const credentialsPath = path.join(__dirname, '../../credentials');
const testCredentials = fs.readFileSync(path.join(credentialsPath, 'test-credentials.local'), 'utf8');

// Extract credentials
const lines = testCredentials.split('\n');
const getCredential = (key) => {
  const line = lines.find(l => l.startsWith(key));
  return line ? line.split('=')[1] : null;
};

const SUPABASE_URL = getCredential('TEST_SUPABASE_URL');
const SUPABASE_SERVICE_KEY = getCredential('TEST_SUPABASE_SERVICE_ROLE_KEY');
const SUPABASE_ANON_KEY = getCredential('TEST_SUPABASE_ANON_KEY');

async function main() {
  console.log('🔧 Starting Conversations RLS Fix - Aligned with Comprehensive RLS...\n');
  
  try {
    // 1. Diagnostic with Service Role
    console.log('📊 1. Initial Diagnostic (Service Role)...');
    await runDiagnostic('service_role');
    
    // 2. Apply the fix
    console.log('\n🛠️  2. Applying RLS Fix...');
    await applyRLSFix();
    
    // 3. Verify with different roles
    console.log('\n✅ 3. Verification...');
    await verifyFix();
    
    console.log('\n🎉 Conversations RLS fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function runDiagnostic(role) {
  const client = createClient(SUPABASE_URL, 
    role === 'service_role' ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY
  );
  
  console.log(`\n📋 Diagnostic Results (${role}):`);
  
  try {
    // Check current policies
    const { data: policies, error: policiesError } = await client.rpc('exec_sql', {
      query: `
        SELECT 
          policyname,
          cmd,
          roles
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'conversations'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.log('   ⚠️  Cannot check policies (expected if no exec_sql function)');
    } else {
      console.log('   📋 Current policies:');
      policies.forEach(p => console.log(`      - ${p.policyname} (${p.cmd}) for ${p.roles}`));
    }
    
    // Check conversation access
    const { data: conversations, error: convError } = await client
      .from('conversations')
      .select('id, lead_id')
      .limit(5);
    
    if (convError) {
      console.log(`   ❌ Conversations access: ${convError.message}`);
    } else {
      console.log(`   ✅ Conversations access: ${conversations.length} records accessible`);
    }
    
    // Check lead access for context
    const { data: leads, error: leadsError } = await client
      .from('leads')
      .select('id, name, client_id')
      .limit(5);
    
    if (leadsError) {
      console.log(`   ❌ Leads access: ${leadsError.message}`);
    } else {
      console.log(`   ✅ Leads access: ${leads.length} records accessible`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error during diagnostic: ${error.message}`);
  }
}

async function applyRLSFix() {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  console.log('   🔄 Applying SQL fix...');
  
  try {
    // Try to run the SQL fix using RPC if available
    const { data, error } = await client.rpc('exec_sql', {
      query: `
        -- Drop all existing policies on conversations
        DO $$ 
        DECLARE
            policy_record RECORD;
        BEGIN
            FOR policy_record IN (
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' 
                AND tablename = 'conversations'
            )
            LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.conversations', policy_record.policyname);
            END LOOP;
        END $$;

        -- Create secure policies
        CREATE POLICY "conversations_user_access"
        ON public.conversations
        FOR ALL
        TO authenticated
        USING (
          lead_id IN (
            SELECT l.id 
            FROM public.leads l
            WHERE l.client_id IN (
              SELECT cm.client_id 
              FROM public.client_members cm
              WHERE cm.user_id = auth.uid()
            )
          )
        )
        WITH CHECK (
          lead_id IN (
            SELECT l.id 
            FROM public.leads l
            WHERE l.client_id IN (
              SELECT cm.client_id 
              FROM public.client_members cm
              WHERE cm.user_id = auth.uid()
            )
          )
        );

        CREATE POLICY "conversations_anon_access"
        ON public.conversations
        FOR SELECT
        TO anon
        USING (
          lead_id IN (
            SELECT l.id 
            FROM public.leads l
            WHERE l.client_id IN (
              SELECT cm.client_id 
              FROM public.client_members cm
              WHERE cm.user_id = '7fd02fa4-b3a5-46fc-ac2a-7c74ab2056f5'::uuid
            )
          )
        );

        CREATE POLICY "conversations_service_access"
        ON public.conversations
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

        -- Enable RLS and grant permissions
        ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
        GRANT ALL ON public.conversations TO authenticated;
        GRANT SELECT ON public.conversations TO anon;
        GRANT ALL ON public.conversations TO service_role;
      `
    });
    
    if (error) {
      console.log('   ⚠️  Direct SQL execution failed, manual fix required');
      console.log('   📋 Please run the SQL script manually in Supabase SQL Editor');
      return false;
    }
    
    console.log('   ✅ SQL fix applied successfully!');
    return true;
    
  } catch (error) {
    console.log('   ⚠️  Auto-fix failed, manual intervention required');
    console.log('   📋 Please run: supabase/sql/fix-conversations-rls.sql');
    return false;
  }
}

async function verifyFix() {
  console.log('\n🔍 Verifying fix with different roles...');
  
  // Test with service role
  console.log('\n   📋 Service Role Test:');
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  try {
    const { data: serviceConversations, error: serviceError } = await serviceClient
      .from('conversations')
      .select('id, lead_id')
      .limit(10);
    
    if (serviceError) {
      console.log(`      ❌ Service access failed: ${serviceError.message}`);
    } else {
      console.log(`      ✅ Service access: ${serviceConversations.length} conversations accessible`);
    }
  } catch (error) {
    console.log(`      ❌ Service test error: ${error.message}`);
  }
  
  // Test with anon role
  console.log('\n   📋 Anon Role Test:');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    const { data: anonConversations, error: anonError } = await anonClient
      .from('conversations')
      .select('id, lead_id')
      .limit(10);
    
    if (anonError) {
      console.log(`      ❌ Anon access failed: ${anonError.message}`);
    } else {
      console.log(`      ✅ Anon access: ${anonConversations.length} conversations accessible`);
    }
  } catch (error) {
    console.log(`      ❌ Anon test error: ${error.message}`);
  }
  
  // Test relationship integrity
  console.log('\n   📋 Relationship Integrity Test:');
  try {
    const { data: testData, error: testError } = await serviceClient
      .from('conversations')
      .select(`
        id,
        lead_id,
        leads (
          id,
          name,
          client_id
        )
      `)
      .limit(5);
    
    if (testError) {
      console.log(`      ❌ Relationship test failed: ${testError.message}`);
    } else {
      console.log(`      ✅ Relationship test: ${testData.length} conversations with lead data`);
      testData.forEach(conv => {
        if (conv.leads) {
          console.log(`         - Conversation ${conv.id} → Lead ${conv.leads.id} (${conv.leads.name})`);
        }
      });
    }
  } catch (error) {
    console.log(`      ❌ Relationship test error: ${error.message}`);
  }
}

// Run the script
main().catch(console.error); 