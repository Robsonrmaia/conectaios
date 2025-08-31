export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          sort_order: number | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          sort_order?: number | null
          title?: string
        }
        Relationships: []
      }
      brokers: {
        Row: {
          asaas_customer_id: string | null
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          creci: string | null
          email: string
          id: string
          name: string
          phone: string | null
          plan_id: string | null
          referral_code: string | null
          region_id: string | null
          status: string
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          creci?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          plan_id?: string | null
          referral_code?: string | null
          region_id?: string | null
          status?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          asaas_customer_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          creci?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          plan_id?: string | null
          referral_code?: string | null
          region_id?: string | null
          status?: string
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          client_id: string | null
          created_at: string
          due_date: string | null
          icon: string | null
          id: string
          meta: string | null
          photo: string | null
          project_id: string | null
          prop_id: string | null
          space: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          icon?: string | null
          id?: string
          meta?: string | null
          photo?: string | null
          project_id?: string | null
          prop_id?: string | null
          space: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          icon?: string | null
          id?: string
          meta?: string | null
          photo?: string | null
          project_id?: string | null
          prop_id?: string | null
          space?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cards_prop_id_fkey"
            columns: ["prop_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      client_preferences: {
        Row: {
          bathrooms: number[] | null
          bedrooms: number[] | null
          client_id: string
          created_at: string
          features: string[] | null
          id: string
          max_area: number | null
          max_price: number | null
          min_area: number | null
          min_price: number | null
          neighborhoods: string[] | null
          parking_spots: number[] | null
          property_type: string[] | null
          updated_at: string
        }
        Insert: {
          bathrooms?: number[] | null
          bedrooms?: number[] | null
          client_id: string
          created_at?: string
          features?: string[] | null
          id?: string
          max_area?: number | null
          max_price?: number | null
          min_area?: number | null
          min_price?: number | null
          neighborhoods?: string[] | null
          parking_spots?: number[] | null
          property_type?: string[] | null
          updated_at?: string
        }
        Update: {
          bathrooms?: number[] | null
          bedrooms?: number[] | null
          client_id?: string
          created_at?: string
          features?: string[] | null
          id?: string
          max_area?: number | null
          max_price?: number | null
          min_area?: number | null
          min_price?: number | null
          neighborhoods?: string[] | null
          parking_spots?: number[] | null
          property_type?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_preferences_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          classificacao: string | null
          created_at: string
          documents: string[] | null
          historico: Json | null
          id: string
          nome: string
          opp: string | null
          photo: string | null
          responsavel: string | null
          telefone: string
          tipo: string
          updated_at: string
          user_id: string | null
          valor: number | null
        }
        Insert: {
          classificacao?: string | null
          created_at?: string
          documents?: string[] | null
          historico?: Json | null
          id?: string
          nome: string
          opp?: string | null
          photo?: string | null
          responsavel?: string | null
          telefone: string
          tipo: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          classificacao?: string | null
          created_at?: string
          documents?: string[] | null
          historico?: Json | null
          id?: string
          nome?: string
          opp?: string | null
          photo?: string | null
          responsavel?: string | null
          telefone?: string
          tipo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          empresa: string | null
          id: string
          interesse: string
          ip_address: string | null
          nome: string
          telefone: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          empresa?: string | null
          id?: string
          interesse: string
          ip_address?: string | null
          nome: string
          telefone: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          empresa?: string | null
          id?: string
          interesse?: string
          ip_address?: string | null
          nome?: string
          telefone?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_data: Json
          created_at: string
          deal_id: string
          id: string
          pdf_url: string | null
          signed_at: string | null
          status: string
          template_name: string
          updated_at: string
        }
        Insert: {
          contract_data?: Json
          created_at?: string
          deal_id: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: string
          template_name?: string
          updated_at?: string
        }
        Update: {
          contract_data?: Json
          created_at?: string
          deal_id?: string
          id?: string
          pdf_url?: string | null
          signed_at?: string | null
          status?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_history: {
        Row: {
          action: string
          amount: number | null
          broker_id: string
          created_at: string
          deal_id: string
          id: string
          message: string | null
        }
        Insert: {
          action: string
          amount?: number | null
          broker_id: string
          created_at?: string
          deal_id: string
          id?: string
          message?: string | null
        }
        Update: {
          action?: string
          amount?: number | null
          broker_id?: string
          created_at?: string
          deal_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_history_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          buyer_broker_id: string
          client_id: string | null
          commission_split: Json
          created_at: string
          expires_at: string | null
          id: string
          listing_broker_id: string | null
          notes: string | null
          offer_amount: number
          property_id: string
          seller_broker_id: string | null
          signed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_broker_id: string
          client_id?: string | null
          commission_split?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_broker_id?: string | null
          notes?: string | null
          offer_amount: number
          property_id: string
          seller_broker_id?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_broker_id?: string
          client_id?: string | null
          commission_split?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          listing_broker_id?: string | null
          notes?: string | null
          offer_amount?: number
          property_id?: string
          seller_broker_id?: string | null
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_buyer_broker_id_fkey"
            columns: ["buyer_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_listing_broker_id_fkey"
            columns: ["listing_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_seller_broker_id_fkey"
            columns: ["seller_broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      login_events: {
        Row: {
          created_at: string
          creci: string
          id: string
          ip: string | null
          name: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          creci: string
          id?: string
          ip?: string | null
          name: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          creci?: string
          id?: string
          ip?: string | null
          name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          broker_id: string | null
          content: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean | null
          mentions: string[] | null
          message_type: string | null
          parent_message_id: string | null
          read_by: string[] | null
          recipient_name: string | null
          sender_name: string
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id?: string | null
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          mentions?: string[] | null
          message_type?: string | null
          parent_message_id?: string | null
          read_by?: string[] | null
          recipient_name?: string | null
          sender_name: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string | null
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          mentions?: string[] | null
          message_type?: string | null
          parent_message_id?: string | null
          read_by?: string[] | null
          recipient_name?: string | null
          sender_name?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      partnerships: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      plan_tools: {
        Row: {
          created_at: string
          daily_limit: number | null
          id: string
          is_enabled: boolean | null
          monthly_limit: number | null
          plan_id: string
          tool_name: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_enabled?: boolean | null
          monthly_limit?: number | null
          plan_id: string
          tool_name: string
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          id?: string
          is_enabled?: boolean | null
          monthly_limit?: number | null
          plan_id?: string
          tool_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_tools_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          is_active: boolean | null
          match_limit: number
          name: string
          price: number
          property_limit: number
          slug: string
          thread_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          match_limit?: number
          name: string
          price?: number
          property_limit?: number
          slug: string
          thread_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          match_limit?: number
          name?: string
          price?: number
          property_limit?: number
          slug?: string
          thread_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nome: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          notebooklm: string | null
          people: Json | null
          prop_id: string | null
          status: string
          tags: string[] | null
          titulo: string
          updated_at: string
          user_id: string | null
          videos: string[] | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          notebooklm?: string | null
          people?: Json | null
          prop_id?: string | null
          status?: string
          tags?: string[] | null
          titulo: string
          updated_at?: string
          user_id?: string | null
          videos?: string[] | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          notebooklm?: string | null
          people?: Json | null
          prop_id?: string | null
          status?: string
          tags?: string[] | null
          titulo?: string
          updated_at?: string
          user_id?: string | null
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_prop_id_fkey"
            columns: ["prop_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          broker_minisite_enabled: boolean | null
          created_at: string
          descricao: string | null
          finalidade: string | null
          fotos: string[] | null
          id: string
          is_public: boolean | null
          listing_type: string | null
          parking_spots: number | null
          property_type: string | null
          quartos: number | null
          titulo: string
          updated_at: string
          user_id: string | null
          valor: number | null
          videos: string[] | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          broker_minisite_enabled?: boolean | null
          created_at?: string
          descricao?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string
          is_public?: boolean | null
          listing_type?: string | null
          parking_spots?: number | null
          property_type?: string | null
          quartos?: number | null
          titulo: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          videos?: string[] | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          broker_minisite_enabled?: boolean | null
          created_at?: string
          descricao?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string
          is_public?: boolean | null
          listing_type?: string | null
          parking_spots?: number | null
          property_type?: string | null
          quartos?: number | null
          titulo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          videos?: string[] | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          commission_amount: number | null
          created_at: string
          id: string
          paid_at: string | null
          referral_code: string
          referred_id: string | null
          referrer_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code: string
          referred_id?: string | null
          referrer_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referral_code?: string
          referred_id?: string | null
          referrer_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      responsibles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          created_at: string
          id: string
          payload: Json
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload: Json
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean | null
          id: string
          onde: string | null
          porque: string | null
          quando: string | null
          quem: string | null
          responsavel: string | null
          txt: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          done?: boolean | null
          id?: string
          onde?: string | null
          porque?: string | null
          quando?: string | null
          quem?: string | null
          responsavel?: string | null
          txt: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          done?: boolean | null
          id?: string
          onde?: string | null
          porque?: string | null
          quando?: string | null
          quem?: string | null
          responsavel?: string | null
          txt?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_responsavel_fkey"
            columns: ["responsavel"]
            isOneToOne: false
            referencedRelation: "responsibles"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          deal_id: string | null
          id: string
          last_message_at: string | null
          participants: string[]
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          id?: string
          last_message_at?: string | null
          participants?: string[]
          title?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          id?: string
          last_message_at?: string | null
          participants?: string[]
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_login_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
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
    Enums: {},
  },
} as const
