#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read credentials
const supabase = createClient(
  'https://ajszzemkpenbfnghqiyz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc3p6ZW1rcGVuYmZuZ2hxaXl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzI5NzQsImV4cCI6MjA2MjkwODk3NH0.cyTX4-5zmeZs9OKuqo8mMNPeQIpcq6ni8LjwaauB1Gc'
);

async function diagnosePerformance() {
  try {
    console.log('🔍 PERFORMANCE DIAGNOSTIC: Why are projects loading slowly?');
    console.log('='.repeat(60));

    // 1. Test auth
    console.log('\n1. 🔐 Testing Authentication Speed...');
    const authStart = Date.now();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@test.test',
      password: 'testtesttest'
    });
    const authTime = Date.now() - authStart;
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log(`✅ Auth successful (${authTime}ms)`);

    // 2. Test the current query chain (what's slow)
    console.log('\n2. 🐌 Testing Current Query Chain...');
    
    // Step 1: Get client memberships
    const step1Start = Date.now();
    const { data: memberships, error: memberError } = await supabase
      .from('client_members')
      .select('client_id')
      .eq('user_id', authData.user.id);
    const step1Time = Date.now() - step1Start;
    
    if (memberError) {
      console.log('❌ Client memberships failed:', memberError.message);
      return;
    }
    
    console.log(`   Step 1: Client memberships (${step1Time}ms) - ${memberships.length} found`);

    // Step 2: Get projects
    const step2Start = Date.now();
    const clientIds = memberships.map(m => m.client_id);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('client_id', clientIds);
    const step2Time = Date.now() - step2Start;
    
    if (projectsError) {
      console.log('❌ Projects query failed:', projectsError.message);
      return;
    }
    
    console.log(`   Step 2: Projects (${step2Time}ms) - ${projects.length} found`);

    // Step 3: Get leads for each project (this is what's slow)
    const step3Start = Date.now();
    const projectIds = projects.map(p => p.id);
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, current_project_id, status')
      .in('current_project_id', projectIds);
    const step3Time = Date.now() - step3Start;
    
    if (leadsError) {
      console.log('❌ Leads query failed:', leadsError.message);
    } else {
      console.log(`   Step 3: Leads (${step3Time}ms) - ${leads.length} found`);
    }

    const totalTime = step1Time + step2Time + step3Time;
    console.log(`   📊 Total Chain Time: ${totalTime}ms`);

    // 3. Test optimized single query
    console.log('\n3. 🚀 Testing Optimized Single Query...');
    
    const optimizedStart = Date.now();
    const { data: optimizedData, error: optimizedError } = await supabase
      .from('client_members')
      .select(`
        client_id,
        clients!inner(
          id,
          name,
          projects(
            id,
            name,
            status,
            created_at,
            updated_at
          )
        )
      `)
      .eq('user_id', authData.user.id);
    const optimizedTime = Date.now() - optimizedStart;
    
    if (optimizedError) {
      console.log('❌ Optimized query failed:', optimizedError.message);
    } else {
      // Flatten the results
      const optimizedProjects = optimizedData.flatMap(member => 
        member.clients.projects.map(project => ({
          ...project,
          client_name: member.clients.name
        }))
      );
      
      console.log(`✅ Optimized query (${optimizedTime}ms) - ${optimizedProjects.length} projects`);
      console.log(`   🎯 Performance improvement: ${Math.round(((totalTime - optimizedTime) / totalTime) * 100)}% faster`);
    }

    // 4. Test network latency
    console.log('\n4. 🌐 Testing Network Latency...');
    
    const pingStart = Date.now();
    const { data: pingData, error: pingError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    const pingTime = Date.now() - pingStart;
    
    console.log(`   Network ping: ${pingTime}ms`);

    // 5. Analysis
    console.log('\n5. 📈 PERFORMANCE ANALYSIS:');
    console.log('─'.repeat(40));
    
    if (totalTime > 1000) {
      console.log('❌ SLOW LOADING DETECTED:');
      console.log('   • Current method takes:', totalTime + 'ms');
      console.log('   • Optimized method takes:', optimizedTime + 'ms');
      console.log('   • Root cause: Multiple sequential queries');
    } else {
      console.log('✅ Loading performance is acceptable');
    }

    console.log('\n6. 🔧 RECOMMENDED FIXES:');
    console.log('─'.repeat(40));
    console.log('1. Use JOIN queries instead of multiple queries');
    console.log('2. Implement proper caching with longer TTL');
    console.log('3. Add loading states to improve user experience');
    console.log('4. Consider background preloading');
    
  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  }
}

diagnosePerformance(); 