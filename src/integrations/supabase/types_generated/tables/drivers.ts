import type { Json } from '../database';

export type DriverRow = {
  created_at: string | null
  id: string
  license_plate: string | null
  name: string
  phone: string | null
  status: string
  user_id: string
  vehicle_type: string | null
}

export type DriverInsert = {
  created_at?: string | null
  id?: string
  license_plate?: string | null
  name: string
  phone?: string | null
  status?: string
  user_id: string
  vehicle_type?: string | null
}

export type DriverUpdate = {
  created_at?: string | null
  id?: string
  license_plate?: string | null
  name?: string
  phone?: string | null
  status?: string
  user_id?: string
  vehicle_type?: string | null
}

export type DriverRelationships = []