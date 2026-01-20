import type { Json } from '../database';

export type ProfileRow = {
  avatar_url: string | null
  first_name: string | null
  id: string
  last_name: string | null
  phone_number: string | null
  role: string
  updated_at: string | null
  supervisor_id: string | null
  address: string | null
}

export type ProfileInsert = {
  avatar_url?: string | null
  first_name?: string | null
  id?: string // Tornando o ID opcional
  last_name?: string | null
  phone_number?: string | null
  role?: string
  updated_at?: string | null
  supervisor_id?: string | null
  address?: string | null
}

export type ProfileUpdate = {
  avatar_url?: string | null
  first_name?: string | null
  id?: string
  last_name?: string | null
  phone_number?: string | null
  role?: string
  updated_at?: string | null
  supervisor_id?: string | null
  address?: string | null
}

export type ProfileRelationships = []