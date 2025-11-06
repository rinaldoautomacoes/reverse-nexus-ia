import type { Json } from '../database';

export type MetricRow = {
  bg_color: string
  change: string
  color: string
  created_at: string | null
  icon_name: string
  id: string
  title: string
  trend: string
  user_id: string
  value: string
}

export type MetricInsert = {
  bg_color: string
  change: string
  color: string
  created_at?: string | null
  icon_name: string
  id?: string
  title: string
  trend: string
  user_id: string
  value: string
}

export type MetricUpdate = {
  bg_color?: string
  change?: string
  color?: string
  created_at?: string | null
  icon_name?: string
  id?: string
  title?: string
  trend?: string
  user_id?: string
  value?: string
}

export type MetricRelationships = []