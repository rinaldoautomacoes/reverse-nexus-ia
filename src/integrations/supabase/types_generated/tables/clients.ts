import type { Json } from '../database';

export type ClientRow = {
  address: string | null
  cnpj: string | null
  contact_person: string | null
  created_at: string | null
  email: string | null
  id: string
  name: string
  phone: string | null
  user_id: string
  address_number: string | null
  cep: string | null
}

export type ClientInsert = {
  address?: string | null
  cnpj?: string | null
  contact_person?: string | null
  created_at?: string | null
  email?: string | null
  id?: string
  name: string
  phone?: string | null
  user_id: string
  address_number?: string | null
  cep?: string | null
}

export type ClientUpdate = {
  address?: string | null
  cnpj?: string | null
  contact_person?: string | null
  created_at?: string | null
  email?: string | null
  id?: string
  name?: string
  phone?: string | null
  user_id?: string
  address_number?: string | null
  cep?: string | null
}

export type ClientRelationships = []