export type Bindings = {
  DB?: any // Legacy / Single Cloudflare D1 Database binding
  DB_CORE?: any // Shard 0: Controller (Config, Users, Sessions, Index)
  DB_SHARD_1?: any // Vault Shard 1 (Max 450 MB)
  DB_SHARD_2?: any // Vault Shard 2 (Max 450 MB)
  DB_SHARD_3?: any // Vault Shard 3 (Max 450 MB)
  DB_SHARD_4?: any // Vault Shard 4 (Max 450 MB)
  DB_SHARD_5?: any // Vault Shard 5 (Max 450 MB)
  DB_SHARD_6?: any // Vault Shard 6 (Max 450 MB)
  DB_SHARD_7?: any // Vault Shard 7 (Max 450 MB)
  DB_SHARD_8?: any // Vault Shard 8 (Max 450 MB)
  DB_SHARD_9?: any // Vault Shard 9 / Media Vault (Max 450 MB)
  MEDIA_BUCKET?: any // Cloudflare R2 Bucket binding
  ASSETS?: any // Cloudflare Workers static assets binding
  REALTIME_ROOM?: any // Cloudflare Durable Object binding for 0ms cross-isolate push
  JWT_SECRET?: string
  NODE_ENV?: string
  VAPID_PUBLIC_KEY?: string
  NEXT_PUBLIC_VAPID_PUBLIC_KEY?: string
  VAPID_PRIVATE_KEY?: string
  VAPID_SUBJECT?: string
}

export type UserStreamClient = {
  id: string
  userId: string
  write: (data: string) => void
}

export interface MemUser {
  id: string
  handle: string
  display_name: string
  password_hash: string
  role: string
  created_at: number
}

export interface MemSession {
  userId: string
  createdAt: number
  expiresAt: number
}

export interface MemConversation {
  id: string
  user_a: string
  user_b: string
  remote_handle?: string
  remote_instance_url?: string
  last_message_snippet: string | null
  last_message_at: number
  status: string // 'active' | 'pending' | 'archived'
}

export interface MemMessage {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: number
  read_at: number | null
}

export interface MemFriendship {
  id: string
  local_user_id: string
  remote_handle: string
  remote_instance_url: string
  status: string // 'pending' | 'active' | 'rejected'
  direction: 'incoming' | 'outgoing'
  created_at: number
}

export interface MemMedia {
  id: string
  contentType: string
  data: string | Uint8Array
  createdAt: number
}

export interface MemInquiry {
  id: string
  sender_handle: string
  sender_name: string
  sender_user_id?: string
  sender_root_domain: string
  sender_origin_url: string
  category?: string
  content: string
  status: 'pending' | 'accepted' | 'dismissed'
  conversation_id?: string
  created_at: number
}

export interface MemBlockedDomain {
  root_domain: string
  reason?: string
  blocked_at: number
}
