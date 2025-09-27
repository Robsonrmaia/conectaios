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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conectaios_brokers: {
        Row: {
          bio: string | null
          commission_rate: number | null
          company_name: string | null
          company_phone: string | null
          created_at: string | null
          creci: string | null
          id: string
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          creci?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          commission_rate?: number | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string | null
          creci?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conectaios_brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conectaios_clients: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_locations: string[] | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conectaios_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conectaios_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conectaios_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conectaios_properties: {
        Row: {
          address: string | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condominium_fee: number | null
          created_at: string | null
          description: string | null
          id: string
          iptu: number | null
          latitude: number | null
          longitude: number | null
          parking_spots: number | null
          photos: string[] | null
          price: number | null
          property_type: Database["public"]["Enums"]["property_type"] | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"] | null
          title: string
          tour_360_url: string | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          zipcode: string | null
        }
        Insert: {
          address?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          iptu?: number | null
          latitude?: number | null
          longitude?: number | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          title: string
          tour_360_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          zipcode?: string | null
        }
        Update: {
          address?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          iptu?: number | null
          latitude?: number | null
          longitude?: number | null
          parking_spots?: number | null
          photos?: string[] | null
          price?: number | null
          property_type?: Database["public"]["Enums"]["property_type"] | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"] | null
          title?: string
          tour_360_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conectaios_properties_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conectaios_tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conectaios_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          client_id: string | null
          commission_amount: number | null
          created_at: string | null
          id: string
          notes: string | null
          offer_amount: number | null
          property_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          offer_amount?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          offer_amount?: number | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "conectaios_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "conectaios_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      property_status: "active" | "sold" | "rented" | "inactive" | "pending"
      property_type: "apartment" | "house" | "commercial" | "land" | "farm"
      user_role: "admin" | "broker" | "client"
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
    Enums: {
      property_status: ["active", "sold", "rented", "inactive", "pending"],
      property_type: ["apartment", "house", "commercial", "land", "farm"],
      user_role: ["admin", "broker", "client"],
    },
  },
} as const
