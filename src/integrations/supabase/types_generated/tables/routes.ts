import type { Json } from '../database';

export type RouteRow = {
  created_at: string | null
  date: string
  destination_address: string | null
  destination_lat: number | null
  destination_lng: number | null
  driver_id: string | null
  estimated_duration: number | null
  id: string
  name: string
  optimization_type: string | null
  origin_address: string | null
  origin_lat: number | null
  origin_lng: number | null
  status: string
  total_distance: number | null
  updated_at: string | null
  user_id: string
}

export type RouteInsert = {
  created_at?: string | null
  date: string
  destination_address?: string | null
  destination_lat?: number | null
  destination_lng?: number | null
  driver_id?: string | null
  estimated_duration?: number | null
  id?: string
  name: string
  optimization_type?: string | null
  origin_address?: string | null
  origin_lat?: number | null
  origin_lng?: number | null
  status?: string
  total_distance?: number | null
  updated_at?: string | null
  user_id: string
}

export type RouteUpdate = {
  created_at?: string | null
  date?: string
  destination_address?: string | null
  destination_lat?: number | null
  destination_lng?: number | null
  driver_id?: string | null
  estimated_duration?: number | null
  id?: string
  name?: string
  optimization_type?: string | null
  origin_address?: string | null
  origin_lat?: number | null
  origin_lng?: number | null
  status?: string
  total_distance?: number | null
  updated_at?: string | null
  user_id?: string
}

export type RouteRelationships = [
  {
    foreignKeyName: "routes_driver_id_fkey"
    columns: ["driver_id"]
    isOneToOne: false
    referencedRelation: "drivers"
    referencedColumns: ["id"]
  },
]