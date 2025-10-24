// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// @ts-nocheck
// Setup type definitions for built-in Supabase Runtime APIs
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"

// Declare Deno global for TypeScript
declare const Deno: {
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

console.log("Lead Management Function Loaded!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TemperatureUpdate {
  lead_id: string
  new_temperature: number
  reason: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (method) {
      case 'GET':
        return await handleGetLeads(supabaseClient, url)
      
      case 'POST':
        if (path === 'temperature') {
          return await handleTemperatureUpdate(supabaseClient, req)
        } else if (path === 'heat-status') {
          return await handleHeatStatusCalculation(supabaseClient, req)
        } else {
          return await handleCreateLead(supabaseClient, req)
        }
      
      case 'PUT':
        return await handleUpdateLead(supabaseClient, req)
      
      default:
        return new Response('Method not allowed', { 
          status: 405,
          headers: corsHeaders 
        })
    }
  } catch (error) {
    console.error('Lead management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function handleGetLeads(supabaseClient: SupabaseClient, url: URL) {
  const projectId = url.searchParams.get('current_project_id') || url.searchParams.get('project_id')  // ✅ STANDARDIZED: Support both for backward compatibility
  
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'current_project_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: leads, error } = await supabaseClient
    .from('leads')
    .select(`
      *,
      conversations:conversations(count),
      messages:whatsapp_messages(count)
    `)
    .eq('current_project_id', projectId)  // ✅ STANDARDIZED: now uses current_project_id
    .order('created_at', { ascending: false })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Calculate heat status for each lead
  const leadsWithHeat = leads.map((lead: Record<string, any>) => ({
    ...lead,
    heat_status: calculateHeatStatus(lead),
    message_count: lead.messages?.[0]?.count || 0,
    conversation_count: lead.conversations?.[0]?.count || 0
  }))

  return new Response(JSON.stringify({ leads: leadsWithHeat }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleCreateLead(supabaseClient: SupabaseClient, req: Request) {
  const leadData = await req.json()
  
  // ✅ STANDARDIZED: Support both current_project_id and project_id for backward compatibility
  const projectId = leadData.current_project_id || leadData.project_id
  if (!projectId) {
    return new Response(JSON.stringify({ error: 'current_project_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  
  // Ensure we use the standardized field name
  leadData.current_project_id = projectId
  delete leadData.project_id  // Remove old field if present

  const { data: lead, error } = await supabaseClient
    .from('leads')
    .insert([{
      ...leadData,
      temperature: leadData.temperature || 0,
      status: leadData.status || 'NEW'
    }])
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ lead }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleUpdateLead(supabaseClient: SupabaseClient, req: Request) {
  const url = new URL(req.url)
  const leadId = url.pathname.split('/').pop()
  const updateData = await req.json()

  const { data: lead, error } = await supabaseClient
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .select()
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ lead }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleTemperatureUpdate(supabaseClient: SupabaseClient, req: Request) {
  const { lead_id, new_temperature, reason }: TemperatureUpdate = await req.json()

  // Update lead temperature
  const { data: lead, error: leadError } = await supabaseClient
    .from('leads')
    .update({ 
      temperature: new_temperature,
      updated_at: new Date().toISOString()
    })
    .eq('id', lead_id)
    .select()
    .single()

  if (leadError) {
    return new Response(JSON.stringify({ error: leadError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Log temperature change (if table exists)
  try {
    await supabaseClient
      .from('lead_temperature_history')
      .insert([{
        lead_id,
        project_id: lead.project_id,
        old_temperature: lead.temperature,
        new_temperature,
        reason,
        changed_at: new Date().toISOString()
      }])
  } catch (error) {
    console.log('Temperature history logging failed (table may not exist):', error)
  }

  return new Response(JSON.stringify({ 
    lead,
    heat_status: calculateHeatStatus(lead)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function handleHeatStatusCalculation(supabaseClient: SupabaseClient, req: Request) {
  const { lead_id } = await req.json()

  const { data: lead, error } = await supabaseClient
    .from('leads')
    .select(`
      *,
      conversations:conversations(count),
      messages:whatsapp_messages(count, created_at)
    `)
    .eq('id', lead_id)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const heatStatus = calculateHeatStatus(lead)
  
  // Calculate recommended temperature based on activity
  const recommendedTemp = calculateRecommendedTemperature(lead)

  return new Response(JSON.stringify({ 
    current_temperature: lead.temperature,
    heat_status: heatStatus,
    recommended_temperature: recommendedTemp,
    message_count: lead.messages?.[0]?.count || 0,
    conversation_count: lead.conversations?.[0]?.count || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function calculateHeatStatus(lead: Record<string, any>): string {
  const temp = lead.temperature || 0
  const messageCount = lead.messages?.[0]?.count || 0
  const hasRecentActivity = checkRecentActivity(lead)

  if (temp >= 80 || (temp >= 60 && messageCount > 10)) {
    return '🔥 HOT'
  } else if (temp >= 50 || (temp >= 30 && hasRecentActivity)) {
    return '🌡️ WARM'
  } else if (temp >= 20 || messageCount > 0) {
    return '❄️ COOL'
  } else {
    return '🧊 COLD'
  }
}

function calculateRecommendedTemperature(lead: Record<string, any>): number {
  let baseTemp = lead.temperature || 0
  const messageCount = lead.messages?.[0]?.count || 0
  const hasRecentActivity = checkRecentActivity(lead)

  // Adjust based on message activity
  if (messageCount > 20) baseTemp += 20
  else if (messageCount > 10) baseTemp += 15
  else if (messageCount > 5) baseTemp += 10
  else if (messageCount > 0) baseTemp += 5

  // Adjust based on status
  if (lead.status === 'INTERESTED') baseTemp += 15
  else if (lead.status === 'MEETING_SCHEDULED') baseTemp += 25
  else if (lead.status === 'CONTACTED') baseTemp += 10

  // Adjust based on recent activity
  if (hasRecentActivity) baseTemp += 10

  return Math.min(Math.max(baseTemp, 0), 100)
}

function checkRecentActivity(lead: Record<string, any>): boolean {
  if (!lead.messages || !lead.messages[0]) return false
  
  const latestMessage = lead.messages.sort((a: Record<string, any>, b: Record<string, any>) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0]
  
  if (!latestMessage) return false
  
  const daysSinceLastMessage = Math.floor(
    (Date.now() - new Date(latestMessage.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  
  return daysSinceLastMessage <= 7
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/lead-management' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOuoJeubOTx8mgJqb0n7aUfD1qXhZkhHpwXA' \
    --header 'Content-Type: application/json' \
    --data '{"project_id":"test-project-id"}'

*/
