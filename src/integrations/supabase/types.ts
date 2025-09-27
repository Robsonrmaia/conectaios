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
          bio: string | null
          created_at: string | null
          creci: string | null
          id: string
          minisite_slug: string | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          creci?: string | null
          id?: string
          minisite_slug?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          creci?: string | null
          id?: string
          minisite_slug?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brokers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      client_searches: {
        Row: {
          broker_id: string | null
          client_id: string | null
          created_at: string
          filters: Json
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          broker_id?: string | null
          client_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Update: {
          broker_id?: string | null
          client_id?: string | null
          created_at?: string
          filters?: Json
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
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
            foreignKeyName: "client_searches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "crm_clients_broker_fk"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
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
            referencedRelation: "imoveis"
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
            foreignKeyName: "crm_tasks_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "crm_clients"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
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
          id?: string
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
          id?: string
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
            foreignKeyName: "imoveis_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_features_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
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
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imovel_images_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
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
            foreignKeyName: "leads_imovel_id_fkey"
            columns: ["imovel_id"]
            isOneToOne: false
            referencedRelation: "imoveis"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "imoveis"
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
            foreignKeyName: "matches_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
        ]
      }
      minisite_configs: {
        Row: {
          created_at: string
          custom_domain: string | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          show_about: boolean | null
          show_contact: boolean | null
          show_properties: boolean | null
          template_id: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
          show_properties?: boolean | null
          template_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_domain?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          show_about?: boolean | null
          show_contact?: boolean | null
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
            foreignKeyName: "minisites_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          nome: string | null
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
          nome?: string | null
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
          id: string
          message: string | null
          name: string | null
          phone: string | null
          property_data: Json | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_data?: Json | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          broker_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          property_data?: Json | null
          status?: string | null
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
        ]
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
        ]
      }
      support_tickets: {
        Row: {
          assignee_id: string | null
          body: string
          broker_id: string | null
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          body: string
          broker_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          body?: string
          broker_id?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
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
            foreignKeyName: "support_tickets_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
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
          id: string
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
          id: string
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
          zipcode: string | null
        }[]
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
          id: string
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
