/**
 * Auto-generated Supabase database types.
 * Run `npx supabase gen types typescript --project-id <your-project-id>` to regenerate.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          plan: 'free' | 'growth' | 'agency';
          credits: number;
          is_admin: boolean;
          suspended: boolean;
          compliance_accepted: boolean;
          settings: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          plan?: 'free' | 'growth' | 'agency';
          credits?: number;
          is_admin?: boolean;
          suspended?: boolean;
          compliance_accepted?: boolean;
          settings?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          plan?: 'free' | 'growth' | 'agency';
          credits?: number;
          is_admin?: boolean;
          suspended?: boolean;
          compliance_accepted?: boolean;
          settings?: Json | null;
          updated_at?: string;
        };
      };

      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          address: string;
          phone: string | null;
          email: string | null;
          email_status: 'verified' | 'risky' | 'invalid' | 'unknown' | null;
          email_source: 'apollo' | 'hunter' | 'manual' | 'ai_inferred' | null;
          website: string | null;
          socials: Json | null;
          category: string;
          rating: number | null;
          review_count: number | null;
          maps_url: string | null;
          pipeline_stage: 'New Lead' | 'Contacted' | 'Interested' | 'Meeting Booked' | 'Closed' | 'Lost' | null;
          outreach: Json | null;
          workflow_status: 'idle' | 'active' | 'completed' | 'failed' | null;
          current_step_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          address: string;
          phone?: string | null;
          email?: string | null;
          email_status?: 'verified' | 'risky' | 'invalid' | 'unknown' | null;
          email_source?: 'apollo' | 'hunter' | 'manual' | 'ai_inferred' | null;
          website?: string | null;
          socials?: Json | null;
          category: string;
          rating?: number | null;
          review_count?: number | null;
          maps_url?: string | null;
          pipeline_stage?: 'New Lead' | 'Contacted' | 'Interested' | 'Meeting Booked' | 'Closed' | 'Lost' | null;
          outreach?: Json | null;
          workflow_status?: 'idle' | 'active' | 'completed' | 'failed' | null;
          current_step_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string;
          phone?: string | null;
          email?: string | null;
          email_status?: 'verified' | 'risky' | 'invalid' | 'unknown' | null;
          email_source?: 'apollo' | 'hunter' | 'manual' | 'ai_inferred' | null;
          website?: string | null;
          socials?: Json | null;
          category?: string;
          rating?: number | null;
          review_count?: number | null;
          maps_url?: string | null;
          pipeline_stage?: 'New Lead' | 'Contacted' | 'Interested' | 'Meeting Booked' | 'Closed' | 'Lost' | null;
          outreach?: Json | null;
          workflow_status?: 'idle' | 'active' | 'completed' | 'failed' | null;
          current_step_id?: string | null;
          updated_at?: string;
        };
      };

      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          is_active: boolean;
          steps: Json;
          settings: Json;
          logs: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          is_active?: boolean;
          steps?: Json;
          settings?: Json;
          logs?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          is_active?: boolean;
          steps?: Json;
          settings?: Json;
          logs?: Json;
          updated_at?: string;
        };
      };

      workflow_leads: {
        Row: {
          id: string;
          workflow_id: string;
          contact_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          contact_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
      };

      conversations: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          lead_name: string;
          lead_email: string | null;
          last_message: string;
          last_message_time: string;
          unread_count: number;
          channel: 'email' | 'sms' | 'linkedin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          lead_name: string;
          lead_email?: string | null;
          last_message?: string;
          last_message_time?: string;
          unread_count?: number;
          channel: 'email' | 'sms' | 'linkedin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          contact_id?: string;
          lead_name?: string;
          lead_email?: string | null;
          last_message?: string;
          last_message_time?: string;
          unread_count?: number;
          channel?: 'email' | 'sms' | 'linkedin';
          updated_at?: string;
        };
      };

      messages: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          sender: 'user' | 'lead';
          content: string;
          channel: 'email' | 'sms' | 'linkedin';
          timestamp: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          sender: 'user' | 'lead';
          content: string;
          channel: 'email' | 'sms' | 'linkedin';
          timestamp?: string;
        };
        Update: {
          content?: string;
        };
      };

      knowledge_documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          type: 'text' | 'url' | 'file';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content: string;
          type: 'text' | 'url' | 'file';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          type?: 'text' | 'url' | 'file';
          updated_at?: string;
        };
      };

      meetings: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          provider: 'fireflies' | 'fathom' | 'manual';
          status: 'analyzing' | 'completed' | 'failed';
          summary: string | null;
          transcript: string | null;
          proposal: string | null;
          contact_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date: string;
          provider: 'fireflies' | 'fathom' | 'manual';
          status?: 'analyzing' | 'completed' | 'failed';
          summary?: string | null;
          transcript?: string | null;
          proposal?: string | null;
          contact_id?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          provider?: 'fireflies' | 'fathom' | 'manual';
          status?: 'analyzing' | 'completed' | 'failed';
          summary?: string | null;
          transcript?: string | null;
          proposal?: string | null;
          contact_id?: string | null;
        };
      };

      search_logs: {
        Row: {
          id: string;
          user_id: string;
          industry: string;
          country: string;
          location: string;
          results_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          industry: string;
          country: string;
          location: string;
          results_count: number;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
