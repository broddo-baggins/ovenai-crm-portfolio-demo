// @ts-nocheck
// This is a Deno Edge Function - TypeScript errors are expected in Node.js environment
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-calendly-webhook-signature',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

console.log("Calendly Webhook Handler Loaded!")

// Calendly Webhook Handler for Real-time Meeting Events
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = `calendly_webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`Calendly webhook ${requestId} - ${req.method} request received`)

    if (req.method === 'GET') {
      // Health check endpoint
      return new Response('Calendly webhook endpoint is healthy', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    if (req.method === 'POST') {
      // Get webhook signature for verification
      const signature = req.headers.get('x-calendly-webhook-signature')
      const body = await req.text()
      
      // Verify webhook signature (in production)
      const webhookSecret = Deno.env.get('CALENDLY_WEBHOOK_SECRET')
      if (webhookSecret && signature) {
        // TODO: Add signature verification using crypto
        // const isValid = await verifyWebhookSignature(body, signature, webhookSecret)
        // if (!isValid) {
        //   return new Response('Unauthorized', { status: 401, headers: corsHeaders })
        // }
      }

      // Parse webhook data
      let webhookData: any
      try {
        webhookData = JSON.parse(body)
      } catch (error) {
        console.error(`Failed to parse Calendly webhook JSON ${requestId}:`, error)
        return new Response('Bad Request', { status: 400, headers: corsHeaders })
      }

      console.log(`Processing Calendly webhook ${requestId}:`, {
        event: webhookData.event,
        created_by: webhookData.created_by,
        payload_type: webhookData.payload?.object
      })

      const result = {
        success: true,
        event_processed: webhookData.event,
        notifications_sent: 0,
        lead_updates: 0,
        errors: [] as string[]
      }

      // Process different Calendly events
      switch (webhookData.event) {
        case 'invitee.created':
          await handleMeetingScheduled(supabase, webhookData, result, requestId)
          break
        case 'invitee.canceled':
          await handleMeetingCanceled(supabase, webhookData, result, requestId)
          break
        case 'invitee.no_show':
          await handleMeetingNoShow(supabase, webhookData, result, requestId)
          break
        case 'invitee.rescheduled':
          await handleMeetingRescheduled(supabase, webhookData, result, requestId)
          break
        default:
          console.log(`Unhandled Calendly event: ${webhookData.event}`)
          result.errors.push(`Unhandled event type: ${webhookData.event}`)
      }

      if (result.errors.length > 0) {
        result.success = false
      }

      const processingTime = Date.now() - startTime
      console.log(`Calendly webhook ${requestId} processing completed:`, {
        ...result,
        processingTimeMs: processingTime
      })

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Processing-Time': processingTime.toString(),
        }
      })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Critical error in Calendly webhook ${requestId}:`, error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Processing-Time': processingTime.toString(),
      }
    })
  }
})

// Handle meeting scheduled event
async function handleMeetingScheduled(
  supabase: any,
  webhookData: any,
  result: any,
  requestId: string
): Promise<void> {
  try {
    const { payload } = webhookData
    const invitee = payload.invitee
    const event = payload.event

    console.log(`Processing meeting scheduled for ${invitee.name} (${invitee.email})`)

    // Try to find matching lead by phone (email functionality deprecated)
    const { data: leads, error: leadError } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, status, bant_status, current_project_id')
      .eq('phone', invitee.phone || invitee.email) // Fallback to email as phone if phone not available
      .limit(1)

    if (leadError) {
      console.error(`Error finding lead for ${invitee.email}:`, leadError)
      result.errors.push(`Failed to find lead: ${leadError.message}`)
      return
    }

    let leadUpdate = null
    if (leads && leads.length > 0) {
      const lead = leads[0]
      
      // Update lead status to "burning" since they scheduled a meeting
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          bant_status: 'burning',
          status: 'demo_scheduled',
          last_interaction: new Date().toISOString(),
          state_status_metadata: {
            ...lead.state_status_metadata,
            calendly_meeting_scheduled: {
              event_uri: event.uri,
              scheduled_at: new Date().toISOString(),
              meeting_start: event.start_time,
              invitee_name: invitee.name
            }
          }
        })
        .eq('id', lead.id)

      if (updateError) {
        console.error(`Error updating lead ${lead.id}:`, updateError)
        result.errors.push(`Failed to update lead: ${updateError.message}`)
      } else {
        result.lead_updates++
        leadUpdate = {
          lead_id: lead.id,
          old_status: lead.bant_status,
          new_status: 'burning'
        }
      }
    }

    // Create notification for the user
    const notificationData = {
      id: crypto.randomUUID(),
      user_id: webhookData.created_by, // Calendly user who owns the event type
      title: "🔥 BANT Meeting Scheduled!",
      message: `${invitee.name} scheduled a meeting for ${new Date(event.start_time).toLocaleDateString()}. Lead automatically promoted to BURNING status.`,
      type: 'success',
      read: false,
      action_url: `/calendar?event=${event.uri.split('/').pop()}`,
      metadata: {
        category: 'calendly_meeting',
        priority: 'high',
        event_type: 'meeting_scheduled',
        invitee_email: invitee.email,
        meeting_uri: event.uri,
        meeting_start: event.start_time,
        lead_update: leadUpdate
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (notifError) {
      console.error(`Failed to create notification:`, notifError)
      result.errors.push(`Notification failed: ${notifError.message}`)
    } else {
      result.notifications_sent++
    }

    console.log(`Meeting scheduled processing completed for ${requestId}`)

  } catch (error) {
    console.error(`Error handling meeting scheduled:`, error)
    result.errors.push(`Meeting scheduled handler failed: ${error.message}`)
  }
}

