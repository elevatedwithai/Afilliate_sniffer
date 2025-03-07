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
      affiliate_links: {
        Row: {
          id: string
          tool_name: string
          website_url: string
          affiliate_url: string | null
          commission: string | null
          cookie_duration: string | null
          payout_type: string | null
          contact_email: string | null
          contact_page_url: string | null
          social_links: Json | null
          outreach_status: string | null
          notes: string | null
          description: string | null
          category: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          tool_name: string
          website_url: string
          affiliate_url?: string | null
          commission?: string | null
          cookie_duration?: string | null
          payout_type?: string | null
          contact_email?: string | null
          contact_page_url?: string | null
          social_links?: Json | null
          outreach_status?: string | null
          notes?: string | null
          description?: string | null
          category?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          tool_name?: string
          website_url?: string
          affiliate_url?: string | null
          commission?: string | null
          cookie_duration?: string | null
          payout_type?: string | null
          contact_email?: string | null
          contact_page_url?: string | null
          social_links?: Json | null
          outreach_status?: string | null
          notes?: string | null
          description?: string | null
          category?: string | null
          status?: string
          created_at?: string
        }
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
