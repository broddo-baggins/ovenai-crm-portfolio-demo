export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      aggregated_notifications: {
        Row: {
          count: number
          created_at: string | null
          description: string
          id: string
          is_read: boolean | null
          last_updated: string | null
          metadata: Json | null
          notification_type: string
          read_at: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          description: string
          id?: string
          is_read?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string | null
          description?: string
          id?: string
          is_read?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          job_data: Json
          job_name: string
          job_options: Json | null
          job_status: string | null
          job_type: string
          max_retries: number | null
          progress_current: number | null
          progress_message: string | null
          progress_total: number | null
          result_data: Json | null
          retry_count: number | null
          retry_delay_seconds: number | null
          scheduled_for: string | null
          started_at: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_data?: Json
          job_name: string
          job_options?: Json | null
          job_status?: string | null
          job_type: string
          max_retries?: number | null
          progress_current?: number | null
          progress_message?: string | null
          progress_total?: number | null
          result_data?: Json | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          job_data?: Json
          job_name?: string
          job_options?: Json | null
          job_status?: string | null
          job_type?: string
          max_retries?: number | null
          progress_current?: number | null
          progress_message?: string | null
          progress_total?: number | null
          result_data?: Json | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_members: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          joined_at: string | null
          permissions: Json | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_members_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contact_info: Json | null
          created_at: string
          description: string | null
          id: string
          name: string
          processing_state: Database["public"]["Enums"]["processing_state_enum"]
          status: string | null
          updated_at: string
          user_id: string | null
          whatsapp_number_id: string | null
          whatsapp_phone_number: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          status?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_number_id?: string | null
          whatsapp_phone_number?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          status?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp_number_id?: string | null
          whatsapp_phone_number?: string | null
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          direction: string | null
          id: string
          lead_id: string | null
          message_body: string | null
          message_content: string | null
          message_id: string | null
          message_type: string | null
          metadata: Json | null
          receiver_number: string | null
          sender_number: string | null
          status: string | null
          timestamp: string | null
          updated_at: string | null
          wa_timestamp: string | null
          wamid: string | null
        }
        Insert: {
          created_at?: string | null
          direction?: string | null
          id?: string
          lead_id?: string | null
          message_body?: string | null
          message_content?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          receiver_number?: string | null
          sender_number?: string | null
          status?: string | null
          timestamp?: string | null
          updated_at?: string | null
          wa_timestamp?: string | null
          wamid?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string | null
          id?: string
          lead_id?: string | null
          message_body?: string | null
          message_content?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          receiver_number?: string | null
          sender_number?: string | null
          status?: string | null
          timestamp?: string | null
          updated_at?: string | null
          wa_timestamp?: string | null
          wamid?: string | null
        }
        Relationships: []
      }
      lead_members: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_processing_queue: {
        Row: {
          actual_duration_seconds: number | null
          assigned_processor: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_duration_seconds: number | null
          id: string
          last_retry_at: string | null
          lead_id: string | null
          max_retries: number | null
          priority: number | null
          processing_step: string | null
          processing_type: string | null
          progress_percentage: number | null
          project_id: string | null
          queue_metadata: Json | null
          queue_position: number
          queue_status: string | null
          retry_count: number | null
          scheduled_for: string | null
          started_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          actual_duration_seconds?: number | null
          assigned_processor?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          id?: string
          last_retry_at?: string | null
          lead_id?: string | null
          max_retries?: number | null
          priority?: number | null
          processing_step?: string | null
          processing_type?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          queue_metadata?: Json | null
          queue_position: number
          queue_status?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          actual_duration_seconds?: number | null
          assigned_processor?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_duration_seconds?: number | null
          id?: string
          last_retry_at?: string | null
          lead_id?: string | null
          max_retries?: number | null
          priority?: number | null
          processing_step?: string | null
          processing_type?: string | null
          progress_percentage?: number | null
          project_id?: string | null
          queue_metadata?: Json | null
          queue_position?: number
          queue_status?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_processing_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_processing_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_processing_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bant_status: string | null
          client_id: string | null
          created_at: string
          current_project_id: string | null
          first_interaction: string | null
          first_name: string | null
          follow_up_count: number | null
          id: string
          interaction_count: number | null
          last_agent_processed_at: string | null
          last_interaction: string | null
          last_name: string | null
          lead_metadata: Json | null
          next_follow_up: string | null
          phone: string | null
          processing_state: Database["public"]["Enums"]["processing_state_enum"]
          requires_human_review: boolean | null
          state: string | null
          state_status_metadata: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          bant_status?: string | null
          client_id?: string | null
          created_at?: string
          current_project_id?: string | null
          first_interaction?: string | null
          first_name?: string | null
          follow_up_count?: number | null
          id?: string
          interaction_count?: number | null
          last_agent_processed_at?: string | null
          last_interaction?: string | null
          last_name?: string | null
          lead_metadata?: Json | null
          next_follow_up?: string | null
          phone?: string | null
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          requires_human_review?: boolean | null
          state?: string | null
          state_status_metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          bant_status?: string | null
          client_id?: string | null
          created_at?: string
          current_project_id?: string | null
          first_interaction?: string | null
          first_name?: string | null
          follow_up_count?: number | null
          id?: string
          interaction_count?: number | null
          last_agent_processed_at?: string | null
          last_interaction?: string | null
          last_name?: string | null
          lead_metadata?: Json | null
          next_follow_up?: string | null
          phone?: string | null
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          requires_human_review?: boolean | null
          state?: string | null
          state_status_metadata?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          client_id: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_level: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          admin_level?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          admin_level?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          name: string
          processing_state: Database["public"]["Enums"]["processing_state_enum"]
          settings: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name: string
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          processing_state?: Database["public"]["Enums"]["processing_state_enum"]
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_performance_metrics: {
        Row: {
          average_processing_time_seconds: number | null
          client_id: string | null
          created_at: string | null
          error_breakdown: Json | null
          failure_rate: number | null
          hourly_distribution: Json | null
          id: string
          leads_cancelled: number | null
          leads_failed: number | null
          leads_processed: number | null
          leads_queued: number | null
          leads_sent: number | null
          metric_date: string | null
          peak_queue_size: number | null
          queue_wait_time_avg_minutes: number | null
          success_rate: number | null
          throughput_per_hour: number | null
          user_id: string
        }
        Insert: {
          average_processing_time_seconds?: number | null
          client_id?: string | null
          created_at?: string | null
          error_breakdown?: Json | null
          failure_rate?: number | null
          hourly_distribution?: Json | null
          id?: string
          leads_cancelled?: number | null
          leads_failed?: number | null
          leads_processed?: number | null
          leads_queued?: number | null
          leads_sent?: number | null
          metric_date?: string | null
          peak_queue_size?: number | null
          queue_wait_time_avg_minutes?: number | null
          success_rate?: number | null
          throughput_per_hour?: number | null
          user_id: string
        }
        Update: {
          average_processing_time_seconds?: number | null
          client_id?: string | null
          created_at?: string | null
          error_breakdown?: Json | null
          failure_rate?: number | null
          hourly_distribution?: Json | null
          id?: string
          leads_cancelled?: number | null
          leads_failed?: number | null
          leads_processed?: number | null
          leads_queued?: number | null
          leads_sent?: number | null
          metric_date?: string | null
          peak_queue_size?: number | null
          queue_wait_time_avg_minutes?: number | null
          success_rate?: number | null
          throughput_per_hour?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "queue_performance_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          result: Json | null
          status: string | null
          sync_direction: string | null
          sync_result: Json | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          result?: Json | null
          status?: string | null
          sync_direction?: string | null
          sync_result?: Json | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          result?: Json | null
          status?: string | null
          sync_direction?: string | null
          sync_result?: Json | null
        }
        Relationships: []
      }
      sync_queue: {
        Row: {
          created_at: string | null
          entity_data: Json
          entity_type: string
          id: string
          last_error: string | null
          processed_at: string | null
          retry_count: number | null
          sync_operation: string
          sync_status: string | null
        }
        Insert: {
          created_at?: string | null
          entity_data: Json
          entity_type: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          retry_count?: number | null
          sync_operation: string
          sync_status?: string | null
        }
        Update: {
          created_at?: string | null
          entity_data?: Json
          entity_type?: string
          id?: string
          last_error?: string | null
          processed_at?: string | null
          retry_count?: number | null
          sync_operation?: string
          sync_status?: string | null
        }
        Relationships: []
      }
      system_changes: {
        Row: {
          change_type: string
          created_at: string | null
          description: string
          entity_id: string
          entity_type: string
          id: string
          is_read: boolean | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          read_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          change_type: string
          created_at?: string | null
          description: string
          entity_id: string
          entity_type: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          read_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          change_type?: string
          created_at?: string | null
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          read_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_credentials: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          credential_metadata: Json | null
          credential_name: string
          credential_type: string
          encrypted_value: string
          encryption_key_id: string | null
          environment: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credential_metadata?: Json | null
          credential_name: string
          credential_type: string
          encrypted_value: string
          encryption_key_id?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          credential_metadata?: Json | null
          credential_name?: string
          credential_type?: string
          encrypted_value?: string
          encryption_key_id?: string | null
          environment?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_api_credentials_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_app_preferences: {
        Row: {
          created_at: string | null
          data_preferences: Json | null
          feature_preferences: Json | null
          id: string
          integration_settings: Json | null
          interface_settings: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data_preferences?: Json | null
          feature_preferences?: Json | null
          id?: string
          integration_settings?: Json | null
          interface_settings?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data_preferences?: Json | null
          feature_preferences?: Json | null
          id?: string
          integration_settings?: Json | null
          interface_settings?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_dashboard_settings: {
        Row: {
          client_id: string | null
          created_at: string | null
          dashboard_preferences: Json | null
          id: string
          project_id: string | null
          updated_at: string | null
          user_id: string
          widget_layout: Json | null
          widget_visibility: Json | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          dashboard_preferences?: Json | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
          user_id: string
          widget_layout?: Json | null
          widget_visibility?: Json | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          dashboard_preferences?: Json | null
          id?: string
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
          widget_layout?: Json | null
          widget_visibility?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_dashboard_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dashboard_settings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_settings: {
        Row: {
          created_at: string | null
          email_notifications: Json | null
          id: string
          notification_schedule: Json | null
          push_notifications: Json | null
          sms_notifications: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: Json | null
          id?: string
          notification_schedule?: Json | null
          push_notifications?: Json | null
          sms_notifications?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: Json | null
          id?: string
          notification_schedule?: Json | null
          push_notifications?: Json | null
          sms_notifications?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_performance_targets: {
        Row: {
          client_id: string | null
          created_at: string | null
          custom_targets: Json | null
          id: string
          project_id: string | null
          target_bant_qualification_rate: number | null
          target_burning_to_meeting_rate: number | null
          target_calendly_booking_rate: number | null
          target_cold_to_warm_rate: number | null
          target_conversion_rate: number | null
          target_hot_to_burning_rate: number | null
          target_leads_per_month: number | null
          target_meetings_per_month: number | null
          target_messages_per_week: number | null
          target_reach_rate: number | null
          target_response_rate: number | null
          target_warm_to_hot_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          custom_targets?: Json | null
          id?: string
          project_id?: string | null
          target_bant_qualification_rate?: number | null
          target_burning_to_meeting_rate?: number | null
          target_calendly_booking_rate?: number | null
          target_cold_to_warm_rate?: number | null
          target_conversion_rate?: number | null
          target_hot_to_burning_rate?: number | null
          target_leads_per_month?: number | null
          target_meetings_per_month?: number | null
          target_messages_per_week?: number | null
          target_reach_rate?: number | null
          target_response_rate?: number | null
          target_warm_to_hot_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          custom_targets?: Json | null
          id?: string
          project_id?: string | null
          target_bant_qualification_rate?: number | null
          target_burning_to_meeting_rate?: number | null
          target_calendly_booking_rate?: number | null
          target_cold_to_warm_rate?: number | null
          target_conversion_rate?: number | null
          target_hot_to_burning_rate?: number | null
          target_leads_per_month?: number | null
          target_meetings_per_month?: number | null
          target_messages_per_week?: number | null
          target_reach_rate?: number | null
          target_response_rate?: number | null
          target_warm_to_hot_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_performance_targets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_performance_targets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_queue_settings: {
        Row: {
          advanced: Json | null
          automation: Json | null
          created_at: string | null
          id: string
          processing_targets: Json | null
          updated_at: string | null
          user_id: string
          work_days: Json | null
        }
        Insert: {
          advanced?: Json | null
          automation?: Json | null
          created_at?: string | null
          id?: string
          processing_targets?: Json | null
          updated_at?: string | null
          user_id: string
          work_days?: Json | null
        }
        Update: {
          advanced?: Json | null
          automation?: Json | null
          created_at?: string | null
          id?: string
          processing_targets?: Json | null
          updated_at?: string | null
          user_id?: string
          work_days?: Json | null
        }
        Relationships: []
      }
      user_session_state: {
        Row: {
          created_at: string | null
          current_context: Json | null
          expires_at: string | null
          id: string
          last_activity: string | null
          session_id: string
          ui_state: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_context?: Json | null
          expires_at?: string | null
          id?: string
          last_activity?: string | null
          session_id: string
          ui_state?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_context?: Json | null
          expires_at?: string | null
          id?: string
          last_activity?: string | null
          session_id?: string
          ui_state?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_message_queue: {
        Row: {
          agent_conversation_id: string | null
          agent_trigger_id: string | null
          attempts: number | null
          client_id: string | null
          created_at: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          expires_at: string | null
          id: string
          last_error: string | null
          last_retry_at: string | null
          lead_id: string | null
          max_retries: number | null
          message_content: string
          message_template: string | null
          message_type: string
          message_variables: Json | null
          priority: number | null
          processed_at: string | null
          queue_metadata: Json | null
          queue_position: number
          queue_status: string | null
          queued_at: string | null
          rate_limit_count: number | null
          rate_limit_key: string | null
          rate_limit_window_start: string | null
          read_at: string | null
          recipient_phone: string
          retry_count: number | null
          scheduled_for: string | null
          send_after: string | null
          sender_phone_number_id: string | null
          sent_at: string | null
          template_name: string | null
          template_parameters: Json | null
          updated_at: string | null
          user_id: string | null
          whatsapp_message_id: string | null
        }
        Insert: {
          agent_conversation_id?: string | null
          agent_trigger_id?: string | null
          attempts?: number | null
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_retry_at?: string | null
          lead_id?: string | null
          max_retries?: number | null
          message_content: string
          message_template?: string | null
          message_type?: string
          message_variables?: Json | null
          priority?: number | null
          processed_at?: string | null
          queue_metadata?: Json | null
          queue_position: number
          queue_status?: string | null
          queued_at?: string | null
          rate_limit_count?: number | null
          rate_limit_key?: string | null
          rate_limit_window_start?: string | null
          read_at?: string | null
          recipient_phone: string
          retry_count?: number | null
          scheduled_for?: string | null
          send_after?: string | null
          sender_phone_number_id?: string | null
          sent_at?: string | null
          template_name?: string | null
          template_parameters?: Json | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_message_id?: string | null
        }
        Update: {
          agent_conversation_id?: string | null
          agent_trigger_id?: string | null
          attempts?: number | null
          client_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          expires_at?: string | null
          id?: string
          last_error?: string | null
          last_retry_at?: string | null
          lead_id?: string | null
          max_retries?: number | null
          message_content?: string
          message_template?: string | null
          message_type?: string
          message_variables?: Json | null
          priority?: number | null
          processed_at?: string | null
          queue_metadata?: Json | null
          queue_position?: number
          queue_status?: string | null
          queued_at?: string | null
          rate_limit_count?: number | null
          rate_limit_key?: string | null
          rate_limit_window_start?: string | null
          read_at?: string | null
          recipient_phone?: string
          retry_count?: number | null
          scheduled_for?: string | null
          send_after?: string | null
          sender_phone_number_id?: string | null
          sent_at?: string | null
          template_name?: string | null
          template_parameters?: Json | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_message_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_message_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_audit_log: {
        Row: {
          id: string
          conversation_id: string | null
          action: string
          from_status: string | null
          to_status: string | null
          validation_mode: string | null
          context: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          conversation_id?: string | null
          action: string
          from_status?: string | null
          to_status?: string | null
          validation_mode?: string | null
          context?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string | null
          action?: string
          from_status?: string | null
          to_status?: string | null
          validation_mode?: string | null
          context?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_audit_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_system_metrics: {
        Row: {
          id: string
          total_queue_items_24h: number | null
          processed_messages: number | null
          queued_messages: number | null
          failed_messages: number | null
          processing_messages: number | null
          avg_processing_time_seconds: string | null
          avg_queue_wait_time_seconds: string | null
          max_retry_count: number | null
          avg_queue_priority: number | null
          success_rate_percentage: string | null
          updated_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          total_queue_items_24h?: number | null
          processed_messages?: number | null
          queued_messages?: number | null
          failed_messages?: number | null
          processing_messages?: number | null
          avg_processing_time_seconds?: string | null
          avg_queue_wait_time_seconds?: string | null
          max_retry_count?: number | null
          avg_queue_priority?: number | null
          success_rate_percentage?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          total_queue_items_24h?: number | null
          processed_messages?: number | null
          queued_messages?: number | null
          failed_messages?: number | null
          processing_messages?: number | null
          avg_processing_time_seconds?: string | null
          avg_queue_wait_time_seconds?: string | null
          max_retry_count?: number | null
          avg_queue_priority?: number | null
          success_rate_percentage?: string | null
          updated_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      agent_interaction_logs: {
        Row: {
          interaction_log_id: string
          lead_id: string
          interaction_timestamp: string
          agent_input_context: Json | null
          agent_raw_output: Json | null
          n8n_determined_lead_state: string | null
          n8n_determined_lead_status: string | null
          n8n_determined_bant_status: string | null
          n8n_determined_bant_details: Json | null
          n8n_action_taken: string | null
          created_at: string
          triggering_message_id: string | null
        }
        Insert: {
          interaction_log_id?: string
          lead_id: string
          interaction_timestamp?: string
          agent_input_context?: Json | null
          agent_raw_output?: Json | null
          n8n_determined_lead_state?: string | null
          n8n_determined_lead_status?: string | null
          n8n_determined_bant_status?: string | null
          n8n_determined_bant_details?: Json | null
          n8n_action_taken?: string | null
          created_at?: string
          triggering_message_id?: string | null
        }
        Update: {
          interaction_log_id?: string
          lead_id?: string
          interaction_timestamp?: string
          agent_input_context?: Json | null
          agent_raw_output?: Json | null
          n8n_determined_lead_state?: string | null
          n8n_determined_lead_status?: string | null
          n8n_determined_bant_status?: string | null
          n8n_determined_bant_details?: Json | null
          n8n_action_taken?: string | null
          created_at?: string
          triggering_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_interaction_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      whatsapp_messages: {
        Row: {
          content: string | null
          created_at: string | null
          direction: string | null
          id: string | null
          lead_id: string | null
          receiver_number: string | null
          sender_number: string | null
          updated_at: string | null
          wa_timestamp: string | null
          wamid: string | null
        }
        Insert: {
          content?: never
          created_at?: string | null
          direction?: never
          id?: string | null
          lead_id?: string | null
          receiver_number?: string | null
          sender_number?: string | null
          updated_at?: string | null
          wa_timestamp?: never
          wamid?: string | null
        }
        Update: {
          content?: never
          created_at?: string | null
          direction?: never
          id?: string | null
          lead_id?: string | null
          receiver_number?: string | null
          sender_number?: string | null
          updated_at?: string | null
          wa_timestamp?: never
          wamid?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auto_sync_to_backend: {
        Args: { payload: Json; queue_id: string }
        Returns: undefined
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_lead_priority: {
        Args: {
          lead_heat_score: number
          lead_status: string
          lead_created_at: string
          user_settings_id: string
        }
        Returns: number
      }
      call_backend_crud_sync: {
        Args: {
          entity_type: string
          entity_data: Json
          sync_operation?: string
        }
        Returns: Json
      }
      call_minimal_sync_rpc: {
        Args: { lead_data: Json } | { lead_data: Json; sync_operation?: string }
        Returns: Json
      }
      change_user_client: {
        Args: { target_user_id: string; new_client_id: string }
        Returns: Json
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_old_system_changes: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      database_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          status: string
          details: string
        }[]
      }
      decrypt_credential: {
        Args: { encrypted_text: string }
        Returns: string
      }
      demote_from_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      disable_frontend_to_backend_triggers: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      disable_frontend_triggers: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      enable_frontend_to_backend_triggers: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      enable_frontend_triggers: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      encrypt_credential: {
        Args: { plain_text: string }
        Returns: string
      }
      force_schema_refresh: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_clients: number
          total_projects: number
          total_leads: number
          active_users_last_30_days: number
          leads_this_month: number
          projects_this_month: number
        }[]
      }
      get_all_clients_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          client_status: string
          created_at: string
          updated_at: string
          user_count: number
          project_count: number
          lead_count: number
          active_leads: number
        }[]
      }
      get_all_users_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          admin_level: string
          created_at: string
          last_sign_in_at: string
          leads_count: number
          projects_count: number
        }[]
      }
      get_current_admin_level: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_manageable_clients: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          description: string
          status: string
          created_at: string
          user_count: number
          project_count: number
          lead_count: number
        }[]
      }
      get_manageable_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          full_name: string
          admin_level: string
          status: string
          role: string
          created_at: string
          client_name: string
          client_id: string
          api_keys_count: number
        }[]
      }
      get_next_queue_position: {
        Args: { queue_table: string; user_filter: string }
        Returns: number
      }
      get_next_queued_messages: {
        Args: { p_user_id: string; p_limit?: number }
        Returns: {
          queue_id: string
          message_id: string
          lead_id: string
          message_content: string
          recipient_phone: string
          priority: number
          scheduled_for: string
        }[]
      }
      get_notification_summary: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_project_lead_count: {
        Args: { project_id: string }
        Returns: number
      }
      get_projects_with_system_prompts: {
        Args: Record<PropertyKey, never>
        Returns: {
          project_id: string
          project_name: string
          project_status: string
          created_at: string
          client_id: string
          client_name: string
          system_prompt: string
          system_prompt_id: string
        }[]
      }
      get_system_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_clients: number
          total_projects: number
          total_leads: number
          active_leads: number
          system_health: string
        }[]
      }
      get_system_prompts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_admin_level: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_context: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          admin_level: string
          client_ids: string[]
          has_system_access: boolean
          has_client_admin_access: boolean
        }[]
      }
      get_user_credential: {
        Args: {
          p_user_id: string
          p_credential_type: string
          p_credential_name: string
          p_environment?: string
        }
        Returns: string
      }
      get_user_stats_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          email: string
          role: string
          admin_level: string
          status: string
          created_at: string
          client_name: string
          client_id: string
          api_keys_count: number
        }[]
      }
      handle_cross_database_batch_insert: {
        Args: { batch_data: Json }
        Returns: Json
      }
      handle_cross_database_insert: {
        Args: { entity_type: string; entity_data: Json; sync_metadata?: Json }
        Returns: Json
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      initialize_complete_user: {
        Args: { user_id: string; user_email: string }
        Returns: Json
      }
      initialize_complete_user_english: {
        Args: { user_id: string; user_email: string }
        Returns: Json
      }
      initialize_existing_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      initialize_user_for_edge_function: {
        Args: {
          user_id: string
          user_email: string
          user_name?: string
          user_role?: string
          language?: string
          currency?: string
          timezone?: string
        }
        Returns: Json
      }
      insert_client_bypass_membership: {
        Args: { client_data: Json }
        Returns: Json
      }
      insert_staged_lead: {
        Args: {
          p_batch_id: string
          p_name: string
          p_phone: string
          p_email?: string
          p_company?: string
          p_raw_data?: Json
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_system_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      manual_sync_lead: {
        Args: { lead_id: string }
        Returns: Json
      }
      meta_submission_readiness_check: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      postgres_fdw_disconnect: {
        Args: { "": string }
        Returns: boolean
      }
      postgres_fdw_disconnect_all: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      postgres_fdw_get_connections: {
        Args: Record<PropertyKey, never>
        Returns: Record<string, unknown>[]
      }
      postgres_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      promote_to_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
      queue_whatsapp_message: {
        Args: {
          p_message_id: string
          p_lead_id: string
          p_user_id: string
          p_message_content: string
          p_recipient_phone: string
          p_priority?: number
          p_scheduled_for?: string
        }
        Returns: string
      }
      refresh_all_project_lead_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          project_id: string
          project_name: string
          old_count: number
          new_count: number
        }[]
      }
      reset_user_preferences: {
        Args: { target_user_id: string }
        Returns: Json
      }
      set_user_credential: {
        Args: {
          p_user_id: string
          p_credential_type: string
          p_credential_name: string
          p_value: string
          p_environment?: string
          p_metadata?: Json
          p_expires_at?: string
        }
        Returns: string
      }
      site_db_access_diagnostics: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          total_records: number
          accessible_to_authenticated: number
          policy_status: string
          messages_page_ready: boolean
        }[]
      }
      smart_stitch_lead_update: {
        Args: { p_lead_id: string; p_partial_data: Json }
        Returns: Json
      }
      sync_lead_to_agent_no_jwt: {
        Args: { p_lead_data: Json; p_site_staging_id?: string }
        Returns: Json
      }
      sync_lead_to_external: {
        Args: { lead_id: string; action?: string }
        Returns: Json
      }
      sync_processed_lead_to_frontend_seamless: {
        Args: { p_lead_id: string; p_site_staging_id?: string }
        Returns: undefined
      }
      test_fdw_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          status: string
          details: string
        }[]
      }
      test_sync_system_comprehensive: {
        Args: Record<PropertyKey, never>
        Returns: {
          approach: string
          test_name: string
          status: string
          details: string
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      trigger_pending_syncs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_message_queue_status: {
        Args: { p_queue_id: string; p_status: string; p_error_message?: string }
        Returns: boolean
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      validate_phase1_standardization: {
        Args: Record<PropertyKey, never>
        Returns: {
          component: string
          field_standardized: string
          status: string
        }[]
      }
      verify_uuid_standardization: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          column_name: string
          default_function: string
          status: string
        }[]
      }
    }
    Enums: {
      processing_state_enum:
        | "pending"
        | "queued"
        | "active"
        | "completed"
        | "failed"
        | "archived"
        | "rate_limited"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      processing_state_enum: [
        "pending",
        "queued",
        "active",
        "completed",
        "failed",
        "archived",
        "rate_limited",
      ],
    },
  },
} as const
