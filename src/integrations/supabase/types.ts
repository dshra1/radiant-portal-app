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
      boq_change_requests: {
        Row: {
          boq_item_id: string | null
          change_type: string
          created_at: string
          current_amount: number
          current_values: Json
          decided_at: string | null
          decided_by: string | null
          decided_by_name: string
          decision_note: string
          description: string
          id: string
          note: string
          project_id: string
          proposed_amount: number
          proposed_values: Json
          requested_by: string | null
          requested_by_name: string
          saving: number
          source: string
          status: string
          trade: string
          unit: string
          updated_at: string
        }
        Insert: {
          boq_item_id?: string | null
          change_type?: string
          created_at?: string
          current_amount?: number
          current_values?: Json
          decided_at?: string | null
          decided_by?: string | null
          decided_by_name?: string
          decision_note?: string
          description?: string
          id?: string
          note?: string
          project_id: string
          proposed_amount?: number
          proposed_values?: Json
          requested_by?: string | null
          requested_by_name?: string
          saving?: number
          source?: string
          status?: string
          trade?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          boq_item_id?: string | null
          change_type?: string
          created_at?: string
          current_amount?: number
          current_values?: Json
          decided_at?: string | null
          decided_by?: string | null
          decided_by_name?: string
          decision_note?: string
          description?: string
          id?: string
          note?: string
          project_id?: string
          proposed_amount?: number
          proposed_values?: Json
          requested_by?: string | null
          requested_by_name?: string
          saving?: number
          source?: string
          status?: string
          trade?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_change_requests_boq_item_id_fkey"
            columns: ["boq_item_id"]
            isOneToOne: false
            referencedRelation: "boq_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boq_change_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      boq_items: {
        Row: {
          brand: string
          category: string
          created_at: string
          description: string
          id: string
          image_source: string
          image_url: string
          item_code: string
          notes: string
          project_id: string
          quantity: number
          rate: number
          sort_order: number
          source: string
          stage: string
          supplier: string
          unit: string
          updated_at: string
          work_scope: string
        }
        Insert: {
          brand?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_source?: string
          image_url?: string
          item_code?: string
          notes?: string
          project_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          source?: string
          stage?: string
          supplier?: string
          unit?: string
          updated_at?: string
          work_scope?: string
        }
        Update: {
          brand?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_source?: string
          image_url?: string
          item_code?: string
          notes?: string
          project_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          source?: string
          stage?: string
          supplier?: string
          unit?: string
          updated_at?: string
          work_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "boq_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
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
          project_id: string | null
          recipient_id: string | null
          sender_id: string | null
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
          project_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
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
          project_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      price_quote_items: {
        Row: {
          brand: string
          created_at: string
          description: string
          discount_pct: number
          gst_pct: number
          id: string
          item_code: string
          net_rate: number
          quantity: number
          quote_id: string
          rate: number
          sort_order: number
          trade: string
          unit: string
          updated_at: string
        }
        Insert: {
          brand?: string
          created_at?: string
          description?: string
          discount_pct?: number
          gst_pct?: number
          id?: string
          item_code?: string
          net_rate?: number
          quantity?: number
          quote_id: string
          rate?: number
          sort_order?: number
          trade?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          description?: string
          discount_pct?: number
          gst_pct?: number
          id?: string
          item_code?: string
          net_rate?: number
          quantity?: number
          quote_id?: string
          rate?: number
          sort_order?: number
          trade?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "price_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      price_quotes: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          id: string
          notes: string
          project_id: string | null
          quote_date: string | null
          quote_ref: string
          source_file: string
          trade: string
          updated_at: string
          vendor_contact: string
          vendor_gstin: string
          vendor_name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string
          project_id?: string | null
          quote_date?: string | null
          quote_ref?: string
          source_file?: string
          trade?: string
          updated_at?: string
          vendor_contact?: string
          vendor_gstin?: string
          vendor_name?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          notes?: string
          project_id?: string | null
          quote_date?: string | null
          quote_ref?: string
          source_file?: string
          trade?: string
          updated_at?: string
          vendor_contact?: string
          vendor_gstin?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
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
      project_charges: {
        Row: {
          allocation: string
          amount: number
          authority: string
          category: string
          charge_date: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          notes: string
          owner_splits: Json
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          allocation?: string
          amount?: number
          authority?: string
          category?: string
          charge_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string
          owner_splits?: Json
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          allocation?: string
          amount?: number
          authority?: string
          category?: string
          charge_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          notes?: string
          owner_splits?: Json
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_charges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          brand: string
          created_at: string
          description: string
          discount_pct: number
          gst_pct: number
          id: string
          item_code: string
          po_id: string
          quantity: number
          rate: number
          sort_order: number
          unit: string
          updated_at: string
        }
        Insert: {
          brand?: string
          created_at?: string
          description?: string
          discount_pct?: number
          gst_pct?: number
          id?: string
          item_code?: string
          po_id: string
          quantity?: number
          rate?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          brand?: string
          created_at?: string
          description?: string
          discount_pct?: number
          gst_pct?: number
          id?: string
          item_code?: string
          po_id?: string
          quantity?: number
          rate?: number
          sort_order?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          approved_by_name: string
          created_at: string
          delivery_date: string | null
          delivery_terms: string
          freight_charges: number
          id: string
          notes: string
          other_charges: number
          payment_terms: string
          po_date: string
          po_number: string
          project_id: string | null
          project_name: string
          quote_reference: string
          raised_by: string | null
          raised_by_name: string
          rejection_reason: string
          site_address: string
          status: string
          tax_mode: string
          terms: string
          updated_at: string
          vendor_address: string
          vendor_contact: string
          vendor_email: string
          vendor_gstin: string
          vendor_name: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string
          created_at?: string
          delivery_date?: string | null
          delivery_terms?: string
          freight_charges?: number
          id?: string
          notes?: string
          other_charges?: number
          payment_terms?: string
          po_date?: string
          po_number: string
          project_id?: string | null
          project_name?: string
          quote_reference?: string
          raised_by?: string | null
          raised_by_name?: string
          rejection_reason?: string
          site_address?: string
          status?: string
          tax_mode?: string
          terms?: string
          updated_at?: string
          vendor_address?: string
          vendor_contact?: string
          vendor_email?: string
          vendor_gstin?: string
          vendor_name?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          approved_by_name?: string
          created_at?: string
          delivery_date?: string | null
          delivery_terms?: string
          freight_charges?: number
          id?: string
          notes?: string
          other_charges?: number
          payment_terms?: string
          po_date?: string
          po_number?: string
          project_id?: string | null
          project_name?: string
          quote_reference?: string
          raised_by?: string | null
          raised_by_name?: string
          rejection_reason?: string
          site_address?: string
          status?: string
          tax_mode?: string
          terms?: string
          updated_at?: string
          vendor_address?: string
          vendor_contact?: string
          vendor_email?: string
          vendor_gstin?: string
          vendor_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_projects: {
        Row: {
          bank_account_last4: string
          bank_account_name: string
          bank_ifsc: string
          bank_name: string
          blockwork_type: string
          brand_preferences: Json
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
          investors: Json
          labour_count: number
          landowner_contact: string
          landowner_name: string
          landowner_share_pct: number
          landowners: Json
          latitude: number | null
          location: string
          longitude: number | null
          map_link: string
          name: string
          paint_spec: string
          phases: Json
          plumbing_spec: string
          pmc_scope: Json
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
          brand_preferences?: Json
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
          investors?: Json
          labour_count?: number
          landowner_contact?: string
          landowner_name?: string
          landowner_share_pct?: number
          landowners?: Json
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_link?: string
          name: string
          paint_spec?: string
          phases?: Json
          plumbing_spec?: string
          pmc_scope?: Json
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
          brand_preferences?: Json
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
          investors?: Json
          labour_count?: number
          landowner_contact?: string
          landowner_name?: string
          landowner_share_pct?: number
          landowners?: Json
          latitude?: number | null
          location?: string
          longitude?: number | null
          map_link?: string
          name?: string
          paint_spec?: string
          phases?: Json
          plumbing_spec?: string
          pmc_scope?: Json
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
          attachments: Json
          author_name: string
          author_role: string
          body: string
          channel: string
          created_at: string
          due_date: string | null
          id: string
          is_task: boolean
          progress: number
          project_id: string | null
          recipient_id: string | null
          sender_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_name?: string
          author_role?: string
          body: string
          channel?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_task?: boolean
          progress?: number
          project_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_name?: string
          author_role?: string
          body?: string
          channel?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_task?: boolean
          progress?: number
          project_id?: string | null
          recipient_id?: string | null
          sender_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "site_projects"
            referencedColumns: ["id"]
          },
        ]
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
      vendors: {
        Row: {
          brands_supplied: string
          city: string
          contact_person: string
          created_at: string
          created_by: string | null
          credit_terms: string
          email: string
          gstin: string
          id: string
          lead_time: string
          notes: string
          on_time_pct: number
          phone: string
          quality_rating: number
          trade_category: string
          updated_at: string
          vendor_code: string
          vendor_name: string
        }
        Insert: {
          brands_supplied?: string
          city?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          credit_terms?: string
          email?: string
          gstin?: string
          id?: string
          lead_time?: string
          notes?: string
          on_time_pct?: number
          phone?: string
          quality_rating?: number
          trade_category?: string
          updated_at?: string
          vendor_code?: string
          vendor_name?: string
        }
        Update: {
          brands_supplied?: string
          city?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          credit_terms?: string
          email?: string
          gstin?: string
          id?: string
          lead_time?: string
          notes?: string
          on_time_pct?: number
          phone?: string
          quality_rating?: number
          trade_category?: string
          updated_at?: string
          vendor_code?: string
          vendor_name?: string
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
      next_po_number: { Args: never; Returns: string }
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
