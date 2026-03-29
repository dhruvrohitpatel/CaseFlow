export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      access_allowlist: {
        Row: {
          created_at: string;
          created_by: string | null;
          email: string;
          id: string;
          is_active: boolean;
          linked_client_id: string | null;
          notes: string | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          email: string;
          id?: string;
          is_active?: boolean;
          linked_client_id?: string | null;
          notes?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["access_allowlist"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "access_allowlist_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "access_allowlist_linked_client_id_fkey";
            columns: ["linked_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          client_id: string;
          created_at: string;
          duration_minutes: number;
          id: string;
          location: string | null;
          notes: string | null;
          reminder_status: Database["public"]["Enums"]["reminder_status"];
          scheduled_for: string;
          staff_member_name: string;
          staff_member_profile_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          duration_minutes?: number;
          id?: string;
          location?: string | null;
          notes?: string | null;
          reminder_status?: Database["public"]["Enums"]["reminder_status"];
          scheduled_for: string;
          staff_member_name: string;
          staff_member_profile_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["appointments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_staff_member_profile_id_fkey";
            columns: ["staff_member_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_ai_recommendations: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          profile_id: string | null;
          recommendations: Json;
          target_role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          workflow_summary: Json;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          profile_id?: string | null;
          recommendations?: Json;
          target_role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          workflow_summary?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_ai_recommendations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dashboard_ai_recommendations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dashboard_ai_recommendations_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_role_layouts: {
        Row: {
          created_at: string;
          id: string;
          layout: Json;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          layout?: Json;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_role_layouts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dashboard_role_layouts_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_user_layout_overrides: {
        Row: {
          created_at: string;
          id: string;
          layout: Json;
          profile_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          layout?: Json;
          profile_id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_user_layout_overrides"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "dashboard_user_layout_overrides_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_profile_id: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_profile_id?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_profile_id_fkey";
            columns: ["actor_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      client_custom_field_values: {
        Row: {
          client_id: string;
          created_at: string;
          definition_id: string;
          id: string;
          updated_at: string;
          value_text: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          definition_id: string;
          id?: string;
          updated_at?: string;
          value_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["client_custom_field_values"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "client_custom_field_values_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_custom_field_values_definition_id_fkey";
            columns: ["definition_id"];
            isOneToOne: false;
            referencedRelation: "custom_field_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          client_id: string;
          created_at: string;
          created_by: string | null;
          date_of_birth: string | null;
          email: string | null;
          full_name: string;
          housing_status: string;
          id: string;
          portal_profile_id: string | null;
          preferred_language: string;
          preferred_name: string | null;
          pronouns: string | null;
          referral_source: string;
          phone: string | null;
          status: Database["public"]["Enums"]["client_status"];
          updated_at: string;
        };
        Insert: {
          client_id?: string;
          created_at?: string;
          created_by?: string | null;
          date_of_birth?: string | null;
          email?: string | null;
          full_name: string;
          housing_status?: string;
          id?: string;
          portal_profile_id?: string | null;
          preferred_language?: string;
          preferred_name?: string | null;
          pronouns?: string | null;
          referral_source?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["client_status"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "clients_portal_profile_id_fkey";
            columns: ["portal_profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      custom_field_definitions: {
        Row: {
          created_at: string;
          created_by: string | null;
          entity_type: Database["public"]["Enums"]["custom_field_entity_type"];
          field_key: string;
          field_type: Database["public"]["Enums"]["custom_field_type"];
          id: string;
          is_active: boolean;
          is_required: boolean;
          label: string;
          select_options: Json;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          entity_type: Database["public"]["Enums"]["custom_field_entity_type"];
          field_key: string;
          field_type: Database["public"]["Enums"]["custom_field_type"];
          id?: string;
          is_active?: boolean;
          is_required?: boolean;
          label: string;
          select_options?: Json;
          sort_order?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["custom_field_definitions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      import_assistant_sessions: {
        Row: {
          created_at: string;
          created_by: string;
          id: string;
          mapping_plan: Json;
          preview_rows: Json;
          source_filename: string;
          source_headers: Json;
          status: string;
          target_entity: string;
          updated_at: string;
          warnings: Json;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          id?: string;
          mapping_plan?: Json;
          preview_rows?: Json;
          source_filename: string;
          source_headers?: Json;
          status?: string;
          target_entity: string;
          updated_at?: string;
          warnings?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["import_assistant_sessions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "import_assistant_sessions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      intake_capture_sessions: {
        Row: {
          confidence_json: Json;
          core_fields_json: Json;
          created_at: string;
          created_by: string;
          created_client_id: string | null;
          custom_fields_json: Json;
          id: string;
          model: string | null;
          provider: string | null;
          raw_model_output_json: Json;
          source_filename: string;
          source_image_path: string;
          status: string;
          updated_at: string;
          warnings_json: Json;
        };
        Insert: {
          confidence_json?: Json;
          core_fields_json?: Json;
          created_at?: string;
          created_by: string;
          created_client_id?: string | null;
          custom_fields_json?: Json;
          id?: string;
          model?: string | null;
          provider?: string | null;
          raw_model_output_json?: Json;
          source_filename: string;
          source_image_path: string;
          status?: string;
          updated_at?: string;
          warnings_json?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["intake_capture_sessions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "intake_capture_sessions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "intake_capture_sessions_created_client_id_fkey";
            columns: ["created_client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_settings: {
        Row: {
          accent_color: string;
          approved_domain_guidance: string;
          border_color: string;
          canvas_color: string;
          card_color: string;
          created_at: string;
          dashboard_headline: string | null;
          favicon_url: string | null;
          font_pair_key: string;
          id: string;
          imagery_prompt: string | null;
          login_welcome_text: string;
          logo_url: string | null;
          organization_name: string;
          primary_color: string;
          product_subtitle: string;
          public_welcome_text: string;
          setup_completed_at: string | null;
          setup_progress: Json;
          support_cta_text: string;
          support_email: string | null;
          support_phone: string | null;
          surface_tint: string;
          theme_preset_key: string;
          updated_at: string;
        };
        Insert: {
          accent_color?: string;
          approved_domain_guidance?: string;
          border_color?: string;
          canvas_color?: string;
          card_color?: string;
          created_at?: string;
          dashboard_headline?: string | null;
          favicon_url?: string | null;
          font_pair_key?: string;
          id?: string;
          imagery_prompt?: string | null;
          login_welcome_text?: string;
          logo_url?: string | null;
          organization_name?: string;
          primary_color?: string;
          product_subtitle?: string;
          public_welcome_text?: string;
          setup_completed_at?: string | null;
          setup_progress?: Json;
          support_cta_text?: string;
          support_email?: string | null;
          support_phone?: string | null;
          surface_tint?: string;
          theme_preset_key?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_settings"]["Insert"]>;
        Relationships: [];
      };
      organization_theme_drafts: {
        Row: {
          applied_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          prompt: string;
          theme_recipe: Json;
        };
        Insert: {
          applied_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          prompt: string;
          theme_recipe?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["organization_theme_drafts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "organization_theme_drafts_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          must_reset_password: boolean;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          must_reset_password?: boolean;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      service_entries: {
        Row: {
          client_id: string;
          created_at: string;
          embedding: string | null;
          id: string;
          notes: string;
          service_date: string;
          service_type_id: string;
          staff_member_name: string;
          staff_member_profile_id: string;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          notes: string;
          service_date: string;
          service_type_id: string;
          staff_member_name: string;
          staff_member_profile_id: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_entries_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_entries_service_type_id_fkey";
            columns: ["service_type_id"];
            isOneToOne: false;
            referencedRelation: "service_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_entries_staff_member_profile_id_fkey";
            columns: ["staff_member_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      service_entry_custom_field_values: {
        Row: {
          created_at: string;
          definition_id: string;
          id: string;
          service_entry_id: string;
          updated_at: string;
          value_text: string;
        };
        Insert: {
          created_at?: string;
          definition_id: string;
          id?: string;
          service_entry_id: string;
          updated_at?: string;
          value_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_entry_custom_field_values"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_entry_custom_field_values_definition_id_fkey";
            columns: ["definition_id"];
            isOneToOne: false;
            referencedRelation: "custom_field_definitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_entry_custom_field_values_service_entry_id_fkey";
            columns: ["service_entry_id"];
            isOneToOne: false;
            referencedRelation: "service_entries";
            referencedColumns: ["id"];
          },
        ];
      };
      service_types: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_types"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_app_role: {
        Args: Record<string, never>;
        Returns: Database["public"]["Enums"]["app_role"];
      };
      get_client_service_activity: {
        Args: Record<string, never>;
        Returns: {
          service_date: string;
          service_entry_id: string;
          service_type_name: string;
          staff_member_name: string;
        }[];
      };
      generate_client_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff_or_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      match_service_notes: {
        Args: {
          match_count?: number;
          match_threshold?: number;
          query_embedding: string;
        };
        Returns: {
          client_name: string;
          client_public_id: string;
          note_preview: string;
          notes: string;
          service_date: string;
          service_entry_id: string;
          service_type_name: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "staff" | "client";
      client_status: "active" | "inactive" | "archived";
      custom_field_entity_type: "client" | "service_entry";
      custom_field_type: "text" | "textarea" | "number" | "date" | "select";
      reminder_status: "not_needed" | "pending" | "sent";
    };
    CompositeTypes: Record<string, never>;
  };
};
