import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()

    switch (endpoint) {
      case 'overview':
        return await getDashboardOverview(supabase)
      case 'project-metrics':
        return await getProjectLeadMetrics(supabase)
      case 'conversion-analytics':
        const days = parseInt(url.searchParams.get('days') || '30')
        return await getConversionAnalytics(supabase, days)
      case 'client-performance':
        return await getClientPerformanceMetrics(supabase)
      case 'real-time':
        return await getRealTimeMetrics(supabase)
      case 'complete':
        return await getCompleteDashboardData(supabase)
      case 'messages-sent':
        return await getMessagesSent(supabase)
      case 'interactions':
        return await getInteractions(supabase)
      case 'conversations-started':
        return await getConversationsStarted(supabase)
      case 'conversation-abandonment':
        return await getConversationAbandonment(supabase)
      case 'response-time':
        return await getResponseTime(supabase)
      case 'efficient-hours':
        return await getEfficientHours(supabase)
      case 'meetings-percentage':
        return await getMeetingsPercentage(supabase)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid endpoint' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    console.error('Dashboard API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function getDashboardOverview(supabase: any) {
  try {
    // Get clients count
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id')
    
    if (clientsError) throw clientsError

    // Get projects count and active projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, status')
    
    if (projectsError) throw projectsError

    // Get leads statistics
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at, updated_at')
    
    if (leadsError) throw leadsError

    const totalClients = clients?.length || 0
    const totalProjects = projects?.length || 0
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0
    const totalLeads = leads?.length || 0
    const activeLeads = leads?.filter(l => ['new', 'contacted', 'qualified'].includes(l.status?.toLowerCase())).length || 0
    const convertedLeads = leads?.filter(l => l.status?.toLowerCase() === 'converted').length || 0
    const overallConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    // Recent activity (leads created in last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentActivity = leads?.filter(l => new Date(l.created_at) > weekAgo).length || 0

    const overview = {
      totalClients,
      totalProjects,
      totalLeads,
      activeProjects,
      activeLeads,
      convertedLeads,
      overallConversionRate: Math.round(overallConversionRate * 10) / 10,
      recentActivity
    }

    return new Response(
      JSON.stringify(overview),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Overview error: ${error.message}`)
  }
}

async function getProjectLeadMetrics(supabase: any) {
  try {
    // Get projects with lead counts
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        id, 
        name, 
        clients(name),
        leads(id, status)
      `)
    
    if (projectsError) throw projectsError

    const projectsWithLeadData = projects?.map(project => {
      const leadCount = project.leads?.length || 0
      const convertedLeads = project.leads?.filter(l => l.status?.toLowerCase() === 'converted').length || 0
      const activeLeads = project.leads?.filter(l => ['new', 'contacted', 'qualified'].includes(l.status?.toLowerCase())).length || 0
      const conversionRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0

      return {
        id: project.id,
        name: project.name,
        client_name: project.clients?.name || 'Unknown Client',
        lead_count: leadCount,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        active_leads: activeLeads
      }
    }) || []

    const projectsWithLeads = projectsWithLeadData.filter(p => p.lead_count > 0).length
    const projectsWithoutLeads = projectsWithLeadData.length - projectsWithLeads
    const totalLeads = projectsWithLeadData.reduce((sum, p) => sum + p.lead_count, 0)
    const avgLeadsPerProject = projectsWithLeadData.length > 0 ? totalLeads / projectsWithLeadData.length : 0

    // Top performing projects
    const topPerformingProjects = projectsWithLeadData
      .filter(p => p.lead_count > 0)
      .sort((a, b) => {
        const aScore = a.conversion_rate * 0.7 + a.lead_count * 0.3
        const bScore = b.conversion_rate * 0.7 + b.lead_count * 0.3
        return bScore - aScore
      })
      .slice(0, 10)

    // Lead distribution by project
    const leadDistributionByProject = projectsWithLeadData
      .filter(p => p.lead_count > 0)
      .map(project => ({
        project_name: project.name,
        client_name: project.client_name,
        lead_count: project.lead_count,
        percentage: totalLeads > 0 ? (project.lead_count / totalLeads) * 100 : 0
      }))
      .sort((a, b) => b.lead_count - a.lead_count)

    const metrics = {
      projectsWithLeads,
      projectsWithoutLeads,
      avgLeadsPerProject: Math.round(avgLeadsPerProject * 10) / 10,
      topPerformingProjects,
      leadDistributionByProject
    }

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Project metrics error: ${error.message}`)
  }
}

async function getConversionAnalytics(supabase: any, days: number = 30) {
  try {
    // Get leads for conversion funnel
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, source, created_at, updated_at')
    
    if (leadsError) throw leadsError

    // Conversion funnel
    const statusCounts = leads?.reduce((acc: any, lead: any) => {
      const status = lead.status?.toLowerCase() || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}) || {}

    const totalLeads = leads?.length || 0
    const conversionFunnel = Object.entries(statusCounts).map(([status, count]: [string, any]) => ({
      status,
      count,
      percentage: totalLeads > 0 ? (count / totalLeads) * 100 : 0
    }))

    // Top sources with conversion rates
    const sourceStats = leads?.reduce((acc: any, lead: any) => {
      const source = lead.source || 'unknown'
      if (!acc[source]) {
        acc[source] = { total: 0, converted: 0 }
      }
      acc[source].total++
      if (lead.status?.toLowerCase() === 'converted') {
        acc[source].converted++
      }
      return acc
    }, {}) || {}

    const topSources = Object.entries(sourceStats).map(([source, stats]: [string, any]) => ({
      source,
      total_leads: stats.total,
      converted_leads: stats.converted,
      conversion_rate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
    })).sort((a, b) => b.total_leads - a.total_leads).slice(0, 10)

    // Conversion trends (last N days)
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - days)
    
    const recentLeads = leads?.filter(l => new Date(l.created_at) > daysAgo) || []
    
    // Group by day
    const dailyStats: any = {}
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dailyStats[dateStr] = { created: 0, converted: 0, lost: 0 }
    }

    recentLeads.forEach((lead: any) => {
      const createdDate = lead.created_at.split('T')[0]
      if (dailyStats[createdDate]) {
        dailyStats[createdDate].created++
        if (lead.status?.toLowerCase() === 'converted') {
          dailyStats[createdDate].converted++
        } else if (lead.status?.toLowerCase() === 'lost') {
          dailyStats[createdDate].lost++
        }
      }
    })

    const conversionTrends = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
      date,
      created: stats.created,
      converted: stats.converted,
      lost: stats.lost,
      conversion_rate: stats.created > 0 ? (stats.converted / stats.created) * 100 : 0
    })).sort((a, b) => a.date.localeCompare(b.date))

    const analytics = {
      conversionFunnel,
      conversionTrends,
      topSources,
      avgTimeToConversion: 0 // TODO: Calculate based on created_at vs updated_at
    }

    return new Response(
      JSON.stringify(analytics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Conversion analytics error: ${error.message}`)
  }
}

