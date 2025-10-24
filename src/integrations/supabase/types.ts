export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          project_id: string
          lead_id: string
          status: 'active' | 'completed' | 'abandoned' | 'stalled'
          stage: 'initial' | 'middle' | 'final'
          started_at: string
          last_message_at: string | null
          completed_at: string | null
          abandoned_at: string | null
          meeting_scheduled: boolean
          meeting_scheduled_at: string | null
          message_count: number
          reply_count: number
          temperature_changes: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          lead_id: string
          status?: 'active' | 'completed' | 'abandoned' | 'stalled'
          stage?: 'initial' | 'middle' | 'final'
          started_at?: string
          last_message_at?: string | null
          completed_at?: string | null
          abandoned_at?: string | null
          meeting_scheduled?: boolean
          meeting_scheduled_at?: string | null
          message_count?: number
          reply_count?: number
          temperature_changes?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          lead_id?: string
          status?: 'active' | 'completed' | 'abandoned' | 'stalled'
          stage?: 'initial' | 'middle' | 'final'
          started_at?: string
          last_message_at?: string | null
          completed_at?: string | null
          abandoned_at?: string | null
          meeting_scheduled?: boolean
          meeting_scheduled_at?: string | null
          message_count?: number
          reply_count?: number
          temperature_changes?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_messages: {
        Row: {
          id: string
          conversation_id: string
          project_id: string
          lead_id: string
          content: string
          direction: 'inbound' | 'outbound'
          channel: 'whatsapp' | 'email' | 'sms' | 'call'
          message_type: 'text' | 'image' | 'document' | 'audio' | 'video'
          is_automated: boolean
          sent_at: string
          delivered_at: string | null
          read_at: string | null
          replied_at: string | null
          response_time_minutes: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          project_id: string
          lead_id: string
          content: string
          direction: 'inbound' | 'outbound'
          channel?: 'whatsapp' | 'email' | 'sms' | 'call'
          message_type?: 'text' | 'image' | 'document' | 'audio' | 'video'
          is_automated?: boolean
          sent_at: string
          delivered_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          response_time_minutes?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          project_id?: string
          lead_id?: string
          content?: string
          direction?: 'inbound' | 'outbound'
          channel?: 'whatsapp' | 'email' | 'sms' | 'call'
          message_type?: 'text' | 'image' | 'document' | 'audio' | 'video'
          is_automated?: boolean
          sent_at?: string
          delivered_at?: string | null
          read_at?: string | null
          replied_at?: string | null
          response_time_minutes?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      interactions: {
        Row: {
          id: string
          project_id: string
          conversation_id: string
          lead_id: string
          interaction_type: 'click' | 'reply' | 'view' | 'download' | 'meeting_scheduled' | 'temperature_change'
          metadata: Json
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          conversation_id: string
          lead_id: string
          interaction_type: 'click' | 'reply' | 'view' | 'download' | 'meeting_scheduled' | 'temperature_change'
          metadata?: Json
          occurred_at: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          conversation_id?: string
          lead_id?: string
          interaction_type?: 'click' | 'reply' | 'view' | 'download' | 'meeting_scheduled' | 'temperature_change'
          metadata?: Json
          occurred_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_starters: {
        Row: {
          id: string
          project_id: string
          title: string
          content: string
          description: string | null
          category: 'general' | 'introduction' | 'follow_up' | 'value_proposition' | 'objection_handling' | 'closing'
          is_active: boolean
          is_tested: boolean
          test_results: Json
          usage_count: number
          success_rate: number
          last_used_at: string | null
          meta_approval_status: 'pending' | 'approved' | 'rejected' | 'under_review'
          meta_submitted_at: string | null
          meta_approved_at: string | null
          meta_rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          content: string
          description?: string | null
          category?: 'general' | 'introduction' | 'follow_up' | 'value_proposition' | 'objection_handling' | 'closing'
          is_active?: boolean
          is_tested?: boolean
          test_results?: Json
          usage_count?: number
          success_rate?: number
          last_used_at?: string | null
          meta_approval_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          meta_submitted_at?: string | null
          meta_approved_at?: string | null
          meta_rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          content?: string
          description?: string | null
          category?: 'general' | 'introduction' | 'follow_up' | 'value_proposition' | 'objection_handling' | 'closing'
          is_active?: boolean
          is_tested?: boolean
          test_results?: Json
          usage_count?: number
          success_rate?: number
          last_used_at?: string | null
          meta_approval_status?: 'pending' | 'approved' | 'rejected' | 'under_review'
          meta_submitted_at?: string | null
          meta_approved_at?: string | null
          meta_rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      conversation_starter_templates: {
        Row: {
          id: string
          name: string
          content: string
          description: string | null
          category: string
          industry: string | null
          use_case: string | null
          variables: Json
          is_public: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          content: string
          description?: string | null
          category?: string
          industry?: string | null
          use_case?: string | null
          variables?: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          content?: string
          description?: string | null
          category?: string
          industry?: string | null
          use_case?: string | null
          variables?: Json
          is_public?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_starter_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          notes: string | null
          phone: string | null
          project_id: string | null
          status: number | null
          temperature: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          status?: number | null
          temperature?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          status?: number | null
          temperature?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_temperature_history: {
        Row: {
          id: string
          lead_id: string
          project_id: string
          old_temperature: string | null
          new_temperature: string
          changed_at: string
          trigger_event: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          project_id: string
          old_temperature?: string | null
          new_temperature: string
          changed_at?: string
          trigger_event?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          project_id?: string
          old_temperature?: string | null
          new_temperature?: string
          changed_at?: string
          trigger_event?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_temperature_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_temperature_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      meeting_events: {
        Row: {
          id: string
          project_id: string
          conversation_id: string
          lead_id: string
          scheduled_at: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          meeting_url: string | null
          duration_minutes: number | null
          outcome: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          conversation_id: string
          lead_id: string
          scheduled_at: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          meeting_url?: string | null
          duration_minutes?: number | null
          outcome?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          conversation_id?: string
          lead_id?: string
          scheduled_at?: string
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          meeting_url?: string | null
          duration_minutes?: number | null
          outcome?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          direction: string | null
          id: string
          lead_id: string | null
          timestamp: string | null
        }
        Insert: {
          body?: string | null
          direction?: string | null
          id?: string
          lead_id?: string | null
          timestamp?: string | null
        }
        Update: {
          body?: string | null
          direction?: string | null
          id?: string
          lead_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
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
      users: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_conversation_stats: {
        Row: {
          project_id: string
          date: string
          total_conversations: number
          completed_conversations: number
          abandoned_conversations: number
          meetings_scheduled: number
          avg_messages_per_conversation: number
          avg_replies_per_conversation: number
        }
        Relationships: []
      }
      hourly_message_stats: {
        Row: {
          project_id: string
          date: string
          hour: number
          total_messages: number
          outbound_messages: number
          inbound_messages: number
          messages_with_replies: number
          avg_response_time_minutes: number
        }
        Relationships: []
      }
    }
    Functions: {
      add_staff_user: {
        Args: { p_email: string; p_name: string; p_password: string }
        Returns: undefined
      }
      get_my_client_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      refresh_reporting_views: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      track_temperature_change: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
