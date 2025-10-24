// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

console.log("Hello from Functions!")

// WhatsApp Webhook Handler for Meta Business API
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  try {
    // Initialize Supabase client (using Master/Agent DB for business data)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`WhatsApp webhook ${requestId} - ${req.method} request received`)

    if (req.method === 'GET') {
      // Handle webhook verification from Meta
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      const VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'ovenai_webhook_verify_token'

      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log(`Webhook verification successful for ${requestId}`)
        return new Response(challenge, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.log(`Webhook verification failed for ${requestId}`, { mode, token })
        return new Response('Forbidden', { status: 403 })
      }
    }

    if (req.method === 'POST') {
      // Handle incoming webhook messages
      const body = await req.text()
      
      // Parse webhook data
      let webhookData: any
      try {
        webhookData = JSON.parse(body)
      } catch (error) {
        console.error(`Failed to parse webhook JSON ${requestId}:`, error)
        return new Response('Bad Request', { status: 400, headers: corsHeaders })
      }

      console.log(`Processing webhook data ${requestId}:`, {
        object: webhookData.object,
        entryCount: webhookData.entry?.length || 0
      })

      // Validate webhook structure
      if (!webhookData.entry || webhookData.entry.length === 0) {
        console.log(`No entry data in webhook ${requestId}`)
        return new Response('OK', { status: 200, headers: corsHeaders })
      }

      const result = {
        success: true,
        processedMessages: 0,
        processedStatuses: 0,
        errors: [] as string[]
      }

      // Process each entry
      for (const entry of webhookData.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const { messages, statuses, contacts, metadata } = change.value

            // Process incoming messages
            if (messages && messages.length > 0) {
              for (const message of messages) {
                try {
                  await processIncomingMessage(supabase, message, metadata, contacts, requestId)
                  result.processedMessages++
                  console.log(`Message ${message.id} processed successfully`)
                } catch (error) {
                  const errorMsg = `Failed to process message ${message.id}: ${error.message}`
                  result.errors.push(errorMsg)
                  console.error(errorMsg, error)
                }
              }
            }

            // Process message status updates
            if (statuses && statuses.length > 0) {
              for (const status of statuses) {
                try {
                  await processMessageStatus(supabase, status, requestId)
                  result.processedStatuses++
                  console.log(`Status ${status.id} processed successfully`)
                } catch (error) {
                  const errorMsg = `Failed to process status ${status.id}: ${error.message}`
                  result.errors.push(errorMsg)
                  console.error(errorMsg, error)
                }
              }
            }
          }
        }
      }

      if (result.errors.length > 0) {
        result.success = false
      }

      const processingTime = Date.now() - startTime
      console.log(`Webhook ${requestId} processing completed:`, {
        ...result,
        processingTimeMs: processingTime
      })

      // Always return 200 to acknowledge receipt to Meta
      return new Response('OK', {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'X-Request-ID': requestId,
          'X-Processing-Time': processingTime.toString(),
        }
      })
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Critical error in webhook ${requestId}:`, error)
    
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        ...corsHeaders,
        'X-Request-ID': requestId,
        'X-Processing-Time': processingTime.toString(),
      }
    })
  }
})

// Process incoming WhatsApp message
async function processIncomingMessage(
  supabase: any,
  message: any,
  metadata: any,
  contacts: any[] | undefined,
  requestId: string
): Promise<void> {
  console.log(`Processing message ${message.id} in ${requestId}:`, {
    from: message.from,
    type: message.type,
    hasText: !!message.text?.body
  })

  // Store message in database
  const messageData = {
    message_id: message.id,
    phone_number: message.from,
    direction: 'inbound',
    content: extractMessageContent(message),
    message_type: message.type,
    status: 'received',
    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
    phone_number_id: metadata?.phone_number_id,
    webhook_data: { message, metadata, contacts }
  }

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert(messageData)

  if (error) {
    console.error(`Database storage failed for message ${message.id}:`, error)
    throw new Error(`Database storage failed: ${error.message}`)
  }

  console.log(`Message ${message.id} stored in database successfully`)

  // Find or create conversation
  let conversation = await findOrCreateConversation(supabase, message.from, requestId)

  // Generate automated response for text messages
  if (message.type === 'text' && message.text?.body) {
    const response = await generateAutomatedResponse(message.text.body, conversation)
    
    if (response) {
      console.log(`Generated auto-response for message ${message.id}: ${response}`)
      
      // Store outbound response message
      const responseData = {
        message_id: `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phone_number: message.from,
        direction: 'outbound',
        content: response,
        message_type: 'text',
        status: 'pending_send',
        timestamp: new Date().toISOString(),
        phone_number_id: metadata?.phone_number_id,
        conversation_id: conversation.id,
        is_automated: true
      }

      const { error: responseError } = await supabase
        .from('whatsapp_messages')
        .insert(responseData)

      if (responseError) {
        console.error(`Failed to store auto-response:`, responseError)
      } else {
        console.log(`Auto-response stored for message ${message.id}`)
      }
    }
  }

  // Update conversation with latest message
  await updateConversation(supabase, conversation.id, message, requestId)
}