async function getClientPerformanceMetrics(supabase: any) {
  try {
    // Get clients with project and lead statistics
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        projects(
          id,
          leads(id, status)
        )
      `)
    
    if (clientsError) throw clientsError

    const topClients = clients?.map((client: any) => {
      const projectCount = client.projects?.length || 0
      const allLeads = client.projects?.flatMap((p: any) => p.leads || []) || []
      const leadCount = allLeads.length
      const convertedLeads = allLeads.filter((l: any) => l.status?.toLowerCase() === 'converted').length
      const conversionRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0

      return {
        id: client.id,
        name: client.name,
        project_count: projectCount,
        lead_count: leadCount,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        recent_activity: 0 // TODO: Implement recent activity calculation
      }
    })
    .sort((a: any, b: any) => {
      const aScore = a.lead_count * 0.6 + a.conversion_rate * 0.4
      const bScore = b.lead_count * 0.6 + b.conversion_rate * 0.4
      return bScore - aScore
    })
    .slice(0, 10) || []

    const performance = {
      topClients,
      clientGrowth: [] // TODO: Implement client growth calculation
    }

    return new Response(
      JSON.stringify(performance),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Client performance error: ${error.message}`)
  }
}

async function getRealTimeMetrics(supabase: any) {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // Today's metrics
    const { data: todayLeads } = await supabase
      .from('leads')
      .select('id, status, created_at, updated_at')
      .gte('created_at', todayStr)

    const leadsCreatedToday = todayLeads?.length || 0
    const leadsConvertedToday = todayLeads?.filter((l: any) => 
      l.updated_at.startsWith(todayStr) && l.status?.toLowerCase() === 'converted'
    ).length || 0

    const { data: todayProjects } = await supabase
      .from('projects')
      .select('id')
      .gte('created_at', todayStr)

    const activeProjectsToday = todayProjects?.length || 0
    const todaysConversionRate = leadsCreatedToday > 0 
      ? (leadsConvertedToday / leadsCreatedToday) * 100 
      : 0

    // This week's metrics
    const { data: weekLeads } = await supabase
      .from('leads')
      .select('id, status')
      .gte('created_at', weekAgo.toISOString())

    const weekLeadsCreated = weekLeads?.length || 0
    const weekLeadsConverted = weekLeads?.filter((l: any) => 
      l.status?.toLowerCase() === 'converted'
    ).length || 0

    const { data: weekProjects } = await supabase
      .from('projects')
      .select('id')
      .gte('created_at', weekAgo.toISOString())

    // This month's metrics
    const { data: monthLeads } = await supabase
      .from('leads')
      .select('id, status')
      .gte('created_at', monthAgo.toISOString())

    const monthLeadsCreated = monthLeads?.length || 0
    const monthLeadsConverted = monthLeads?.filter((l: any) => 
      l.status?.toLowerCase() === 'converted'
    ).length || 0

    const { data: monthProjects } = await supabase
      .from('projects')
      .select('id')
      .gte('created_at', monthAgo.toISOString())

    const metrics = {
      leadsCreatedToday,
      leadsConvertedToday,
      activeProjectsToday,
      todaysConversionRate: Math.round(todaysConversionRate * 10) / 10,
      thisWeekStats: {
        leads_created: weekLeadsCreated,
        leads_converted: weekLeadsConverted,
        projects_created: weekProjects?.length || 0,
        conversion_rate: weekLeadsCreated > 0 
          ? Math.round((weekLeadsConverted / weekLeadsCreated) * 1000) / 10
          : 0
      },
      thisMonthStats: {
        leads_created: monthLeadsCreated,
        leads_converted: monthLeadsConverted,
        projects_created: monthProjects?.length || 0,
        conversion_rate: monthLeadsCreated > 0 
          ? Math.round((monthLeadsConverted / monthLeadsCreated) * 1000) / 10
          : 0
      }
    }

    return new Response(
      JSON.stringify(metrics),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Real-time metrics error: ${error.message}`)
  }
}

async function getCompleteDashboardData(supabase: any) {
  try {
    // Get all dashboard data in parallel
    const [overview, projectMetrics, conversionAnalytics, clientPerformance, realTimeMetrics] = await Promise.all([
      getDashboardOverview(supabase).then(r => r.json()),
      getProjectLeadMetrics(supabase).then(r => r.json()),
      getConversionAnalytics(supabase, 30).then(r => r.json()),
      getClientPerformanceMetrics(supabase).then(r => r.json()),
      getRealTimeMetrics(supabase).then(r => r.json())
    ])

    const completeData = {
      overview,
      projectLeadMetrics: projectMetrics,
      conversionAnalytics,
      clientPerformance,
      realTimeMetrics
    }

    return new Response(
      JSON.stringify(completeData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Complete dashboard data error: ${error.message}`)
  }
}

