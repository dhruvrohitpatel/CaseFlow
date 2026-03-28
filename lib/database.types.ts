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
          role: "admin" | "staff";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: "admin" | "staff";
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
    };
    Enums: {
      app_role: "admin" | "staff";
    };
    CompositeTypes: Record<string, never>;
  };
};
