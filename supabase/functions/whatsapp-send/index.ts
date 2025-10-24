import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// WhatsApp Message Sending Service
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`WhatsApp send service ${requestId} - ${req.method} request received`)

    if (req.method === 'POST') {
      const body = await req.json()
      console.log('Request body:', body)
      
      // Handle different actions
      if (body.action === 'send_template') {
        // Template message sending
        if (!body.to || !body.template_name) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields for template: to, template_name' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          const result = await sendWhatsAppTemplate({
            to: body.to,
            templateName: body.template_name,
            languageCode: body.language_code || 'en_US',
            accessToken: Deno.env.get('WHATSAPP_ACCESS_TOKEN')!,
            phoneNumberId: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!,
            requestId
          })

          // Store template message in database
          await storeOutboundMessage(supabase, {
            to: body.to,
            message: `Template: ${body.template_name}`,
            type: 'template',
            messageId: result.messageId,
            requestId
          })

          return new Response(
            JSON.stringify({ 
              success: true, 
              messageId: result.messageId,
              processingTime: Date.now() - startTime
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )

        } catch (error) {
          console.error(`Failed to send template ${requestId}:`, error)
          return new Response(
            JSON.stringify({ 
              error: 'Failed to send template message',
              details: error.message 
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Original text message handling
      if (!body.to || !body.message) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: to, message' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get WhatsApp API credentials from environment
      const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
      const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

      console.log('WhatsApp credentials check:', {
        hasAccessToken: !!accessToken,
        hasPhoneNumberId: !!phoneNumberId,
        accessTokenLength: accessToken?.length || 0,
        phoneNumberIdLength: phoneNumberId?.length || 0
      })

      if (!accessToken || !phoneNumberId) {
        console.error('Missing WhatsApp credentials:', {
          accessToken: accessToken ? 'Present' : 'Missing',
          phoneNumberId: phoneNumberId ? 'Present' : 'Missing',
          envVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('WHATSAPP'))
        })
        
        return new Response(
          JSON.stringify({ 
            error: 'WhatsApp API credentials not configured',
            details: {
              accessToken: !!accessToken,
              phoneNumberId: !!phoneNumberId,
              availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('WHATSAPP'))
            }
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Send message via WhatsApp Business API
        const result = await sendWhatsAppMessage({
          to: body.to,
          message: body.message,
          type: body.type || 'text',
          accessToken,
          phoneNumberId,
          requestId
        })

        // Store outbound message in database
        await storeOutboundMessage(supabase, {
          to: body.to,
          message: body.message,
          type: body.type || 'text',
          messageId: result.messageId,
          requestId
        })

        const processingTime = Date.now() - startTime
        console.log(`Message sent successfully ${requestId}:`, {
          to: body.to,
          messageId: result.messageId,
          processingTimeMs: processingTime
        })

        return new Response(
          JSON.stringify({ 
            success: true, 
            messageId: result.messageId,
            processingTime 
          }),
          { 
            status: 200, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Request-ID': requestId,
              'X-Processing-Time': processingTime.toString()
            } 
          }
        )

      } catch (error) {
        console.error(`Failed to send message ${requestId}:`, error)
        
        return new Response(
          JSON.stringify({ 
            error: 'Failed to send message',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    if (req.method === 'GET') {
      // Health check endpoint
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          service: 'whatsapp-send',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`Critical error in send service ${requestId}:`, error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
          'X-Processing-Time': processingTime.toString(),
        }
      }
    )
  }
})

// Send message via WhatsApp Business API
async function sendWhatsAppMessage({
  to,
  message,
  type,
  accessToken,
  phoneNumberId,
  requestId
}: {
  to: string
  message: string
  type: string
  accessToken: string
  phoneNumberId: string
  requestId: string
}): Promise<{ messageId: string }> {
  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  
  // Prepare message payload based on type
  let messagePayload: any = {
    messaging_product: 'whatsapp',
    to: to,
    type: type
  }

  if (type === 'text') {
    messagePayload.text = { body: message }
  } else if (type === 'template') {
    // Template message format
    messagePayload.template = {
      name: message, // message should be template name
      language: { code: 'en_US' }
    }
  }

  console.log(`Sending WhatsApp message ${requestId}:`, {
    to,
    type,
    url: apiUrl
  })

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messagePayload)
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error(`WhatsApp API error ${requestId}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    })
    throw new Error(`WhatsApp API error: ${response.status} - ${errorData}`)
  }

  const result = await response.json()
  console.log(`WhatsApp API response ${requestId}:`, result)

  if (!result.messages || result.messages.length === 0) {
    throw new Error('No message ID returned from WhatsApp API')
  }

  return { messageId: result.messages[0].id }
}

// Send template message via WhatsApp Business API
async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode,
  accessToken,
  phoneNumberId,
  requestId
}: {
  to: string
  templateName: string
  languageCode: string
  accessToken: string
  phoneNumberId: string
  requestId: string
}): Promise<{ messageId: string }> {
  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
  
  const messagePayload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode }
    }
  }

  console.log(`Sending WhatsApp template ${requestId}:`, {
    to,
    templateName,
    languageCode,
    url: apiUrl
  })

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messagePayload)
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error(`WhatsApp template API error ${requestId}:`, {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    })
    throw new Error(`WhatsApp template API error: ${response.status} - ${errorData}`)
  }

  const result = await response.json()
  console.log(`WhatsApp template API response ${requestId}:`, result)

  if (!result.messages || result.messages.length === 0) {
    throw new Error('No message ID returned from WhatsApp template API')
  }

  return { messageId: result.messages[0].id }
}

// Store outbound message in database
async function storeOutboundMessage(
  supabase: any,
  {
    to,
    message,
    type,
    messageId,
    requestId
  }: {
    to: string
    message: string
    type: string
    messageId: string
    requestId: string
  }
): Promise<void> {
  console.log(`Storing outbound message ${requestId}:`, {
    to,
    messageId,
    type
  })

  const messageData = {
    message_id: messageId,
    phone_number: to,
    direction: 'outbound',
    content: message,
    message_type: type,
    status: 'sent',
    timestamp: new Date().toISOString(),
    phone_number_id: Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'),
    is_automated: false
  }

  const { data, error } = await supabase
    .from('whatsapp_messages')
    .insert(messageData)

  if (error) {
    console.error(`Database storage failed for outbound message ${messageId}:`, error)
    throw new Error(`Database storage failed: ${error.message}`)
  }

  console.log(`Outbound message ${messageId} stored in database successfully`)

  // Update conversation if exists
  await updateConversationForOutbound(supabase, to, requestId)
}

// Update conversation for outbound message
async function updateConversationForOutbound(
  supabase: any,
  phoneNumber: string,
  requestId: string
): Promise<void> {
  // Find active conversation
  const { data: conversations, error: findError } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_phone', phoneNumber)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)

  if (findError) {
    console.error(`Error finding conversation for outbound message:`, findError)
    return
  }

  if (conversations && conversations.length > 0) {
    const conversationId = conversations[0].id
    
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    if (updateError) {
      console.error(`Failed to update conversation for outbound message:`, updateError)
    } else {
      console.log(`Conversation ${conversationId} updated for outbound message`)
    }
  }
} 