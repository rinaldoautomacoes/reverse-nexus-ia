import type { Json } from '../database';

export type ProfileRow = {
  avatar_url: string | null
  first_name: string | null
  id: string
  last_name: string | null
  phone_number: string | null
  personal_phone_number: string | null // Novo campo
  role: string
  updated_at: string | null
  supervisor_id: string | null
  address: string | null
  team_shift: "day" | "night"
}

export type ProfileInsert = {
  avatar_url?: string | null
  first_name?: string | null
  id?: string
  last_name?: string | null
  phone_number?: string | null
  personal_phone_number?: string | null // Novo campo
  role?: string
  updated_at?: string | null
  supervisor_id?: string | null
  address?: string | null
  team_shift?: "day" | "night"
}

export type ProfileUpdate = {
  avatar_url?: string | null
  first_name?: string | null
  id?: string
  last_name?: string | null
  phone_number?: string | null
  personal_phone_number?: string | null // Novo campo
  role?: string
  updated_at?: string | null
  supervisor_id?: string | null
  address?: string | null
  team_shift?: "day" | "night"
}

export type ProfileRelationships = []