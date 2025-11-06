import type { Json } from '../database';

export type RouteStopRow = {
  address: string
  coleta_id: string | null
  completed_time: string | null
  created_at: string | null
  id: string
  latitude: number | null
  longitude: number | null
  notes: string | null
  route_id: string
  scheduled_time: string | null
  status: string
  stop_order: number
  type: string
}

export type RouteStopInsert = {
  address: string
  coleta_id?: string | null
  completed_time?: string | null
  created_at?: string | null
  id?: string
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  route_id: string
  scheduled_time?: string | null
  status?: string
  stop_order: number
  type: string
}

export type RouteStopUpdate = {
  address?: string
  coleta_id?: string | null
  completed_time?: string | null
  created_at?: string | null
  id?: string
  latitude?: number | null
  longitude?: number | null
  notes?: string | null
  route_id?: string
  scheduled_time?: string | null
  status?: string
  stop_order?: number
  type?: string
}

export type RouteStopRelationships = [
  {
    foreignKeyName: "route_stops_coleta_id_fkey"
    columns: ["coleta_id"]
    isOneToOne: false
    referencedRelation: "coletas"
    referencedColumns: ["id"]
  },
  {
    foreignKeyName: "route_stops_route_id_fkey"
    columns: ["route_id"]
    isOneToOne: false
    referencedRelation: "routes"
    referencedColumns: ["id"]
  },
]