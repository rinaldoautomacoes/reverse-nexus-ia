import type { Json } from '../database';

export type DebtRecordRow = {
  id: string
  user_id: string
  created_at: string | null
  title: string
  amount: number
  notes: string | null
  item_details: Json
  status: string
}

export type DebtRecordInsert = {
  id?: string
  user_id: string
  created_at?: string | null
  title: string
  amount: number
  notes?: string | null
  item_details?: Json
  status?: string
}

export type DebtRecordUpdate = {
  id?: string
  user_id?: string
  created_at?: string | null
  title?: string
  amount?: number
  notes?: string | null
  item_details?: Json
  status?: string
}

export type DebtRecordRelationships = []