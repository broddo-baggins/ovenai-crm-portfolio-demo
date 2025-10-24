import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { userId, reason, requestType } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user information
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the deletion request
    const { error: logError } = await supabaseAdmin
      .from('data_deletion_requests')
      .insert({
        user_id: userId,
        email: user.user.email || '',
        reason: reason || 'No reason provided',
        status: requestType === 'immediate' ? 'approved' : 'pending',
        request_type: requestType || 'manual_review',
        reviewed_by: requestType === 'immediate' ? userId : null,
        reviewed_at: requestType === 'immediate' ? new Date().toISOString() : null,
        completed_at: requestType === 'immediate' ? new Date().toISOString() : null
      })

    if (logError) {
      console.error('Error logging deletion request:', logError)
    }

    if (requestType === 'immediate') {
      // For immediate deletion, delete user data and account
      
      // 1. Delete user's data from public tables (cascade will handle most)
      // The foreign key constraints with CASCADE will handle:
      // - leads (via user_id)
      // - projects (via user_id) 
      // - notifications (via user_id)
      // - profiles (via id reference to auth.users)
      
      // 2. Delete user from auth.users (this will cascade to public.users if exists)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (deleteError) {
        console.error('Error deleting user account:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Failed to delete user account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Log successful completion
      console.log(`User account ${userId} (${user.user.email}) successfully deleted`)
      
      return new Response(
        JSON.stringify({ 
          message: 'Account deleted successfully',
          userId: userId,
          deletedAt: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      // For manual review requests, just log the request
      return new Response(
        JSON.stringify({ 
          message: 'Deletion request submitted for review',
          userId: userId,
          status: 'pending'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in delete-user-account function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 