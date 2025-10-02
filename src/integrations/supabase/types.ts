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
          id: string
          user_id: string
          created_at: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          cnpj: string | null
          contact_person: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          id: string
          user_id: string
          created_at: string
          title: string
          value: string
          change: string
          trend: string
          icon_name: string
          color: string
          bg_color: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          title: string
          value: string
          change: string
          trend: string
          icon_name: string
          color: string
          bg_color: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          title?: string
          value?: string
          change?: string
          trend?: string
          icon_name?: string
          color?: string
          bg_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coletas: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          created_at: string
          localidade: string | null
          modelo_aparelho: string | null
          qtd_aparelhos_solicitado: number | null
          nf_metodo: string | null
          nf_glbl: string | null
          parceiro: string | null
          contrato: string | null
          contato: string | null
          telefone: string | null
          email: string | null
          endereco: string | null
          bairro: string | null
          cidade: string | null
          uf: string | null
          cep: string | null
          cnpj: string | null
          previsao_coleta: string | null // DATE type in SQL maps to string in TS
          status_coleta: string | null
          status_unidade: string | null
          observacao: string | null
          responsavel: string | null
          responsible_user_id: string | null // NOVA COLUNA
          type: string // NOVA COLUNA: 'coleta' ou 'entrega'
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          created_at?: string
          localidade?: string | null
          modelo_aparelho?: string | null
          qtd_aparelhos_solicitado?: number | null
          nf_metodo?: string | null
          nf_glbl?: string | null
          parceiro?: string | null
          contrato?: string | null
          contato?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          cnpj?: string | null
          previsao_coleta?: string | null
          status_coleta?: string | null
          status_unidade?: string | null
          observacao?: string | null
          responsavel?: string | null
          responsible_user_id?: string | null // NOVA COLUNA
          type?: string // NOVA COLUNA
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          created_at?: string
          localidade?: string | null
          modelo_aparelho?: string | null
          qtd_aparelhos_solicitado?: number | null
          nf_metodo?: string | null
          nf_glbl?: string | null
          parceiro?: string | null
          contrato?: string | null
          contato?: string | null
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          cnpj?: string | null
          previsao_coleta?: string | null
          status_coleta?: string | null
          status_unidade?: string | null
          observacao?: string | null
          responsavel?: string | null
          responsible_user_id?: string | null // NOVA COLUNA
          type?: string // NOVA COLUNA
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
            foreignKeyName: "coletas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coletas_responsible_user_id_fkey"
            columns: ["responsible_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          id: string
          user_id: string
          collection_id: string | null
          created_at: string
          name: string
          quantity: number
          status: string
          description: string | null
          model: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          collection_id?: string | null
          created_at?: string
          name: string
          quantity: number
          status?: string
          description?: string | null
          model?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          collection_id?: string | null
          created_at?: string
          name?: string
          quantity?: number
          status?: string
          description?: string | null
          model?: string | null
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "coletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          id: string
          user_id: string
          created_at: string
          code: string
          description: string | null
          model: string | null
          serial_number: string | null
          image_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          code: string
          description?: string | null
          model?: string | null
          serial_number?: string | null
          image_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          code?: string
          description?: string | null
          model?: string | null
          serial_number?: string | null
          image_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          role?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: string
          user_id: string
          created_at: string
          title: string
          period: string
          type: string
          format: string
          status: string
          description: string | null
          collection_status_filter: string | null
          collection_type_filter: string // Adicionado a nova coluna
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          title: string
          period: string
          type: string
          format?: string
          status?: string
          description?: string | null
          collection_status_filter?: string | null
          collection_type_filter?: string // Adicionado a nova coluna
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          title?: string
          period?: string
          type?: string
          format?: string
          status?: string
          description?: string | null
          collection_status_filter?: string | null
          collection_type_filter?: string // Adicionado a nova coluna
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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