// Process message status update
async function processMessageStatus(
  supabase: any,
  status: any,
  requestId: string
): Promise<void> {
  console.log(`Processing status update ${status.id} in ${requestId}:`, {
    status: status.status,
    recipientId: status.recipient_id
  })

  const { error } = await supabase
    .from('whatsapp_messages')
    .update({
      status: status.status,
      status_updated_at: new Date(parseInt(status.timestamp) * 1000).toISOString()
    })
    .eq('message_id', status.id)

  if (error) {
    console.error(`Failed to update message status ${status.id}:`, error)
    throw new Error(`Status update failed: ${error.message}`)
  }

  console.log(`Message status ${status.id} updated successfully`)
}

// Find or create conversation
async function findOrCreateConversation(
  supabase: any,
  phoneNumber: string,
  requestId: string
): Promise<any> {
  // First try to find existing conversation
  const { data: existing, error: findError } = await supabase
    .from('conversations')
    .select('*')
    .eq('participant_phone', phoneNumber)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (findError) {
    console.error(`Error finding conversation for ${phoneNumber}:`, findError)
  }

  if (existing && existing.length > 0) {
    console.log(`Found existing conversation for ${phoneNumber}:`, existing[0].id)
    return existing[0]
  }

  // Create new conversation
  const conversationData = {
    participant_phone: phoneNumber,
    status: 'active',
    started_at: new Date().toISOString(),
    last_message_at: new Date().toISOString(),
    message_count: 0
  }

  const { data: newConversation, error: createError } = await supabase
    .from('conversations')
    .insert(conversationData)
    .select()
    .single()

  if (createError) {
    console.error(`Failed to create conversation for ${phoneNumber}:`, createError)
    throw new Error(`Conversation creation failed: ${createError.message}`)
  }

  console.log(`Created new conversation for ${phoneNumber}:`, newConversation.id)
  return newConversation
}

// Update conversation with latest message
async function updateConversation(
  supabase: any,
  conversationId: string,
  message: any,
  requestId: string
): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({
      last_message_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      message_count: supabase.rpc('increment_message_count', { conversation_id: conversationId })
    })
    .eq('id', conversationId)

  if (error) {
    console.error(`Failed to update conversation ${conversationId}:`, error)
  } else {
    console.log(`Conversation ${conversationId} updated successfully`)
  }
}

// Extract message content based on type
function extractMessageContent(message: any): string {
  switch (message.type) {
    case 'text':
      return message.text?.body || ''
    case 'image':
      return '[Image received]'
    case 'audio':
      return '[Audio received]'
    case 'video':
      return '[Video received]'
    case 'document':
      return `[Document: ${message.document?.filename || 'Unknown'}]`
    case 'location':
      return '[Location shared]'
    default:
      return `[${message.type} message]`
  }
}

// Generate automated response based on message content
async function generateAutomatedResponse(
  messageContent: string,
  conversation: any
): Promise<string | null> {
  const content = messageContent.toLowerCase().trim()

  // Simple keyword-based responses (can be enhanced with AI later)
  if (content.includes('hello') || content.includes('hi') || content.includes('hey')) {
    return "Hello! Thanks for reaching out. How can I help you today?"
  }

  if (content.includes('price') || content.includes('cost') || content.includes('how much')) {
    return "I'd be happy to help you with pricing information. Let me connect you with our team for detailed pricing."
  }

  if (content.includes('info') || content.includes('information') || content.includes('details')) {
    return "I'll provide you with more information. What specifically would you like to know about?"
  }

  if (content.includes('schedule') || content.includes('meeting') || content.includes('appointment')) {
    return "Great! I can help you schedule a meeting. What time works best for you?"
  }

  if (content.includes('help') || content.includes('support')) {
    return "I'm here to help! Please let me know what you need assistance with."
  }

  // For conversation starters or first messages
  if (conversation.message_count === 0) {
    return "Thanks for your message! We'll get back to you shortly. In the meantime, feel free to let us know how we can help."
  }

  // Default: no automated response for complex messages
  return null
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/whatsapp-webhook' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
