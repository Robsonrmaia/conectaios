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
      audit_log: {
        Row: {
          action: string | null
          actor: string | null
          at: string | null
          entity: string | null
          entity_id: string | null
          id: number
          meta: Json | null
        }
        Insert: {
          action?: string | null
          actor?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          meta?: Json | null
        }
        Update: {
          action?: string | null
          actor?: string | null
          at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: number
          meta?: Json | null
        }
        Relationships: []
      }
      brokers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          cpf_cnpj: string | null
          created_at: string | null
          creci: string | null
          email: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          minisite_slug: string | null
          name: string | null
          phone: string | null
          plan_id: string | null
          referral_code: string | null
          region_id: string | null
          specialties: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string
          username: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          minisite_slug?: string | null
          name?: string | null
          phone?: string | null
          plan_id?: string | null
          referral_code?: string | null
          region_id?: string | null
          specialties?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          minisite_slug?: string | null
          name?: string | null
          phone?: string | null
          plan_id?: string | null
          referral_code?: string | null
          region_id?: string | null
          specialties?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          body: string | null
          created_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
          thread_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id: string
          thread_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          body?: string | null
          created_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          thread_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string | null
          left_at: string | null
          role: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_presence: {
        Row: {
          created_at: string
          id: string
          last_seen: string
          status: string
          typing_in_thread: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen?: string
          status?: string
          typing_in_thread?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen?: string
          status?: string
          typing_in_thread?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_receipts: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          status: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          status?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          status?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_threads: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_history: {
        Row: {
          action: string
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_searches: {
        Row: {
          broker_id: string | null
          client_id: string | null
          created_at: string
          filters: Json
          id: string
          is_active: boolean
          name: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          broker_id?: string | null
          client_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          name?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          broker_id?: string | null
          client_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          name?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_searches_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_searches_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "conectaios_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_searches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          broker_id: string | null
          created_at: string | null
          email: string | null
          historico: Json | null
          id: string
          nome: string
          score: number | null
          stage: string | null
          telefone: string | null
          tipo: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          historico?: Json | null
          id?: string
          nome: string
          score?: number | null
          stage?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          historico?: Json | null
          id?: string
          nome?: string
          score?: number | null
          stage?: string | null
          telefone?: string | null
          tipo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          broker_id: string | null
          created_at: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string | null
        }
        Relationships: []
      }
      crm_clients: {
        Row: {
          broker_id: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          email: string | null
          id: string
          indication_id: string | null
          name: string
          notes: string | null
          phone: string | null
          preferred_locations: string[] | null
          updated_at: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          broker_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          indication_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          preferred_locations?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          broker_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          indication_id?: string | null
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
          {
            foreignKeyName: "conectaios_clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_clients_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_clients_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "conectaios_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
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
            foreignKeyName: "crm_deals_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_property_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_property_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_property_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      crm_notes: {
        Row: {
          client_id: string | null
          content: string
          created_at: string | null
          id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
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
          {
            foreignKeyName: "conectaios_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_notes_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
          {
            foreignKeyName: "conectaios_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_tasks_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
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
        Relationships: []
      }
      gam_badges: {
        Row: {
          ativo: boolean
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          label: string
          prioridade: number | null
          slug: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          label: string
          prioridade?: number | null
          slug: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          label?: string
          prioridade?: number | null
          slug?: string
        }
        Relationships: []
      }
      gam_events: {
        Row: {
          created_at: string
          id: string
          meta: Json | null
          pontos: number
          ref_id: string | null
          ref_tipo: string | null
          rule_key: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json | null
          pontos?: number
          ref_id?: string | null
          ref_tipo?: string | null
          rule_key: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json | null
          pontos?: number
          ref_id?: string | null
          ref_tipo?: string | null
          rule_key?: string
          usuario_id?: string
        }
        Relationships: []
      }
      gam_points_rules: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          key: string
          label: string
          pontos: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          key: string
          label: string
          pontos?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          key?: string
          label?: string
          pontos?: number
        }
        Relationships: []
      }
      gam_user_monthly: {
        Row: {
          ano: number
          badges: Json | null
          created_at: string
          desconto_percent: number | null
          id: string
          mes: number
          pontos: number
          tier: string | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          ano: number
          badges?: Json | null
          created_at?: string
          desconto_percent?: number | null
          id?: string
          mes: number
          pontos?: number
          tier?: string | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          ano?: number
          badges?: Json | null
          created_at?: string
          desconto_percent?: number | null
          id?: string
          mes?: number
          pontos?: number
          tier?: string | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      imoveis: {
        Row: {
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string | null
          description: string | null
          distancia_mar: number | null
          id: string
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          neighborhood: string | null
          norm_title: string | null
          number: string | null
          owner_id: string
          parking: number | null
          price: number | null
          purpose: string
          search_vector: unknown | null
          state: string | null
          status: string | null
          street: string | null
          suites: number | null
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
          vista_mar: boolean | null
          zipcode: string | null
        }
        Insert: {
          area_built?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string | null
          description?: string | null
          distancia_mar?: number | null
          id?: string
          iptu?: number | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          neighborhood?: string | null
          norm_title?: string | null
          number?: string | null
          owner_id: string
          parking?: number | null
          price?: number | null
          purpose: string
          search_vector?: unknown | null
          state?: string | null
          status?: string | null
          street?: string | null
          suites?: number | null
          title: string
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
          vista_mar?: boolean | null
          zipcode?: string | null
        }
        Update: {
          area_built?: number | null
          area_total?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          condo_fee?: number | null
          created_at?: string | null
          description?: string | null
          distancia_mar?: number | null
          id?: string
          iptu?: number | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          neighborhood?: string | null
          norm_title?: string | null
          number?: string | null
          owner_id?: string
          parking?: number | null
          price?: number | null
          purpose?: string
          search_vector?: unknown | null
          state?: string | null
          status?: string | null
          street?: string | null
          suites?: number | null
          title?: string
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
          vista_mar?: boolean | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      imoveis_quality: {
        Row: {
          corretor_id: string
          created_at: string
          id: string
          imovel_id: string
          percentual: number
          tem_8_fotos: boolean
          updated_at: string
        }
        Insert: {
          corretor_id: string
          created_at?: string
          id?: string
          imovel_id: string
          percentual?: number
          tem_8_fotos?: boolean
          updated_at?: string
        }
        Update: {
          corretor_id?: string
          created_at?: string
          id?: string
          imovel_id?: string
          percentual?: number
          tem_8_fotos?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      imovel_features: {
        Row: {
          imovel_id: string
          key: string
          value: string | null
        }
        Insert: {
          imovel_id: string
          key: string
          value?: string | null
        }
        Update: {
          imovel_id?: string
          key?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      imovel_images: {
        Row: {
          created_at: string | null
          id: string
          imovel_id: string
          is_cover: boolean | null
          position: number | null
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          imovel_id: string
          is_cover?: boolean | null
          position?: number | null
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          imovel_id?: string
          is_cover?: boolean | null
          position?: number | null
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      indication_discounts: {
        Row: {
          created_at: string | null
          discount_percentage: number | null
          id: string
          indication_id: string
          used: boolean | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          indication_id: string
          used?: boolean | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number | null
          id?: string
          indication_id?: string
          used?: boolean | null
          valid_until?: string | null
        }
        Relationships: []
      }
      indications: {
        Row: {
          created_at: string | null
          id: string
          referred_email: string | null
          referred_id: string | null
          referred_phone: string | null
          referrer_id: string
          reward_amount: number | null
          reward_claimed: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_email?: string | null
          referred_id?: string | null
          referred_phone?: string | null
          referrer_id: string
          reward_amount?: number | null
          reward_claimed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_email?: string | null
          referred_id?: string | null
          referred_phone?: string | null
          referrer_id?: string
          reward_amount?: number | null
          reward_claimed?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          broker_id: string | null
          created_at: string | null
          email: string | null
          id: string
          imovel_id: string | null
          message: string | null
          name: string | null
          phone: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          imovel_id?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          imovel_id?: string | null
          message?: string | null
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "conectaios_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      market_stats: {
        Row: {
          avg_days_on_market: number | null
          avg_price: number | null
          created_at: string | null
          id: string
          listing_type: string | null
          period_end: string
          period_start: string
          price_per_sqm: number | null
          property_type: string | null
          region: string | null
          total_listings: number | null
          updated_at: string | null
        }
        Insert: {
          avg_days_on_market?: number | null
          avg_price?: number | null
          created_at?: string | null
          id?: string
          listing_type?: string | null
          period_end: string
          period_start: string
          price_per_sqm?: number | null
          property_type?: string | null
          region?: string | null
          total_listings?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_days_on_market?: number | null
          avg_price?: number | null
          created_at?: string | null
          id?: string
          listing_type?: string | null
          period_end?: string
          period_start?: string
          price_per_sqm?: number | null
          property_type?: string | null
          region?: string | null
          total_listings?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          imovel_id: string
          requester_id: string
          responder_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imovel_id: string
          requester_id: string
          responder_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imovel_id?: string
          requester_id?: string
          responder_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string | null
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      minisite_configs: {
        Row: {
          broker_id: string | null
          config_data: Json | null
          created_at: string
          custom_domain: string | null
          description: string | null
          id: string
          is_active: boolean | null
          primary_color: string | null
          secondary_color: string | null
          show_about: boolean | null
          show_contact: boolean | null
          show_contact_form: boolean | null
          show_properties: boolean | null
          template_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_id?: string | null
          config_data?: Json | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
          show_contact_form?: boolean | null
          show_properties?: boolean | null
          template_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_id?: string | null
          config_data?: Json | null
          created_at?: string
          custom_domain?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          primary_color?: string | null
          secondary_color?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
          show_contact_form?: boolean | null
          show_properties?: boolean | null
          template_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      minisites: {
        Row: {
          about_md: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          owner_id: string
          slug: string
          subtitle: string | null
          theme: Json | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          about_md?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          owner_id: string
          slug: string
          subtitle?: string | null
          theme?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          about_md?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          owner_id?: string
          slug?: string
          subtitle?: string | null
          theme?: Json | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "minisites_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minisites_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "minisites_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "minisites_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          meta: Json | null
          read: boolean | null
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          read?: boolean | null
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          meta?: Json | null
          read?: boolean | null
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          sort_order: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          match_limit: number | null
          name: string
          price: number
          property_limit: number
          slug: string
          thread_limit: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          match_limit?: number | null
          name: string
          price?: number
          property_limit?: number
          slug: string
          thread_limit?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          match_limit?: number | null
          name?: string
          price?: number
          property_limit?: number
          slug?: string
          thread_limit?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          name: string | null
          nome: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          name?: string | null
          nome?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          name?: string | null
          nome?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_submissions: {
        Row: {
          broker_id: string | null
          created_at: string | null
          email: string | null
          exclusivity_type: string | null
          id: string
          marketing_consent: boolean | null
          message: string | null
          name: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          phone: string | null
          photos: Json | null
          property_data: Json | null
          status: string | null
          submission_token: string | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          exclusivity_type?: string | null
          id?: string
          marketing_consent?: boolean | null
          message?: string | null
          name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          phone?: string | null
          photos?: Json | null
          property_data?: Json | null
          status?: string | null
          submission_token?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          exclusivity_type?: string | null
          id?: string
          marketing_consent?: boolean | null
          message?: string | null
          name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          phone?: string | null
          photos?: Json | null
          property_data?: Json | null
          status?: string | null
          submission_token?: string | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_submissions_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_submissions_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "conectaios_brokers"
            referencedColumns: ["id"]
          },
        ]
      }
      social_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_follows: {
        Row: {
          created_at: string
          follower_user_id: string
          id: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          follower_user_id: string
          id?: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          follower_user_id?: string
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      social_group_invites: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by_id: string
          invited_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by_id: string
          invited_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by_id?: string
          invited_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      social_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      social_groups: {
        Row: {
          admin_id: string
          categoria: string
          cidade: string | null
          created_at: string
          descricao: string | null
          estado: string | null
          id: string
          imagem_url: string | null
          is_visible: boolean
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          categoria: string
          cidade?: string | null
          created_at?: string
          descricao?: string | null
          estado?: string | null
          id?: string
          imagem_url?: string | null
          is_visible?: boolean
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          categoria?: string
          cidade?: string | null
          created_at?: string
          descricao?: string | null
          estado?: string | null
          id?: string
          imagem_url?: string | null
          is_visible?: boolean
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          author_user_id: string
          content: string | null
          created_at: string
          id: string
          imovel_id: string | null
          media: Json | null
          published_at: string | null
          status: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_user_id: string
          content?: string | null
          created_at?: string
          id?: string
          imovel_id?: string | null
          media?: Json | null
          published_at?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_user_id?: string
          content?: string | null
          created_at?: string
          id?: string
          imovel_id?: string | null
          media?: Json | null
          published_at?: string | null
          status?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      social_presence: {
        Row: {
          id: string
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_reactions: {
        Row: {
          created_at: string
          id: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          external_customer_id: string | null
          external_subscription_id: string | null
          id: string
          plan: string | null
          profile_id: string
          provider: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          plan?: string | null
          profile_id: string
          provider?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          external_customer_id?: string | null
          external_subscription_id?: string | null
          id?: string
          plan?: string | null
          profile_id?: string
          provider?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          body: string
          broker_id: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          status: string
          subject: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          body: string
          broker_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          body?: string
          broker_id?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "support_tickets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "conectaios_brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          content: string
          created_at: string
          id: string
          published: boolean
          rating: number | null
          source: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          content: string
          created_at?: string
          id?: string
          published?: boolean
          rating?: number | null
          source?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          published?: boolean
          rating?: number | null
          source?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          tour_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          tour_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          tour_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          at: string | null
          error: string | null
          id: number
          payload: Json | null
          source: string | null
          status: number | null
        }
        Insert: {
          at?: string | null
          error?: string | null
          id?: number
          payload?: Json | null
          source?: string | null
          status?: number | null
        }
        Update: {
          at?: string | null
          error?: string | null
          id?: number
          payload?: Json | null
          source?: string | null
          status?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: number | null
          new_values: string | null
          old_values: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          new_values?: never
          old_values?: never
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: number | null
          new_values?: never
          old_values?: never
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          sort_order: number | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      conectaios_brokers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          cpf_cnpj: string | null
          created_at: string | null
          creci: string | null
          email: string | null
          id: string | null
          name: string | null
          phone: string | null
          plan_id: string | null
          referral_code: string | null
          region_id: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          city: string | null
          condominium_fee: number | null
          created_at: string | null
          descricao: string | null
          fotos: Json | null
          has_sea_view: boolean | null
          id: string | null
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          listing_type: string | null
          neighborhood: string | null
          owner_id: string | null
          parking_spots: number | null
          property_type: string | null
          quartos: number | null
          sea_distance: number | null
          thumb_url: string | null
          titulo: string | null
          updated_at: string | null
          user_id: string | null
          valor: number | null
          videos: Json | null
          visibility: string | null
          zipcode: string | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string | null
          descricao?: string | null
          fotos?: never
          has_sea_view?: boolean | null
          id?: string | null
          iptu?: number | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          listing_type?: string | null
          neighborhood?: string | null
          owner_id?: string | null
          parking_spots?: number | null
          property_type?: string | null
          quartos?: number | null
          sea_distance?: number | null
          thumb_url?: never
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
          videos?: never
          visibility?: string | null
          zipcode?: string | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          city?: string | null
          condominium_fee?: number | null
          created_at?: string | null
          descricao?: string | null
          fotos?: never
          has_sea_view?: boolean | null
          id?: string | null
          iptu?: number | null
          is_furnished?: boolean | null
          is_public?: boolean | null
          listing_type?: string | null
          neighborhood?: string | null
          owner_id?: string | null
          parking_spots?: number | null
          property_type?: string | null
          quartos?: number | null
          sea_distance?: number | null
          thumb_url?: never
          titulo?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor?: number | null
          videos?: never
          visibility?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "imoveis_owner_fk"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_social_broker_card"
            referencedColumns: ["user_id"]
          },
        ]
      }
      property_features: {
        Row: {
          key: string | null
          property_id: string | null
          value: string | null
        }
        Insert: {
          key?: string | null
          property_id?: string | null
          value?: string | null
        }
        Update: {
          key?: string | null
          property_id?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          created_at: string | null
          id: string | null
          is_cover: boolean | null
          position: number | null
          property_id: string | null
          storage_path: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_cover?: boolean | null
          position?: number | null
          property_id?: string | null
          storage_path?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_cover?: boolean | null
          position?: number | null
          property_id?: string | null
          storage_path?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_fk"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "banners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      v_social_broker_card: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          creci: string | null
          email: string | null
          name: string | null
          phone: string | null
          user_id: string | null
          whatsapp: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_change_user_role: {
        Args: { new_role: string; user_id_param: string }
        Returns: boolean
      }
      apply_points: {
        Args: {
          p_meta?: Json
          p_pontos: number
          p_ref_id?: string
          p_ref_tipo?: string
          p_rule_key: string
          p_usuario_id: string
        }
        Returns: undefined
      }
      ensure_broker_for_user: {
        Args: { p_user: string }
        Returns: string
      }
      ensure_minisite_for_user: {
        Args: { p_user: string }
        Returns: string
      }
      find_existing_one_to_one_thread: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      find_intelligent_property_matches: {
        Args: {
          p_city?: string
          p_limit?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string | null
          description: string | null
          distancia_mar: number | null
          id: string
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          neighborhood: string | null
          norm_title: string | null
          number: string | null
          owner_id: string
          parking: number | null
          price: number | null
          purpose: string
          search_vector: unknown | null
          state: string | null
          status: string | null
          street: string | null
          suites: number | null
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
          vista_mar: boolean | null
          zipcode: string | null
        }[]
      }
      find_property_matches: {
        Args: {
          p_broker_id: string
          p_filters?: Json
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string | null
          description: string | null
          distancia_mar: number | null
          id: string
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          neighborhood: string | null
          norm_title: string | null
          number: string | null
          owner_id: string
          parking: number | null
          price: number | null
          purpose: string
          search_vector: unknown | null
          state: string | null
          status: string | null
          street: string | null
          suites: number | null
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
          vista_mar: boolean | null
          zipcode: string | null
        }[]
      }
      generate_referral_code: {
        Args: { user_uuid?: string }
        Returns: string
      }
      get_security_summary: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      log_audit_event: {
        Args: {
          _action: string
          _new_values?: Json
          _old_values?: Json
          _resource_id?: string
          _resource_type: string
        }
        Returns: undefined
      }
      search_imoveis: {
        Args: {
          city_filter?: string
          limit_rows?: number
          offset_rows?: number
          purpose_filter?: string
          q?: string
        }
        Returns: {
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string | null
          description: string | null
          distancia_mar: number | null
          id: string
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          neighborhood: string | null
          norm_title: string | null
          number: string | null
          owner_id: string
          parking: number | null
          price: number | null
          purpose: string
          search_vector: unknown | null
          state: string | null
          status: string | null
          street: string | null
          suites: number | null
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
          vista_mar: boolean | null
          zipcode: string | null
        }[]
      }
      search_properties: {
        Args: {
          city_filter?: string
          limit_rows?: number
          offset_rows?: number
          purpose_filter?: string
          q?: string
        }
        Returns: {
          area_built: number | null
          area_total: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          condo_fee: number | null
          created_at: string | null
          description: string | null
          distancia_mar: number | null
          id: string
          iptu: number | null
          is_furnished: boolean | null
          is_public: boolean | null
          neighborhood: string | null
          norm_title: string | null
          number: string | null
          owner_id: string
          parking: number | null
          price: number | null
          purpose: string
          search_vector: unknown | null
          state: string | null
          status: string | null
          street: string | null
          suites: number | null
          title: string
          type: string | null
          updated_at: string | null
          visibility: string | null
          vista_mar: boolean | null
          zipcode: string | null
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      social_get_public_posts: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          author_avatar: string
          author_creci: string
          author_name: string
          author_user_id: string
          comments_count: number
          content: string
          imovel_cover_url: string
          imovel_id: string
          imovel_price: number
          imovel_title: string
          likes_count: number
          marketplace_url: string
          media: Json
          post_id: string
          published_at: string
          user_liked: boolean
        }[]
      }
      social_list_my_properties: {
        Args: Record<PropertyKey, never>
        Returns: {
          cover_url: string
          imovel_id: string
          price: number
          title: string
        }[]
      }
      social_marketplace_url: {
        Args: { p_imovel_id: string }
        Returns: string
      }
      social_publish_post: {
        Args: { p_post_id: string }
        Returns: boolean
      }
    }
    Enums: {
      property_status: "active" | "sold" | "rented" | "inactive" | "pending"
      property_type: "apartment" | "house" | "commercial" | "land" | "farm"
      user_role: "admin" | "broker" | "user"
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
      user_role: ["admin", "broker", "user"],
    },
  },
} as const
