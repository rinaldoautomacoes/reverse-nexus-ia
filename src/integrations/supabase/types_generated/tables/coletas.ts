import type { Json } from '../database';

export type ColetaRow = {
  attachments: Json | null
  bairro: string | null
  cep: string | null
  cep_destino: string | null
  cep_origem: string | null
  cidade: string | null
  client_id: string | null
  client_control: string | null
  cnpj: string | null
  contato: string | null
  contrato: string | null
  created_at: string
  destination_address_number: string | null
  destination_lat: number | null
  destination_lng: number | null
  driver_id: string | null
  email: string | null
  endereco: string | null
  endereco_destino: string | null
  endereco_origem: string | null
  freight_value: number | null
  id: string
  localidade: string | null
  modelo_aparelho: string | null
  modelo_aparelho_description: string | null
  nf_glbl: string | null
  nf_metodo: string | null
  observacao: string | null
  origin_address_number: string | null
  origin_lat: number | null
  origin_lng: number | null
  parceiro: string | null
  partner_code: string | null
  previsao_coleta: string | null
  qtd_aparelhos_solicitado: number | null
  responsavel: string | null
  responsible_user_id: string | null
  status_coleta: string | null
  status_unidade: string | null
  telefone: string | null
  transportadora_id: string | null
  type: string
  uf: string | null
  unique_number: string | null
  user_id: string
}

export type ColetaInsert = {
  attachments?: Json | null
  bairro?: string | null
  cep?: string | null
  cep_destino?: string | null
  cep_origem?: string | null
  cidade?: string | null
  client_id?: string | null
  client_control?: string | null
  cnpj?: string | null
  contato?: string | null
  contrato?: string | null
  created_at?: string
  destination_address_number?: string | null
  destination_lat?: number | null
  destination_lng?: number | null
  driver_id?: string | null
  email?: string | null
  endereco?: string | null
  endereco_destino?: string | null
  endereco_origem?: string | null
  freight_value?: number | null
  id?: string
  localidade?: string | null
  modelo_aparelho?: string | null
  modelo_aparelho_description?: string | null
  nf_glbl?: string | null
  nf_metodo?: string | null
  observacao?: string | null
  origin_address_number?: string | null
  origin_lat?: number | null
  origin_lng?: number | null
  parceiro?: string | null
  partner_code?: string | null
  previsao_coleta?: string | null
  qtd_aparelhos_solicitado?: number | null
  responsavel?: string | null
  responsible_user_id?: string | null
  status_coleta?: string | null
  status_unidade?: string | null
  telefone?: string | null
  transportadora_id?: string | null
  type: string
  uf?: string | null
  unique_number?: string | null
  user_id: string
}

export type ColetaUpdate = {
  attachments?: Json | null
  bairro?: string | null
  cep?: string | null
  cep_destino?: string | null
  cep_origem?: string | null
  cidade?: string | null
  client_id?: string | null
  client_control?: string | null
  cnpj?: string | null
  contato?: string | null
  contrato?: string | null
  created_at?: string
  destination_address_number?: string | null
  destination_lat?: number | null
  destination_lng?: number | null
  driver_id?: string | null
  email?: string | null
  endereco?: string | null
  endereco_destino?: string | null
  endereco_origem?: string | null
  freight_value?: number | null
  id?: string
  localidade?: string | null
  modelo_aparelho?: string | null
  modelo_aparelho_description?: string | null
  nf_glbl?: string | null
  nf_metodo?: string | null
  observacao?: string | null
  origin_address_number?: string | null
  origin_lat?: number | null
  origin_lng?: number | null
  parceiro?: string | null
  partner_code?: string | null
  previsao_coleta?: string | null
  qtd_aparelhos_solicitado?: number | null
  responsavel?: string | null
  responsible_user_id?: string | null
  status_coleta?: string | null
  status_unidade?: string | null
  telefone?: string | null
  transportadora_id?: string | null
  type?: string
  uf?: string | null
  unique_number?: string | null
  user_id?: string
}

export type ColetaRelationships = [
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
  {
    foreignKeyName: "coletas_user_id_fkey"
    columns: ["user_id"]
    isOneToOne: false
    referencedRelation: "users"
    referencedColumns: ["id"]
  },
]