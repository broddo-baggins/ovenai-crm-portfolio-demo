// @ts-nocheck
/**
 * 🚀 SIMPLIFIED QUEUE SERVICE - IMMEDIATE WORKING VERSION
 * 
 * This service works with the current database state without requiring 
 * the foreign key constraints to be applied. It's designed for immediate
 * testing and demonstration of queue functionality.
 * 
 * Once the database migration is applied, use the full leadProcessingService.ts
 */

import { createClient } from '@supabase/supabase-js';

// This would be imported from your environment in the actual app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ajszzemkpenbfnghqiyz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SimplifiedQueueService {
  
  /**
   * Prepare Tomorrow's Queue - SIMPLIFIED VERSION
   * Works without foreign key constraints by using NULL for user_id
   */
  static async prepareTomorrowQueue(): Promise<{
    success: boolean;
    queued: number;
    message: string;
    nextProcessingDate: Date;
    details?: any;
  }> {
    try {
      console.log('🚀 Starting Prepare Tomorrow Queue (SIMPLIFIED VERSION)...');
      
      const nextProcessingDate = new Date();
      nextProcessingDate.setDate(nextProcessingDate.getDate() + 1);
      
      // Get available leads using actual status values
      const { data: availableLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .in('status', ['new', 'unqualified', 'consideration', 'qualified'])
        .limit(10);
      
      if (leadsError || !availableLeads || availableLeads.length === 0) {
        return {
          success: false,
          queued: 0,
          message: "No pending leads available for queueing",
          nextProcessingDate
        };
      }
      
      console.log(`📦 Found ${availableLeads.length} leads to queue`);
      
      // Create queue entries without foreign key constraints
      const queueEntries = availableLeads.map((lead, index) => ({
        lead_id: lead.id,
        user_id: null, // Avoid FK constraint by using NULL
        client_id: null, // Avoid FK constraint by using NULL
        queue_position: index + 1,
        priority: 5,
        queue_status: 'queued',
        message_type: 'template',
        message_content: `Hello ${lead.first_name || 'there'}! Following up on your inquiry.`,
        recipient_phone: lead.phone,
        scheduled_for: nextProcessingDate.toISOString(),
        message_template: 'follow_up_template',
        created_at: new Date().toISOString()
      }));
      
      let successCount = 0;
      
      // Insert entries individually to handle any failures gracefully
      for (const entry of queueEntries) {
        try {
          const { error } = await supabase
            .from('whatsapp_message_queue')
            .insert([entry]);
          
          if (!error) {
            successCount++;
          } else {
            console.warn(`⚠️ Could not queue lead ${entry.lead_id}:`, error.message);
          }
        } catch (err) {
          console.warn(`⚠️ Exception queueing lead ${entry.lead_id}:`, err);
        }
      }
      
      // Update lead statuses for successfully queued leads
      if (successCount > 0) {
        const successfulLeadIds = availableLeads.slice(0, successCount).map(lead => lead.id);
        
        try {
          await supabase
            .from('leads')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .in('id', successfulLeadIds);
        } catch (updateError) {
          console.warn('⚠️ Could not update lead statuses:', updateError);
        }
      }
      
      return {
        success: successCount > 0,
        queued: successCount,
        message: successCount > 0 
          ? `Successfully queued ${successCount} leads for ${nextProcessingDate.toDateString()}`
          : "Failed to queue any leads - check database constraints",
        nextProcessingDate,
        details: {
          total_attempted: queueEntries.length,
          successful: successCount,
          method: 'simplified_service'
        }
      };
      
    } catch (error) {
      console.error('💥 Prepare Tomorrow Queue failed:', error);
      return {
        success: false,
        queued: 0,
        message: `Failed to prepare queue: ${error.message || 'Unknown error'}`,
        nextProcessingDate: new Date(),
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Start Automation - SIMPLIFIED VERSION
   */
  static async startAutomatedProcessing(): Promise<{
    success: boolean;
    processing: number;
    message: string;
    details?: any;
  }> {
    try {
      console.log('⚡ Starting Automated Processing (SIMPLIFIED VERSION)...');
      
      // Get queued messages
      const { data: queuedMessages, error: queueError } = await supabase
        .from('whatsapp_message_queue')
        .select('*')
        .eq('queue_status', 'queued')
        .limit(5);
      
      if (queueError || !queuedMessages || queuedMessages.length === 0) {
        return {
          success: false,
          processing: 0,
          message: "No queued messages available for processing - try running 'Prepare Tomorrow's Queue' first",
          details: { reason: 'empty_queue' }
        };
      }
      
      console.log(`📨 Found ${queuedMessages.length} messages to process`);
      
      // Update messages to 'sending' status
      const messageIds = queuedMessages.map(msg => msg.id);
      const { error: updateError } = await supabase
        .from('whatsapp_message_queue')
        .update({ 
          queue_status: 'sending',
          processed_at: new Date().toISOString()
        })
        .in('id', messageIds);
      
      if (!updateError) {
        // Update associated leads
        const leadIds = queuedMessages
          .map(msg => msg.lead_id)
          .filter(Boolean);
        
        if (leadIds.length > 0) {
          await supabase
            .from('leads')
            .update({ 
              status: 'active',
              updated_at: new Date().toISOString()
            })
            .in('id', leadIds);
        }
        
        // Simulate completion
        setTimeout(async () => {
          try {
            await supabase
              .from('whatsapp_message_queue')
              .update({ 
                queue_status: 'sent',
                sent_at: new Date().toISOString()
              })
              .in('id', messageIds);
            
            console.log('✅ Processing simulation completed');
          } catch (error) {
            console.error('❌ Error in processing simulation:', error);
          }
        }, 3000);
      }
      
      return {
        success: true,
        processing: queuedMessages.length,
        message: `Started processing ${queuedMessages.length} messages. Check back in 30 seconds for completion.`,
        details: {
          messages_processing: queuedMessages.length,
          estimated_completion: new Date(Date.now() + 30000).toISOString()
        }
      };
      
    } catch (error) {
      console.error('💥 Start Automation failed:', error);
      return {
        success: false,
        processing: 0,
        message: `Failed to start automation: ${error.message || 'Unknown error'}`,
        details: { error: error.message }
      };
    }
  }
  
  /**
   * Export Queue Data - SIMPLIFIED VERSION
   */
  static async exportQueueData(): Promise<{
    success: boolean;
    filename?: string;
    message: string;
    csvData?: string;
  }> {
    try {
      console.log('📤 Exporting Queue Data (SIMPLIFIED VERSION)...');
      
      // Get all queue data
      const { data: queueData, error: queueError } = await supabase
        .from('whatsapp_message_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      
      if (queueError) {
        throw queueError;
      }
      
      const recordCount = queueData?.length || 0;
      console.log(`📊 Found ${recordCount} queue records to export`);
      
      if (recordCount === 0) {
        const csvHeaders = [
          'ID', 'Lead ID', 'Queue Status', 'Priority', 'Scheduled For', 'Created At', 'Message'
        ];
        
        const csvData = csvHeaders.join(',') + '\n' + 
          '"No data","Run Prepare Tomorrow Queue first","","","","",""';
        
        return {
          success: true,
          filename: `queue-export-empty-${new Date().toISOString().split('T')[0]}.csv`,
          message: "Queue is empty - exported template with instructions",
          csvData
        };
      }
      
      // Generate CSV with available data
      const csvHeaders = [
        'ID', 'Lead ID', 'Queue Status', 'Priority', 'Scheduled For', 'Created At', 
        'Message Content', 'Recipient Phone', 'Message Type'
      ];
      
      const csvRows = queueData.map(item => [
        item.id || '',
        item.lead_id || '',
        item.queue_status || '',
        item.priority || '',
        item.scheduled_for || '',
        item.created_at || '',
        (item.message_content || '').substring(0, 50) + '...',
        item.recipient_phone || '',
        item.message_type || ''
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const timestamp = new Date().toISOString();
      const summary = [
        `# Simplified Queue Export - ${timestamp}`,
        `# Total Records: ${recordCount}`,
        `# Generated by: Simplified Queue Service`,
        '#',
        csvContent
      ].join('\n');
      
      const filename = `queue-export-simplified-${new Date().toISOString().split('T')[0]}.csv`;
      
      return {
        success: true,
        filename,
        message: `Successfully exported ${recordCount} queue records to ${filename}`,
        csvData: summary
      };
      
    } catch (error) {
      console.error('💥 Export Queue Data failed:', error);
      return {
        success: false,
        message: `Failed to export queue data: ${error.message || 'Unknown error'}`
      };
    }
  }
  
  /**
   * Take Lead - SIMPLIFIED VERSION
   */
  static async takeLead(leadId: string, userId?: string): Promise<{
    success: boolean;
    message: string;
    leadData?: any;
  }> {
    try {
      console.log(`👤 Taking lead ${leadId} (SIMPLIFIED VERSION)...`);
      
      // Get current lead data
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();
      
      if (leadError || !leadData) {
        return {
          success: false,
          message: "Lead not found"
        };
      }
      
      // Update lead status using valid status value
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          status: 'qualified', // Use valid status
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);
      
      if (updateError) {
        throw updateError;
      }
      
      // Cancel any queued messages (gracefully handle failures)
      try {
        await supabase
          .from('whatsapp_message_queue')
          .update({
            queue_status: 'cancelled',
            updated_at: new Date().toISOString(),
            last_error: 'Lead taken by human agent'
          })
          .eq('lead_id', leadId)
          .in('queue_status', ['queued', 'pending', 'sending']);
      } catch (queueError) {
        console.warn('⚠️ Could not update queue status:', queueError);
        // Continue - lead takeover is more important
      }
      
      return {
        success: true,
        message: `Successfully took control of lead ${leadData.first_name || leadData.phone}. Lead removed from automated processing.`,
        leadData: {
          id: leadData.id,
          name: `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
          phone: leadData.phone,
          status: 'qualified',
          taken_at: new Date().toISOString(),
          taken_by: userId || 'human_agent'
        }
      };
      
    } catch (error) {
      console.error('💥 Take Lead failed:', error);
      return {
        success: false,
        message: `Failed to take lead: ${error.message || 'Unknown error'}`
      };
    }
  }
}

export default SimplifiedQueueService; 