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
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          mentions: string[] | null
          parent_message_id: string | null
          recipient_name: string | null
          sender_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          mentions?: string[] | null
          parent_message_id?: string | null
          recipient_name?: string | null
          sender_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          mentions?: string[] | null
          parent_message_id?: string | null
          recipient_name?: string | null
          sender_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          broker_minisite_enabled: boolean | null
          created_at: string
          descricao: string | null
          finalidade: string | null
          fotos: string[] | null
          id: string
          is_public: boolean | null
          quartos: number | null
          titulo: string
          updated_at: string
          user_id: string | null
          valor: number | null
          videos: string[] | null
        }
        Insert: {
          area?: number | null
          broker_minisite_enabled?: boolean | null
          created_at?: string
          descricao?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string
          is_public?: boolean | null
          quartos?: number | null
          titulo: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          videos?: string[] | null
        }
        Update: {
          area?: number | null
          broker_minisite_enabled?: boolean | null
          created_at?: string
          descricao?: string | null
          finalidade?: string | null
          fotos?: string[] | null
          id?: string
          is_public?: boolean | null
          quartos?: number | null
          titulo?: string
          updated_at?: string
          user_id?: string | null
          valor?: number | null
          videos?: string[] | null
        }
        Relationships: []
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
