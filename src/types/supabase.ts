export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          client_id: string
          status: 'active' | 'archived' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          client_id: string
          status?: 'active' | 'archived' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          client_id?: string
          status?: 'active' | 'archived' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          project_id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          company: string | null
          position: string | null
          location: string | null
          status: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'MEETING_SCHEDULED' | 'CLOSED_WON' | 'CLOSED_LOST'
          temperature: number
          heat: string | null
          state: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          location?: string | null
          status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'MEETING_SCHEDULED' | 'CLOSED_WON' | 'CLOSED_LOST'
          temperature?: number
          heat?: string | null
          state?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          location?: string | null
          status?: 'NEW' | 'CONTACTED' | 'INTERESTED' | 'NOT_INTERESTED' | 'MEETING_SCHEDULED' | 'CLOSED_WON' | 'CLOSED_LOST'
          temperature?: number
          heat?: string | null
          state?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 