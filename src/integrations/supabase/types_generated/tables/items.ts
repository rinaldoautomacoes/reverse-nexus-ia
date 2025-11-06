import type { Json } from '../database';

export type ItemRow = {
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

export type ItemInsert = {
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

export type ItemUpdate = {
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

export type ItemRelationships = [
  {
    foreignKeyName: "items_collection_id_fkey"
    columns: ["collection_id"]
    isOneToOne: false
    referencedRelation: "coletas"
    referencedColumns: ["id"]
  },
]