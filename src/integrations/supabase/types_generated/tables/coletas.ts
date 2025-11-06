import type { Json } from '../database';

export type ColetasRow = {
  created_at: string
  id: number
}

export type ColetasInsert = {
  created_at?: string
  id?: number
}

export type ColetasUpdate = {
  created_at?: string
  id?: number
}

export type ColetasRelationships = []