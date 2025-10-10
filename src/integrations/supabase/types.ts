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
      clients: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coletas: {
        Row: {
          bairro: string | null
          cep: string | null
          cidade: string | null
          client_id: string | null
          cnpj: string | null
          contato: string | null
          contrato: string | null
          created_at: string | null
          email: string | null
          endereco: string | null
          id: string
          localidade: string | null
          modelo_aparelho: string | null
          nf_glbl: string | null
          nf_metodo: string | null
          observacao: string | null
          parceiro: string | null
          previsao_coleta: string | null
          qtd_aparelhos_solicitado: number | null
          responsavel: string | null
          responsible_user_id: string | null
          status_coleta: string | null
          status_unidade: string | null
          telefone: string | null
          type: string
          uf: string | null
          user_id: string
          // NEWLY ADDED COLUMNS
          cep_origem: string | null
          cep_destino: string | null
          endereco_origem: string | null
          endereco_destino: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id?: string | null
          cnpj?: string | null
          contato?: string | null
          contrato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          localidade?: string | null
          modelo_aparelho?: string | null
          nf_glbl?: string | null
          nf_metodo?: string | null
          observacao?: string | null
          parceiro?: string | null
          previsao_coleta?: string | null
          qtd_aparelhos_solicitado?: number | null
          responsavel?: string | null
          responsible_user_id?: string | null
          status_coleta?: string | null
          status_unidade?: string | null
          telefone?: string | null
          type?: string
          uf?: string | null
          user_id: string
          // NEWLY ADDED COLUMNS
          cep_origem?: string | null
          cep_destino?: string | null
          endereco_origem?: string | null
          endereco_destino?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cidade?: string | null
          client_id?: string | null
          cnpj?: string | null
          contato?: string | null
          contrato?: string | null
          created_at?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          localidade?: string | null
          modelo_aparelho?: string | null
          nf_glbl?: string | null
          nf_metodo?: string | null
          observacao?: string | null
          parceiro?: string | null
          previsao_coleta?: string | null
          qtd_aparelhos_solicitado?: number | null
          responsavel?: string | null
          responsible_user_id?: string | null
          status_coleta?: string | null
          status_unidade?: string | null
          telefone?: string | null
          type?: string
          uf?: string | null
          user_id?: string
          // NEWLY ADDED COLUMNS
          cep_origem?: string | null
          cep_destino?: string | null
          endereco_origem?: string | null
          endereco_destino?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coletas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Coletas: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string | null
          id: string
          license_plate: string | null
          name: string
          phone: string | null
          status: string
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          license_plate?: string | null
          name: string
          phone?: string | null
          status?: string
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          license_plate?: string | null
          name?: string
          phone?: string | null
          status?: string
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          collection_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          model: string | null
          name: string
          quantity: number
          status: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name: string
          quantity: number
          status?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          name?: string
          quantity?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          bg_color: string
          change: string
          color: string
          created_at: string | null
          icon_name: string
          id: string
          title: string
          trend: string
          user_id: string
          value: string
        }
        Insert: {
          bg_color: string
          change: string
          color: string
          created_at?: string | null
          icon_name: string
          id?: string
          title: string
          trend: string
          user_id: string
          value: string
        }
        Update: {
          bg_color?: string
          change?: string
          color?: string
          created_at?: string | null
          icon_name?: string
          id?: string
          title?: string
          trend?: string
          user_id?: string
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          model: string | null
          serial_number: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          serial_number?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          model?: string | null
          serial_number?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string | null
          phone_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
          phone_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
          phone_number?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          collection_status_filter: string | null
          collection_type_filter: string
          created_at: string | null
          description: string | null
          format: string
          id: string
          period: string
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          collection_status_filter?: string | null
          collection_type_filter?: string
          created_at?: string | null
          description?: string | null
          format?: string
          id?: string
          period: string
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          collection_status_filter?: string | null
          collection_type_filter?: string
          created_at?: string | null
          description?: string | null
          format?: string
          id?: string
          period?: string
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      route_stops: {
        Row: {
          address: string
          coleta_id: string | null
          completed_time: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          route_id: string
          scheduled_time: string | null
          status: string
          stop_order: number
          type: string
        }
        Insert: {
          address: string
          coleta_id?: string | null
          completed_time?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          route_id: string
          scheduled_time?: string | null
          status?: string
          stop_order: number
          type: string
        }
        Update: {
          address?: string
          coleta_id?: string | null
          completed_time?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          route_id?: string
          scheduled_time?: string | null
          status?: string
          stop_order?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_coleta_id_fkey"
            columns: ["coleta_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string | null
          date: string
          destination_address: string | null
          destination_lat: number | null
          destination_lng: number | null
          driver_id: string | null
          estimated_duration: number | null
          id: string
          name: string
          optimization_type: string | null
          origin_address: string | null
          origin_lat: number | null
          origin_lng: number | null
          status: string
          total_distance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          destination_address?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id?: string | null
          estimated_duration?: number | null
          id?: string
          name: string
          optimization_type?: string | null
          origin_address?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          status?: string
          total_distance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          destination_address?: string | null
          destination_lat?: number | null
          destination_lng?: number | null
          driver_id?: string | null
          estimated_duration?: number | null
          id?: string
          name?: string
          optimization_type?: string | null
          origin_address?: string | null
          origin_lat?: number | null
          origin_lng?: number | null
          status?: string
          total_distance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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