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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_threads: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_read: boolean
          link: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          requested_note: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id: string
          requested_note?: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          requested_note?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_projects: {
        Row: {
          bank_account_last4: string
          bank_account_name: string
          bank_ifsc: string
          bank_name: string
          blockwork_type: string
          cellar_floors: number
          cement_bags_per_sft: number
          company_gstin: string
          company_name: string
          concrete_grade: string
          contract_type: string
          created_at: string
          doors_windows_spec: string
          drawings: Json
          electrical_spec: string
          engineers_count: number
          finishing_days_per_floor: number
          finishing_spec: string
          flooring_spec: string
          health: string
          id: string
          investor_amount: number
          investor_contact: string
          investor_name: string
          labour_count: number
          landowner_contact: string
          landowner_name: string
          landowner_share_pct: number
          latitude: number | null
          location: string
          longitude: number | null
          map_link: string
          name: string
          paint_spec: string
          phases: Json
          plumbing_spec: string
          procurement_lead_days: number
          sanitaryware_spec: string
          single_floor_slab_sft: number
          slab_cycle_days: number
          spend: number
          start_date: string | null
          steel_grade: string
          steel_ratio_kg_per_sft: number
          stilt_floors: number
          target_budget: number
          target_handover_date: string | null
          total_built_up_sft: number
          total_slab_sft: number
          total_staff: number
          type: string
          typical_floors: number
          updated_at: string
          workflow_template: string
          working_days_per_week: number
        }
        Insert: {
          bank_account_last4?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          blockwork_type?: string
          cellar_floors?: number
          cement_bags_per_sft?: number
          company_gstin?: string
          company_name?: string
          concrete_grade?: string
          contract_type?: string
          created_at?: string
          doors_windows_spec?: string
          drawings?: Json
          electrical_spec?: string
          engineers_count?: number
          finishing_days_per_floor?: number
          finishing_spec?: string
          flooring_spec?: string
          health?: string
          id?: string
          investor_amount?: number
          investor_contact?: string
          investor_name?: string
          labour_count?: number
          landowner_contact?: string
          landowner_name?: string
          landowner_share_pct?: number
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_link?: string
          name: string
          paint_spec?: string
          phases?: Json
          plumbing_spec?: string
          procurement_lead_days?: number
          sanitaryware_spec?: string
          single_floor_slab_sft?: number
          slab_cycle_days?: number
          spend?: number
          start_date?: string | null
          steel_grade?: string
          steel_ratio_kg_per_sft?: number
          stilt_floors?: number
          target_budget?: number
          target_handover_date?: string | null
          total_built_up_sft?: number
          total_slab_sft?: number
          total_staff?: number
          type?: string
          typical_floors?: number
          updated_at?: string
          workflow_template?: string
          working_days_per_week?: number
        }
        Update: {
          bank_account_last4?: string
          bank_account_name?: string
          bank_ifsc?: string
          bank_name?: string
          blockwork_type?: string
          cellar_floors?: number
          cement_bags_per_sft?: number
          company_gstin?: string
          company_name?: string
          concrete_grade?: string
          contract_type?: string
          created_at?: string
          doors_windows_spec?: string
          drawings?: Json
          electrical_spec?: string
          engineers_count?: number
          finishing_days_per_floor?: number
          finishing_spec?: string
          flooring_spec?: string
          health?: string
          id?: string
          investor_amount?: number
          investor_contact?: string
          investor_name?: string
          labour_count?: number
          landowner_contact?: string
          landowner_name?: string
          landowner_share_pct?: number
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_link?: string
          name?: string
          paint_spec?: string
          phases?: Json
          plumbing_spec?: string
          procurement_lead_days?: number
          sanitaryware_spec?: string
          single_floor_slab_sft?: number
          slab_cycle_days?: number
          spend?: number
          start_date?: string | null
          steel_grade?: string
          steel_ratio_kg_per_sft?: number
          stilt_floors?: number
          target_budget?: number
          target_handover_date?: string | null
          total_built_up_sft?: number
          total_slab_sft?: number
          total_staff?: number
          type?: string
          typical_floors?: number
          updated_at?: string
          workflow_template?: string
          working_days_per_week?: number
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          author_name: string
          author_role: string
          body: string
          channel: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          author_role?: string
          body: string
          channel?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string
          body?: string
          channel?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "pm"
        | "site_engineer"
        | "site_supervisor"
        | "purchase_stores"
        | "accounts"
        | "landowner_investor"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "admin",
        "pm",
        "site_engineer",
        "site_supervisor",
        "purchase_stores",
        "accounts",
        "landowner_investor",
      ],
    },
  },
} as const
