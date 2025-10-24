#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function checkVladAdminAccess() {
  console.log('🔍 CHECKING VLAD\'S ADMIN ACCESS...');
  console.log('='.repeat(50));

  try {
    // Load credentials
    const credentialsPath = path.join(__dirname, '../../credentials/db-credentials.local.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    const supabase = createClient(
      credentials.supabase.development.url,
      credentials.supabase.development.service_role_key
    );

    // Check if Vlad exists in auth.users
    console.log('📋 CHECKING AUTH.USERS TABLE:');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    const vladAuthUser = authUsers.users.find(user => 
      user.email === 'vladtzadik@gmail.com'
    );

    if (!vladAuthUser) {
      console.log('❌ Vlad not found in auth.users table');
      console.log('📧 Email searched: vladtzadik@gmail.com');
      console.log('👥 Existing users:');
      authUsers.users.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      return;
    }

    console.log(`✅ Vlad found in auth.users:`);
    console.log(`  - ID: ${vladAuthUser.id}`);
    console.log(`  - Email: ${vladAuthUser.email}`);
    console.log(`  - Created: ${vladAuthUser.created_at}`);
    console.log(`  - Last sign in: ${vladAuthUser.last_sign_in_at || 'Never'}`);

    // Check profiles table
    console.log('\n📋 CHECKING PROFILES TABLE:');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', vladAuthUser.id)
      .single();

    if (profileError) {
      console.log('❌ Profile not found, creating one...');
      
      // Create profile for Vlad
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: vladAuthUser.id,
          email: vladAuthUser.email,
          full_name: vladAuthUser.user_metadata?.full_name || 'Vlad Tzadik',
          role: 'admin',
          admin_level: 'system_admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return;
      }

      console.log('✅ Profile created successfully:', newProfile);
    } else {
      console.log('✅ Profile found:');
      console.log(`  - Full name: ${profile.full_name}`);
      console.log(`  - Role: ${profile.role}`);
      console.log(`  - Admin level: ${profile.admin_level}`);
      console.log(`  - Status: ${profile.status}`);

      // Update profile to ensure admin access
      if (profile.role !== 'admin' || profile.admin_level !== 'system_admin') {
        console.log('⚠️ Updating profile to system admin...');
        
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            role: 'admin',
            admin_level: 'system_admin',
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', vladAuthUser.id)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating profile:', updateError);
          return;
        }

        console.log('✅ Profile updated to system admin');
      }
    }

    // Check client_members table
    console.log('\n📋 CHECKING CLIENT_MEMBERS TABLE:');
    const { data: clientMembers, error: clientError } = await supabase
      .from('client_members')
      .select('*, clients(name)')
      .eq('user_id', vladAuthUser.id);

    if (clientError) {
      console.error('❌ Error fetching client members:', clientError);
    } else if (clientMembers.length === 0) {
      console.log('⚠️ No client memberships found, adding to all clients...');
      
      // Get all clients
      const { data: allClients, error: clientsError } = await supabase
        .from('clients')
        .select('id, name');

      if (clientsError) {
        console.error('❌ Error fetching clients:', clientsError);
        return;
      }

      // Add Vlad to all clients as admin
      for (const client of allClients) {
        const { error: memberError } = await supabase
          .from('client_members')
          .insert({
            user_id: vladAuthUser.id,
            client_id: client.id,
            role: 'admin',
            permissions: { admin: true, manage_users: true, manage_settings: true },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (memberError) {
          console.error(`❌ Error adding to client ${client.name}:`, memberError);
        } else {
          console.log(`✅ Added to client: ${client.name}`);
        }
      }
    } else {
      console.log('✅ Client memberships found:');
      clientMembers.forEach(member => {
        console.log(`  - ${member.clients?.name || 'Unknown'}: ${member.role}`);
      });
    }

    // Check project_members table
    console.log('\n📋 CHECKING PROJECT_MEMBERS TABLE:');
    const { data: projectMembers, error: projectError } = await supabase
      .from('project_members')
      .select('*, projects(name)')
      .eq('user_id', vladAuthUser.id);

    if (projectError) {
      console.error('❌ Error fetching project members:', projectError);
    } else if (projectMembers.length === 0) {
      console.log('⚠️ No project memberships found, adding to all projects...');
      
      // Get all projects
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name');

      if (projectsError) {
        console.error('❌ Error fetching projects:', projectsError);
        return;
      }

      // Check existing project members to see what roles are valid
      const { data: existingMembers } = await supabase
        .from('project_members')
        .select('role')
        .limit(5);

      console.log('📋 Existing project member roles:', existingMembers?.map(m => m.role).join(', ') || 'none');

      // Add Vlad to all projects as member
      for (const project of allProjects) {
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            user_id: vladAuthUser.id,
            project_id: project.id,
            role: 'OWNER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (memberError) {
          console.error(`❌ Error adding to project ${project.name}:`, memberError);
        } else {
          console.log(`✅ Added to project: ${project.name}`);
        }
      }
    } else {
      console.log('✅ Project memberships found:');
      projectMembers.forEach(member => {
        console.log(`  - ${member.projects?.name || 'Unknown'}: ${member.role}`);
      });
    }

    // Final verification
    console.log('\n🎯 FINAL VERIFICATION:');
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', vladAuthUser.id)
      .single();

    const { data: finalClients } = await supabase
      .from('client_members')
      .select('*, clients(name)')
      .eq('user_id', vladAuthUser.id);

    const { data: finalProjects } = await supabase
      .from('project_members')
      .select('*, projects(name)')
      .eq('user_id', vladAuthUser.id);

    console.log('✅ VLAD\'S ADMIN ACCESS SUMMARY:');
    console.log(`  - Profile: ${finalProfile?.role} (${finalProfile?.admin_level})`);
    console.log(`  - Client access: ${finalClients?.length || 0} clients`);
    console.log(`  - Project access: ${finalProjects?.length || 0} projects`);
    console.log(`  - Status: ${finalProfile?.status}`);

    if (finalProfile?.role === 'admin' && finalProfile?.admin_level === 'system_admin') {
      console.log('\n🎉 SUCCESS: Vlad has full system admin access!');
    } else {
      console.log('\n⚠️ WARNING: Vlad may not have full admin access');
    }

  } catch (error) {
    console.error('❌ Error checking Vlad\'s admin access:', error);
  }
}

// Run the check
checkVladAdminAccess()
  .then(() => {
    console.log('\n✅ Admin access check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }); 