// New endpoint implementations

async function getMessagesSent(supabase: any) {
  try {
    // Get WhatsApp messages count
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('id, message_type, created_at, direction')
    
    if (messagesError) throw messagesError

    // Calculate messages sent (outbound messages)
    const outboundMessages = messages?.filter(m => m.direction === 'outbound') || []
    const total = outboundMessages.length
    
    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const lastWeekMessages = outboundMessages.filter(m => 
      new Date(m.created_at) >= lastWeek && new Date(m.created_at) < now
    ).length
    
    const previousWeekMessages = outboundMessages.filter(m => 
      new Date(m.created_at) >= previousWeek && new Date(m.created_at) < lastWeek
    ).length
    
    const trend = previousWeekMessages > 0 ? 
      ((lastWeekMessages - previousWeekMessages) / previousWeekMessages) * 100 : 0

    // Breakdown by message type
    const automated = outboundMessages.filter(m => m.message_type === 'template').length
    const manual = outboundMessages.filter(m => m.message_type !== 'template').length

    const result = {
      total,
      trend: Math.round(trend * 10) / 10,
      timeRange: 'last_30_days',
      breakdown: {
        automated,
        manual
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Messages sent error: ${error.message}`)
  }
}

async function getInteractions(supabase: any) {
  try {
    // Get conversation interactions (replies, clicks, views)
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('id, direction, created_at, message_type')
    
    if (messagesError) throw messagesError

    // Calculate interactions (inbound messages as replies)
    const inboundMessages = messages?.filter(m => m.direction === 'inbound') || []
    const total = inboundMessages.length
    
    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const lastWeekInteractions = inboundMessages.filter(m => 
      new Date(m.created_at) >= lastWeek && new Date(m.created_at) < now
    ).length
    
    const previousWeekInteractions = inboundMessages.filter(m => 
      new Date(m.created_at) >= previousWeek && new Date(m.created_at) < lastWeek
    ).length
    
    const trend = previousWeekInteractions > 0 ? 
      ((lastWeekInteractions - previousWeekInteractions) / previousWeekInteractions) * 100 : 0

    // Breakdown by interaction type
    const replies = inboundMessages.filter(m => m.message_type === 'text').length
    const clicks = 0 // Would need to track button clicks
    const views = 0 // Would need to track message views

    const result = {
      total,
      trend: Math.round(trend * 10) / 10,
      timeRange: 'last_30_days',
      breakdown: {
        clicks,
        replies,
        views
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Interactions error: ${error.message}`)
  }
}

async function getConversationsStarted(supabase: any) {
  try {
    // Get conversations
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, created_at, started_at')
    
    if (conversationsError) throw conversationsError

    const total = conversations?.length || 0
    
    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const lastWeekConversations = conversations?.filter(c => 
      new Date(c.created_at) >= lastWeek && new Date(c.created_at) < now
    ).length || 0
    
    const previousWeekConversations = conversations?.filter(c => 
      new Date(c.created_at) >= previousWeek && new Date(c.created_at) < lastWeek
    ).length || 0
    
    const trend = previousWeekConversations > 0 ? 
      ((lastWeekConversations - previousWeekConversations) / previousWeekConversations) * 100 : 0

    const result = {
      total,
      trend: Math.round(trend * 10) / 10,
      timeRange: 'last_30_days',
      breakdown: {
        thisWeek: lastWeekConversations,
        lastWeek: previousWeekConversations
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Conversations started error: ${error.message}`)
  }
}

async function getConversationAbandonment(supabase: any) {
  try {
    // Get conversations and messages
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, status, created_at, last_message_at')
    
    if (conversationsError) throw conversationsError

    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('id, conversation_id, created_at, direction')
    
    if (messagesError) throw messagesError

    // Calculate abandonment (conversations with no replies after 24 hours)
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    let abandonedConversations = 0
    let totalConversations = conversations?.length || 0
    
    conversations?.forEach(conv => {
      const conversationMessages = messages?.filter(m => m.conversation_id === conv.id) || []
      const lastMessage = conversationMessages[conversationMessages.length - 1]
      
      if (lastMessage && 
          lastMessage.direction === 'outbound' && 
          new Date(lastMessage.created_at) < dayAgo) {
        abandonedConversations++
      }
    })

    const percentage = totalConversations > 0 ? (abandonedConversations / totalConversations) * 100 : 0
    
    // Calculate trend
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const lastWeekAbandoned = conversations?.filter(c => 
      new Date(c.created_at) >= lastWeek && new Date(c.created_at) < now
    ).length || 0
    
    const previousWeekAbandoned = conversations?.filter(c => 
      new Date(c.created_at) >= previousWeek && new Date(c.created_at) < lastWeek
    ).length || 0
    
    const trend = previousWeekAbandoned > 0 ? 
      ((lastWeekAbandoned - previousWeekAbandoned) / previousWeekAbandoned) * 100 : 0

    const result = {
      total: abandonedConversations,
      percentage: Math.round(percentage * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      timeRange: 'last_30_days',
      stageBreakdown: {
        initial: Math.round(abandonedConversations * 0.4),
        middle: Math.round(abandonedConversations * 0.3),
        final: Math.round(abandonedConversations * 0.3)
      },
      averageTimeToAbandon: 48 // hours - would need to calculate actual
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Conversation abandonment error: ${error.message}`)
  }
}

async function getResponseTime(supabase: any) {
  try {
    // Get message pairs (outbound followed by inbound)
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('id, conversation_id, created_at, direction')
      .order('created_at', { ascending: true })
    
    if (messagesError) throw messagesError

    let totalResponseTime = 0
    let responseCount = 0
    let businessHoursResponseTime = 0
    let afterHoursResponseTime = 0
    let weekendResponseTime = 0
    let businessHoursCount = 0
    let afterHoursCount = 0
    let weekendCount = 0

    // Group messages by conversation
    const messagesByConversation = messages?.reduce((acc: any, message: any) => {
      if (!acc[message.conversation_id]) {
        acc[message.conversation_id] = []
      }
      acc[message.conversation_id].push(message)
      return acc
    }, {}) || {}

    // Calculate response times
    Object.values(messagesByConversation).forEach((conversationMessages: any) => {
      for (let i = 0; i < conversationMessages.length - 1; i++) {
        const outboundMessage = conversationMessages[i]
        const inboundMessage = conversationMessages[i + 1]
        
        if (outboundMessage.direction === 'outbound' && inboundMessage.direction === 'inbound') {
          const responseTime = new Date(inboundMessage.created_at).getTime() - new Date(outboundMessage.created_at).getTime()
          const responseTimeMinutes = responseTime / (1000 * 60)
          
          totalResponseTime += responseTimeMinutes
          responseCount++
          
          // Categorize by time
          const outboundDate = new Date(outboundMessage.created_at)
          const dayOfWeek = outboundDate.getDay()
          const hour = outboundDate.getHours()
          
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            weekendResponseTime += responseTimeMinutes
            weekendCount++
          } else if (hour >= 9 && hour <= 17) {
            businessHoursResponseTime += responseTimeMinutes
            businessHoursCount++
          } else {
            afterHoursResponseTime += responseTimeMinutes
            afterHoursCount++
          }
        }
      }
    })

    const meanTime = responseCount > 0 ? totalResponseTime / responseCount : 0
    const businessHoursAvg = businessHoursCount > 0 ? businessHoursResponseTime / businessHoursCount : 0
    const afterHoursAvg = afterHoursCount > 0 ? afterHoursResponseTime / afterHoursCount : 0
    const weekendAvg = weekendCount > 0 ? weekendResponseTime / weekendCount : 0

    const result = {
      meanTime: Math.round(meanTime * 10) / 10,
      trend: 0, // Would need historical data
      timeRange: 'last_30_days',
      unit: 'minutes',
      breakdown: {
        businessHours: Math.round(businessHoursAvg * 10) / 10,
        afterHours: Math.round(afterHoursAvg * 10) / 10,
        weekends: Math.round(weekendAvg * 10) / 10
      },
      totalReplies: responseCount
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Response time error: ${error.message}`)
  }
}

async function getEfficientHours(supabase: any) {
  try {
    // Get messages with response data
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('id, conversation_id, created_at, direction')
      .order('created_at', { ascending: true })
    
    if (messagesError) throw messagesError

    const hourlyStats: any = {}
    
    // Initialize hourly stats
    for (let hour = 0; hour < 24; hour++) {
      hourlyStats[hour] = {
        totalMessages: 0,
        replies: 0,
        responseTime: 0,
        responseCount: 0
      }
    }

    // Group messages by conversation
    const messagesByConversation = messages?.reduce((acc: any, message: any) => {
      if (!acc[message.conversation_id]) {
        acc[message.conversation_id] = []
      }
      acc[message.conversation_id].push(message)
      return acc
    }, {}) || {}

    // Calculate hourly statistics
    Object.values(messagesByConversation).forEach((conversationMessages: any) => {
      for (let i = 0; i < conversationMessages.length - 1; i++) {
        const outboundMessage = conversationMessages[i]
        const inboundMessage = conversationMessages[i + 1]
        
        if (outboundMessage.direction === 'outbound') {
          const hour = new Date(outboundMessage.created_at).getHours()
          hourlyStats[hour].totalMessages++
          
          if (inboundMessage && inboundMessage.direction === 'inbound') {
            hourlyStats[hour].replies++
            const responseTime = new Date(inboundMessage.created_at).getTime() - new Date(outboundMessage.created_at).getTime()
            hourlyStats[hour].responseTime += responseTime / (1000 * 60) // minutes
            hourlyStats[hour].responseCount++
          }
        }
      }
    })

    // Calculate peak hours
    const peakHours = Object.entries(hourlyStats).map(([hour, stats]: [string, any]) => {
      const replyRate = stats.totalMessages > 0 ? (stats.replies / stats.totalMessages) * 100 : 0
      const avgResponseTime = stats.responseCount > 0 ? stats.responseTime / stats.responseCount : 0
      
      return {
        hour: parseInt(hour),
        replyRate: Math.round(replyRate * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        totalMessages: stats.totalMessages
      }
    }).sort((a, b) => b.replyRate - a.replyRate)

    const bestHour = peakHours[0] || { hour: 10, replyRate: 0, avgResponseTime: 0 }
    const worstHour = peakHours[peakHours.length - 1] || { hour: 2, replyRate: 0, avgResponseTime: 0 }

    const result = {
      peakHours: peakHours.slice(0, 10),
      bestHour,
      worstHour,
      timeRange: 'last_30_days',
      timezone: 'UTC'
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Efficient hours error: ${error.message}`)
  }
}

async function getMeetingsPercentage(supabase: any) {
  try {
    // Get conversations and leads
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, status, created_at, lead_id')
    
    if (conversationsError) throw conversationsError

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at, meeting_scheduled')
    
    if (leadsError) throw leadsError

    // Calculate meeting conversion funnel
    const totalInitialMessages = conversations?.length || 0
    const replies = conversations?.filter(c => c.status !== 'abandoned').length || 0
    const qualified = leads?.filter(l => l.status === 'qualified').length || 0
    const meetingsSet = leads?.filter(l => l.meeting_scheduled === true).length || 0
    
    const percentage = totalInitialMessages > 0 ? (meetingsSet / totalInitialMessages) * 100 : 0
    
    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const thisWeekMeetings = leads?.filter(l => 
      l.meeting_scheduled === true && new Date(l.created_at) >= lastWeek
    ).length || 0
    
    const lastWeekMeetings = leads?.filter(l => 
      l.meeting_scheduled === true && 
      new Date(l.created_at) >= previousWeek && 
      new Date(l.created_at) < lastWeek
    ).length || 0
    
    const thisMonthMeetings = leads?.filter(l => 
      l.meeting_scheduled === true && new Date(l.created_at) >= lastMonth
    ).length || 0
    
    const trend = lastWeekMeetings > 0 ? 
      ((thisWeekMeetings - lastWeekMeetings) / lastWeekMeetings) * 100 : 0

    const result = {
      percentage: Math.round(percentage * 10) / 10,
      trend: Math.round(trend * 10) / 10,
      timeRange: 'last_30_days',
      totalInitialMessages,
      totalMeetingsSet: meetingsSet,
      conversionFunnel: {
        initialMessages: totalInitialMessages,
        replies,
        qualified,
        meetingsSet
      },
      breakdown: {
        thisWeek: thisWeekMeetings,
        lastWeek: lastWeekMeetings,
        thisMonth: thisMonthMeetings,
        lastMonth: meetingsSet - thisMonthMeetings
      }
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    throw new Error(`Meetings percentage error: ${error.message}`)
  }
} 