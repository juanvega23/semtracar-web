export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          description: string
          key: string
          package_type_id: number | null
          shipping_method_id: number | null
          updated_at: string
          value: number
        }
        ComputedFields: never
        Insert: {
          description: string
          key: string
          package_type_id?: number | null
          shipping_method_id?: number | null
          updated_at?: string
          value: number
        }
        Update: {
          description?: string
          key?: string
          package_type_id?: number | null
          shipping_method_id?: number | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "app_config_package_type_id_fkey"
            columns: ["package_type_id"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_config_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      deliveries: {
        Row: {
          accepted_at: string | null
          client_id: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          delivered_at: string | null
          deliverer_id: string | null
          deliverer_lat: number | null
          deliverer_lng: number | null
          deliverer_name: string | null
          delivery_address: string
          id: string
          invoice_id: string
          location_updated_at: string | null
          on_the_way_at: string | null
          package_count: number | null
          package_id: string
          package_tracking: string | null
          proof_url: string | null
          status: string
        }
        ComputedFields: never
        Insert: {
          accepted_at?: string | null
          client_id: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          deliverer_id?: string | null
          deliverer_lat?: number | null
          deliverer_lng?: number | null
          deliverer_name?: string | null
          delivery_address: string
          id?: string
          invoice_id: string
          location_updated_at?: string | null
          on_the_way_at?: string | null
          package_count?: number | null
          package_id: string
          package_tracking?: string | null
          proof_url?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          delivered_at?: string | null
          deliverer_id?: string | null
          deliverer_lat?: number | null
          deliverer_lng?: number | null
          deliverer_name?: string | null
          delivery_address?: string
          id?: string
          invoice_id?: string
          location_updated_at?: string | null
          on_the_way_at?: string | null
          package_count?: number | null
          package_id?: string
          package_tracking?: string | null
          proof_url?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_deliverer_id_fkey"
            columns: ["deliverer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_packages: {
        Row: {
          created_at: string | null
          delivery_id: string
          id: string
          invoice_id: string | null
          package_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string | null
          delivery_id: string
          id?: string
          invoice_id?: string | null
          package_id: string
        }
        Update: {
          created_at?: string | null
          delivery_id?: string
          id?: string
          invoice_id?: string | null
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_packages_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string
          id: string
          invoice_id: string
          package_id: string
        }
        ComputedFields: never
        Insert: {
          amount: number
          description: string
          id?: string
          invoice_id: string
          package_id: string
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          invoice_id?: string
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          delivery_address: string | null
          delivery_choice: string
          delivery_cost: number
          dgi_authorization_number: string | null
          document_type: string
          has_delivery: boolean
          id: string
          invoice_number: number | null
          issued_by: string | null
          notes: string | null
          status: string
          subtotal: number
          tax_amount: number
          total: number
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          delivery_address?: string | null
          delivery_choice?: string
          delivery_cost?: number
          dgi_authorization_number?: string | null
          document_type?: string
          has_delivery?: boolean
          id?: string
          invoice_number?: number | null
          issued_by?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          delivery_choice?: string
          delivery_cost?: number
          dgi_authorization_number?: string | null
          document_type?: string
          has_delivery?: boolean
          id?: string
          invoice_number?: number | null
          issued_by?: string | null
          notes?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      package_status_history: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          package_id: string
          status_id: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          package_id: string
          status_id: number
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string
          status_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_status_history_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_status_history_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status_types"
            referencedColumns: ["id"]
          },
        ]
      }
      package_types: {
        Row: {
          id: number
          name: string
        }
        ComputedFields: never
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          id: string
          is_paid: boolean
          package_type_id: number
          price: number
          shipping_method_id: number
          tracking_code: string
          user_id: string
          weight: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          is_paid?: boolean
          package_type_id: number
          price?: number
          shipping_method_id: number
          tracking_code: string
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_paid?: boolean
          package_type_id?: number
          price?: number
          shipping_method_id?: number
          tracking_code?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "packages_package_type_id_fkey"
            columns: ["package_type_id"]
            isOneToOne: false
            referencedRelation: "package_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_name: string | null
          id: string
          invoice_id: string
          method: string
          paid_at: string
          reference: string | null
          registered_by: string | null
        }
        ComputedFields: never
        Insert: {
          amount: number
          bank_name?: string | null
          id?: string
          invoice_id: string
          method: string
          paid_at?: string
          reference?: string | null
          registered_by?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          id?: string
          invoice_id?: string
          method?: string
          paid_at?: string
          reference?: string | null
          registered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_methods: {
        Row: {
          id: number
          name: string
        }
        ComputedFields: never
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      status_types: {
        Row: {
          id: number
          name: string
        }
        ComputedFields: never
        Insert: {
          id: number
          name: string
        }
        Update: {
          id?: number
          name?: string
        }
        Relationships: []
      }
      user_push_tokens: {
        Row: {
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          casillero: string
          created_at: string
          email: string
          id: string
          is_admin: boolean
          is_available: boolean
          last_name: string
          name: string
          phone: string | null
          role: string
        }
        ComputedFields: never
        Insert: {
          address?: string | null
          casillero: string
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          is_available?: boolean
          last_name: string
          name: string
          phone?: string | null
          role?: string
        }
        Update: {
          address?: string | null
          casillero?: string
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          is_available?: boolean
          last_name?: string
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_delivery: {
        Args: { p_deliverer_id: string; p_delivery_id: string }
        Returns: boolean
      }
      cancel_delivery: { Args: { p_delivery_id: string }; Returns: undefined }
      cancel_unpaid_invoice: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      complete_delivery: {
        Args: { p_delivery_id: string; p_method?: string }
        Returns: undefined
      }
      create_invoice: {
        Args: { p_package_ids: string[]; p_user_id: string }
        Returns: string
      }
      decline_delivery: { Args: { p_invoice_id: string }; Returns: undefined }
      delivery_balance: { Args: { p_delivery_id: string }; Returns: number }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_admin_user: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_almacen: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_email_registered: { Args: { p_email: string }; Returns: boolean }
      is_name_registered: {
        Args: { p_last_name: string; p_name: string }
        Returns: boolean
      }
      promote_to_repartidor: {
        Args: { target_user_id: string; user_phone?: string }
        Returns: undefined
      }
      register_payment: {
        Args: {
          p_amount: number
          p_bank_name?: string
          p_invoice_id: string
          p_method: string
          p_reference?: string
        }
        Returns: undefined
      }
      request_delivery: {
        Args: {
          p_delivery_address: string
          p_invoice_id: string
          p_package_id: string
        }
        Returns: undefined
      }
      request_delivery_multi: {
        Args: { p_delivery_address: string; p_package_ids: string[] }
        Returns: string
      }
      set_user_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
      transition_package_ready: {
        Args: { p_location: string; p_package_id: string }
        Returns: string
      }
      update_deliverer_location: {
        Args: { p_delivery_id: string; p_lat: number; p_lng: number }
        Returns: undefined
      }
      validate_delivery_request: {
        Args: { p_address: string; p_package_ids: string[] }
        Returns: string[]
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
