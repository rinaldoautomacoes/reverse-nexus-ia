import type { Json } from '../database';

export type UserRoleRow = {
  created_at: string
  id: string
  role: string
  user_id: string
}

export type UserRoleInsert = {
  created_at?: string
  id?: string
  role: string
  user_id: string
}

export type UserRoleUpdate = {
  created_at?: string
  id?: string
  role?: string
  user_id?: string
}

export type UserRoleRelationships = []