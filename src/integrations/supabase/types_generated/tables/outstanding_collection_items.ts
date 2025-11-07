import type { Json } from '../database';

export type OutstandingCollectionItemRow = {
  id: string
  user_id: string
  created_at: string | null
  product_code: string
  product_description: string | null
  quantity_pending: number
  notes: string | null
  status: string
}

export type OutstandingCollectionItemInsert = {
  id?: string
  user_id: string
  created_at?: string | null
  product_code: string
  product_description?: string | null
  quantity_pending?: number
  notes?: string | null
  status?: string
}

export type OutstandingCollectionItemUpdate = {
  id?: string
  user_id?: string
  created_at?: string | null
  product_code?: string
  product_description?: string | null
  quantity_pending?: number
  notes?: string | null
  status?: string
}

export type OutstandingCollectionItemRelationships = []