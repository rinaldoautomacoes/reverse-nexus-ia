import type { Json } from '../database';

export type TransportadoraRow = {
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

export type TransportadoraInsert = {
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

export type TransportadoraUpdate = {
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

export type TransportadoraRelationships = [
  {
    foreignKeyName: "transportadoras_user_id_fkey"
    columns: ["user_id"]
    isOneToOne: false
    referencedRelation: "users"
    referencedColumns: ["id"]
  },
]