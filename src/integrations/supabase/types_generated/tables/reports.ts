import type { Json } from '../database';

export type ReportRow = {
  collection_status_filter: string | null
  collection_type_filter: string
  created_at: string | null
  description: string | null
  end_date: string | null
  format: string
  id: string
  report_url: string | null
  start_date: string | null
  status: string
  title: string
  type: string
  user_id: string
}

export type ReportInsert = {
  collection_status_filter?: string | null
  collection_type_filter?: string
  created_at?: string | null
  description?: string | null
  end_date?: string | null
  format?: string
  id?: string
  report_url?: string | null
  start_date?: string | null
  status?: string
  title: string
  type: string
  user_id: string
}

export type ReportUpdate = {
  collection_status_filter?: string | null
  collection_type_filter?: string
  created_at?: string | null
  description?: string | null
  end_date?: string | null
  format?: string
  id?: string
  report_url?: string | null
  start_date?: string | null
  status?: string
  title?: string
  type?: string
  user_id?: string
}

export type ReportRelationships = []