// Handle meeting canceled event
async function handleMeetingCanceled(
  supabase: any,
  webhookData: any,
  result: any,
  requestId: string
): Promise<void> {
  try {
    const { payload } = webhookData
    const invitee = payload.invitee
    const event = payload.event

    console.log(`Processing meeting canceled for ${invitee.name} (${invitee.email})`)

    // Find lead and potentially downgrade status
    const { data: leads } = await supabase
      .from('leads')
      .select('id, first_name, last_name, phone, bant_status')
      .eq('phone', invitee.phone || invitee.email) // Fallback to email as phone if phone not available
      .limit(1)

    if (leads && leads.length > 0) {
      const lead = leads[0]
      
      // Downgrade from burning back to hot
      if (lead.bant_status === 'burning') {
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            bant_status: 'hot',
            status: 'qualified',
            last_interaction: new Date().toISOString()
          })
          .eq('id', lead.id)

        if (!updateError) {
          result.lead_updates++
        }
      }
    }

    // Create notification
    const notificationData = {
      id: crypto.randomUUID(),
      user_id: webhookData.created_by,
      title: "❌ Meeting Canceled",
      message: `${invitee.name} canceled their meeting. Follow up recommended.`,
      type: 'warning',
      read: false,
      action_url: `/leads?search=${invitee.email}`,
      metadata: {
        category: 'calendly_meeting',
        priority: 'medium',
        event_type: 'meeting_canceled',
        invitee_email: invitee.email,
        canceled_reason: payload.cancellation?.reason
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (!notifError) {
      result.notifications_sent++
    }

  } catch (error) {
    console.error(`Error handling meeting canceled:`, error)
    result.errors.push(`Meeting canceled handler failed: ${error.message}`)
  }
}

// Handle meeting no-show event
async function handleMeetingNoShow(
  supabase: any,
  webhookData: any,
  result: any,
  requestId: string
): Promise<void> {
  try {
    const { payload } = webhookData
    const invitee = payload.invitee

    // Create high-priority notification for no-show
    const notificationData = {
      id: crypto.randomUUID(),
      user_id: webhookData.created_by,
      title: "⚠️ Meeting No-Show",
      message: `${invitee.name} was a no-show for their meeting. Immediate follow-up required.`,
      type: 'error',
      read: false,
      action_url: `/leads?search=${invitee.email}`,
      metadata: {
        category: 'calendly_meeting',
        priority: 'urgent',
        event_type: 'meeting_no_show',
        invitee_email: invitee.email
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (!notifError) {
      result.notifications_sent++
    }

  } catch (error) {
    console.error(`Error handling meeting no-show:`, error)
    result.errors.push(`Meeting no-show handler failed: ${error.message}`)
  }
}

// Handle meeting rescheduled event
async function handleMeetingRescheduled(
  supabase: any,
  webhookData: any,
  result: any,
  requestId: string
): Promise<void> {
  try {
    const { payload } = webhookData
    const invitee = payload.invitee
    const event = payload.event

    // Create notification for reschedule
    const notificationData = {
      id: crypto.randomUUID(),
      user_id: webhookData.created_by,
      title: "📅 Meeting Rescheduled",
      message: `${invitee.name} rescheduled their meeting to ${new Date(event.start_time).toLocaleDateString()}.`,
      type: 'info',
      read: false,
      action_url: `/calendar?event=${event.uri.split('/').pop()}`,
      metadata: {
        category: 'calendly_meeting',
        priority: 'medium',
        event_type: 'meeting_rescheduled',
        invitee_email: invitee.email,
        new_meeting_time: event.start_time
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)

    if (!notifError) {
      result.notifications_sent++
    }

  } catch (error) {
    console.error(`Error handling meeting rescheduled:`, error)
    result.errors.push(`Meeting rescheduled handler failed: ${error.message}`)
  }
} 