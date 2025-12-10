import type { Json } from '../database';

export type ClientRow = {
  address: string | null
  address_number: string | null
  cep: string | null
  cnpj: string | null
  contact_person: string | null
  created_at: string | null
  email: string | null
  id: string
  name: string
  phone: string | null
  user_id: string
}

export type ClientInsert = {
  address?: string | null
  address_number?: string | null
  cep?: string | null
  cnpj?: string | null
  contact_person?: string | null
  created_at?: string | null
  email?: string | null
  id?: string
  name: string
  phone?: string | null
  user_id: string
}

export type ClientUpdate = {
  address?: string | null
  address_number?: string | null
  cep?: string | null
  cnpj?: string | null
  contact_person?: string | null
  created_at?: string | null
  email?: string | null
  id?: string
  name?: string
  phone?: string | null
  user_id?: string
}

export type ClientRelationships = []