import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const DEFAULT_OVEN_AI_CLIENT_ID = '53a6cb3d-e173-49b0-a501-a73699ec5f86'

// This edge function creates the first admin user
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check Authorization header
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey || req.headers.get('authorization') !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }
  
  try {
    // Get the admin secret from environment variables
    const supabaseAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    
    if (!supabaseAdminKey || !supabaseUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase admin credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Create a Supabase client with the admin key
    const supabaseAdmin = createClient(supabaseUrl, supabaseAdminKey);
    
    // Create the admin user
    const email = 'admin@super-admin.com';
    const password = Deno.env.get('ADMIN_PASSWORD') || crypto.randomUUID().slice(0, 12) + '!A1';
    
    // First check if the user already exists
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (searchError) {
      throw searchError;
    }
    
    const userExists = existingUsers.users.some(user => user.email === email);
    
    if (userExists) {
      // If user exists, update their metadata to ensure they have SUPER_ADMIN role and ACTIVE status
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (userError) {
        throw userError;
      }
      
      const adminUser = users.users.find(user => user.email === email);
      
      if (adminUser) {
        // Update user metadata
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          adminUser.id,
          {
            user_metadata: {
              role: 'SUPER_ADMIN',
              name: 'Super Admin',
              status: 'ACTIVE'
            }
          }
        );
        
        if (updateError) {
          throw updateError;
        }
        
        // Also reset password to make sure it's correct
        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          adminUser.id,
          { password }
        );
        
        if (resetError) {
          throw resetError;
        }
        
        // First check if Self-Serve client exists, create it if not
        let clientId;
        const { data: clientData, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('id')
          .eq('name', 'Self-Serve')
          .single();
          
        if (clientError) {
          console.log('Creating Self-Serve client...');
          // Create the client
          const { data: newClient, error: createError } = await supabaseAdmin
            .from('clients')
            .insert({ name: 'Self-Serve' })
            .select('id')
            .single();
            
          if (createError) {
            throw createError;
          }
          
          clientId = newClient.id;
        } else {
          clientId = clientData.id;
        }
        
        // Check if user exists in public.users table
        const { data: existingUser, error: userQueryError } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', adminUser.id)
          .maybeSingle();
          
        if (userQueryError && userQueryError.code !== 'PGRST116') { // PGRST116 is "not found" error
          throw userQueryError;
        }
        
        if (!existingUser) {
          // Create the user in the users table
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .insert({ 
              id: adminUser.id,
              email: adminUser.email,
              name: 'Super Admin',
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              client_id: clientId
            });
            
          if (insertError) {
            throw insertError;
          }
        } else {
          // Update existing user in public.users
          const { error: updateUserError } = await supabaseAdmin
            .from('users')
            .update({
              email: adminUser.email,
              name: 'Super Admin',
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              client_id: clientId
            })
            .eq('id', adminUser.id);
            
          if (updateUserError) {
            throw updateUserError;
          }
        }
        
        return new Response(
          JSON.stringify({ 
            message: 'Admin user updated successfully', 
            userId: adminUser.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      return new Response(
        JSON.stringify({ message: 'User already exists but could not be updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
    
    // Create Self-Serve client if it doesn't exist
    let clientId;
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('name', 'Self-Serve')
      .maybeSingle();
      
    if (clientError && clientError.code !== 'PGRST116') {
      throw clientError;
    }
    
    if (!clientData) {
      console.log('Creating Self-Serve client...');
      // Create the client
      const { data: newClient, error: createError } = await supabaseAdmin
        .from('clients')
        .insert({ name: 'Self-Serve' })
        .select('id')
        .single();
        
      if (createError) {
        throw createError;
      }
      
      clientId = newClient.id;
    } else {
      clientId = clientData.id;
    }
    
    // Create the user with admin role
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'SUPER_ADMIN',
        name: 'Super Admin',
        status: 'ACTIVE'
      }
    });
    
    if (error) {
      throw error;
    }
    
    // Create entry in public.users table
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({ 
        id: data.user.id,
        email: data.user.email,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        client_id: clientId
      });
    
    if (userError) {
      throw userError;
            }
        
        // Create welcome notification for new user
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: data.user.id,
            client_id: DEFAULT_OVEN_AI_CLIENT_ID,
            title: 'Welcome to OvenAI!',
            message: 'Your admin account has been created successfully. Welcome to the OvenAI platform.',
            type: 'success',
            metadata: { source: 'admin_creation', priority: 'high' }
          });
        
        return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully', 
        userId: data.user.id,
        loginInfo: {
          email: email,
          password: password
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating admin user:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create admin user' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
