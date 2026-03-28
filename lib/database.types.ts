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
      organization_settings: {
        Row: {
          created_at: string;
          id: string;
          organization_name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          organization_name?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organization_settings"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
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
      generate_client_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "staff";
      client_status: "active" | "inactive" | "archived";
      custom_field_entity_type: "client" | "service_entry";
      custom_field_type: "text" | "textarea" | "number" | "date" | "select";
      reminder_status: "not_needed" | "pending" | "sent";
    };
    CompositeTypes: Record<string, never>;
  };
};
