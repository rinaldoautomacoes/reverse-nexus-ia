import type { Json } from '../database';

export type ProductRow = {
  code: string
  created_at: string | null
  description: string | null
  id: string
  image_url: string | null
  model: string | null
  serial_number: string | null
  user_id: string
}

export type ProductInsert = {
  code: string
  created_at?: string | null
  description?: string | null
  id?: string
  image_url?: string | null
  model?: string | null
  serial_number?: string | null
  user_id: string
}

export type ProductUpdate = {
  code?: string
  created_at?: string | null
  description?: string | null
  id?: string
  image_url?: string | null
  model?: string | null
  serial_number?: string | null
  user_id?: string
}

export type ProductRelationships = []