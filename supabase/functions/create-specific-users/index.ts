import { createClient } from '@supabase/supabase-js';

// Headers for CORS
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to generate a secure password
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  // Ensure at least one uppercase, one lowercase, one number, and one special character
  password += 'A'; // Uppercase
  password += 'a'; // Lowercase
  password += '1'; // Number
  password += '!'; // Special character
  
  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export default async function(req: Request) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Check Authorization header
  const serviceRoleKeyFromEnv = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); // Renamed to avoid conflict
  if (!serviceRoleKeyFromEnv || req.headers.get('authorization') !== `Bearer ${serviceRoleKeyFromEnv}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 401,
    });
  }
  
  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Users to create
    const usersToCreate = [
      { email: 'vladtzadik@gmail.com', name: 'Vlad Tzadik' },
      { email: 'demo@example.com', name: 'DemoAgent Neuroscience' }
    ];
    
    const results: { email: string; name: string; temporary_password: string; status: string; role: string; }[] = [];
    
    // Get Self-Serve client
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('name', 'Self-Serve')
      .single();
      
    if (clientError) {
      throw clientError;
    }
    
    const clientId = clientData.id;
    
    // Create each user
    for (const userData of usersToCreate) {
      const password = generateSecurePassword();
      
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers({
        filter: { email: userData.email }
      });
      
      let userId;
      
      if (existingUser && existingUser.users.length > 0) {
        // User exists, update them
        userId = existingUser.users[0].id;
        
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            password,
            user_metadata: {
              name: userData.name,
              role: 'STAFF',
              status: 'ACTIVE',
            }
          }
        );
        
        if (updateError) throw updateError;
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            role: 'STAFF',
            status: 'ACTIVE',
          }
        });
        
        if (createError) throw createError;
        userId = newUser.user.id;
      }
      
      // Check if user exists in public.users table
      const { data: publicUser, error: publicUserError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
        
      if (publicUserError && publicUserError.code !== 'PGRST116') {
        throw publicUserError;
      }
      
      if (!publicUser) {
        // Create or update entry in users table
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            email: userData.email,
            name: userData.name,
            role: 'STAFF',
            status: 'ACTIVE',
            client_id: clientId
          });
          
        if (insertError) throw insertError;
      } else {
        // Update existing user in users table
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            email: userData.email,
            name: userData.name,
            role: 'STAFF',
            status: 'ACTIVE',
            client_id: clientId
          })
          .eq('id', userId);
          
        if (updateError) throw updateError;
      }
      
      results.push({
        email: userData.email,
        name: userData.name,
        temporary_password: password,
        status: 'ACTIVE',
        role: 'STAFF'
      });
    }
    
    return new Response(
      JSON.stringify({ 
        message: 'Users created successfully', 
        users: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error creating users:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create users' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
