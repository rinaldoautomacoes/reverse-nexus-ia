import type { Json } from '../database';

export type DebtRecordRow = {
  amount: number
  created_at: string | null
  id: string
  item_details: Json | null
  notes: string | null
  status: string
  title: string
  user_id: string
}

export type DebtRecordInsert = {
  amount: number
  created_at?: string | null
  id?: string
  item_details?: Json | null
  notes?: string | null
  status?: string
  title: string
  user_id: string
}

export type DebtRecordUpdate = {
  amount?: number
  created_at?: string | null
  id?: string
  item_details?: Json | null
  notes?: string | null
  status?: string
  title?: string
  user_id?: string
}

export type DebtRecordRelationships = []