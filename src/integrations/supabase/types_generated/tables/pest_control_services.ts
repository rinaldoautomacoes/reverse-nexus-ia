import type { Json } from '../database';

export type PestControlServiceRow = {
  id: string
  user_id: string
  client_id: string | null
  responsible_user_id: string | null
  status: string
  service_date: string
  service_time: string | null
  pests_detected: Json | null
  environment_type: string | null
  address: string
  checklist: Json | null
  observations: string | null
  attachments: Json | null
  created_at: string | null
  updated_at: string | null
}

export type PestControlServiceInsert = {
  id?: string
  user_id: string
  client_id?: string | null
  responsible_user_id?: string | null
  status?: string
  service_date: string
  service_time?: string | null
  pests_detected?: Json | null
  environment_type?: string | null
  address: string
  checklist?: Json | null
  observations?: string | null
  attachments?: Json | null
  created_at?: string | null
  updated_at?: string | null
}

export type PestControlServiceUpdate = {
  id?: string
  user_id?: string
  client_id?: string | null
  responsible_user_id?: string | null
  status?: string
  service_date?: string
  service_time?: string | null
  pests_detected?: Json | null
  environment_type?: string | null
  address?: string
  checklist?: Json | null
  observations?: string | null
  attachments?: Json | null
  created_at?: string | null
  updated_at?: string | null
}

export type PestControlServiceRelationships = [
  {
    foreignKeyName: "pest_control_services_client_id_fkey"
    columns: ["client_id"]
    isOneToOne: false
    referencedRelation: "clients"
    referencedColumns: ["id"]
  },
  {
    foreignKeyName: "pest_control_services_responsible_user_id_fkey"
    columns: ["responsible_user_id"]
    isOneToOne: false
    referencedRelation: "profiles"
    referencedColumns: ["id"]
  },
  {
    foreignKeyName: "pest_control_services_user_id_fkey"
    columns: ["user_id"]
    isOneToOne: false
    referencedRelation: "users"
    referencedColumns: ["id"]
  },
]