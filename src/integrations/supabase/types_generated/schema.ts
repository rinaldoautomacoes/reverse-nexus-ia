import type { Json } from './database'; // Assuming Json is defined in database.ts

export type PublicSchema = {
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
        nf_glbl: string | null
        nf_metodo: string | null
        observacao: string | null
        parceiro: string | null
        previsao_coleta: string | null
        responsavel: string | null
        responsible_user_id: string | null
        status_coleta: string | null
        status_unidade: string | null
        telefone: string | null
        type: string
        uf: string | null
        user_id: string
        cep_origem: string | null
        cep_destino: string | null
        endereco_origem: string | null
        endereco_destino: string | null
        driver_id: string | null
        transportadora_id: string | null
        freight_value: number | null
        unique_number: string | null
        origin_lat: number | null
        origin_lng: number | null
        destination_lat: number | null
        destination_lng: number | null
        client_control: string | null
        qtd_aparelhos_solicitado: number | null
        modelo_aparelho: string | null
        attachments: Json | null // Adicionado attachments
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
        nf_glbl?: string | null
        nf_metodo?: string | null
        observacao?: string | null
        parceiro?: string | null
        previsao_coleta?: string | null
        responsavel?: string | null
        responsible_user_id?: string | null
        status_coleta?: string | null
        status_unidade?: string | null
        telefone?: string | null
        type?: string
        uf?: string | null
        user_id: string
        cep_origem?: string | null
        cep_destino?: string | null
        endereco_origem?: string | null
        endereco_destino?: string | null
        driver_id?: string | null
        transportadora_id?: string | null
        freight_value?: number | null
        unique_number?: string | null
        origin_lat?: number | null
        origin_lng?: number | null
        destination_lat?: number | null
        destination_lng?: number | null
        client_control?: string | null
        qtd_aparelhos_solicitado?: number | null
        modelo_aparelho?: string | null
        attachments?: Json | null // Adicionado attachments
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
        nf_glbl?: string | null
        nf_metodo?: string | null
        observacao?: string | null
        parceiro?: string | null
        previsao_coleta?: string | null
        responsavel?: string | null
        responsible_user_id?: string | null
        status_coleta?: string | null
        status_unidade?: string | null
        telefone?: string | null
        type?: string
        uf?: string | null
        user_id?: string
        cep_origem?: string | null
        cep_destino?: string | null
        endereco_origem?: string | null
        endereco_destino?: string | null
        driver_id?: string | null
        transportadora_id?: string | null
        freight_value?: number | null
        unique_number?: string | null
        origin_lat?: number | null
        origin_lng?: number | null
        destination_lat?: number | null
        destination_lng?: number | null
        client_control?: string | null
        qtd_aparelhos_solicitado?: number | null
        modelo_aparelho?: string | null
        attachments?: Json | null // Adicionado attachments
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
          foreignKeyName: "coletas_driver_id_fkey"
          columns: ["driver_id"]
          isOneToOne: false
          referencedRelation: "drivers"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "coletas_responsible_user_id_fkey"
          columns: ["responsible_user_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "coletas_transportadora_id_fkey"
          columns: ["transportadora_id"]
          isOneToOne: false
          referencedRelation: "transportadoras"
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
        end_date: string | null
        format: string
        id: string
        start_date: string | null
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
        end_date?: string | null
        format?: string
        id?: string
        start_date?: string | null
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
        end_date?: string | null
        format?: string
        id?: string
        start_date?: string | null
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
    transportadoras: {
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
      Relationships: [
        {
          foreignKeyName: "transportadoras_user_id_fkey"
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