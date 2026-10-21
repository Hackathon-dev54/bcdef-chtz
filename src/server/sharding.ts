// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/bcdef-chtz)

import type { Bindings } from './types'

export const SHARD_HARDCAP_MB = 450 // 90% of 500 MB limit (Leaves 50 MB safety buffer)
export const MAX_VAULT_SHARDS = 8

const initializedVaultShards = new Set<string>()

/**
 * Calculates the exact database size in Megabytes using SQLite PRAGMAs.
 * Runs in sub-millisecond execution time without full-table scans.
 */
export async function getD1DatabaseSizeMB(db: any): Promise<number> {
  if (!db || typeof db.prepare !== 'function') return 0
  try {
    const pageCountRow: any = await db.prepare('PRAGMA page_count').first()
    const pageSizeRow: any = await db.prepare('PRAGMA page_size').first()

    const pageCount = Number(pageCountRow?.page_count || 0)
    const pageSize = Number(pageSizeRow?.page_size || 4096)

    const totalBytes = pageCount * pageSize
    return totalBytes / (1024 * 1024)
  } catch (err) {
    console.warn('[D1 Size Query Warning]', err)
    return 0
  }
}

/**
 * Returns the primary controller database (Shard 0 / DB_CORE or fallback to DB).
 */
export function getCoreDb(env?: Bindings): any {
  if (!env) return null
  return env.DB_CORE || env.DB || null
}

/**
 * Resolves the active shard for new message writes with auto-advancing logic.
 * If the current active vault shard exceeds 450 MB, it advances to the next available shard.
 */
export async function getWriteShard(env?: Bindings): Promise<{ db: any; shardId: number }> {
  if (!env) return { db: null, shardId: 0 }

  const coreDb = getCoreDb(env)

  // Single database fallback (if multi-shard bindings are not configured)
  if (!env.DB_SHARD_1 && env.DB) {
    return { db: env.DB, shardId: 0 }
  }

  let activeShardId = 1
  if (coreDb) {
    try {
      const cfgRow: any = await coreDb
        .prepare("SELECT value FROM system_config WHERE key = 'active_shard_id' LIMIT 1")
        .first()
      if (cfgRow?.value) {
        const parsed = parseInt(cfgRow.value, 10)
        if (!isNaN(parsed) && parsed >= 1 && parsed <= MAX_VAULT_SHARDS) {
          activeShardId = parsed
        }
      }
    } catch {}
  }

  const bindingKey = `DB_SHARD_${activeShardId}` as keyof Bindings
  let currentShardDb = (env as any)[bindingKey] || env.DB_SHARD_1 || env.DB

  // Check current shard size
  const currentSizeMB = await getD1DatabaseSizeMB(currentShardDb)

  if (currentSizeMB >= SHARD_HARDCAP_MB && activeShardId < MAX_VAULT_SHARDS) {
    const nextShardId = activeShardId + 1
    console.log(
      `[Sharding Alert] Shard ${activeShardId} reached ${currentSizeMB.toFixed(1)} MB (Hardcap: ${SHARD_HARDCAP_MB} MB). Rolling over to Shard ${nextShardId}...`
    )

    if (coreDb) {
      try {
        await coreDb
          .prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('active_shard_id', ?)")
          .bind(String(nextShardId))
          .run()
      } catch (err) {
        console.error('[Sharding Rollover Error]', err)
      }
    }

    activeShardId = nextShardId
    const nextBindingKey = `DB_SHARD_${activeShardId}` as keyof Bindings
    currentShardDb = (env as any)[nextBindingKey] || currentShardDb
  }

  // Ensure tables and composite indexes exist on this active shard
  await ensureVaultShard(currentShardDb, activeShardId)

  return { db: currentShardDb, shardId: activeShardId }
}

/**
 * Resolves the correct shard for reading messages of a given conversation/inquiry.
 * Queries conversation_index on DB_CORE to find the home shard ID.
 */
export async function getReadShardForThread(conversationId: string, env?: Bindings): Promise<any> {
  if (!env) return null
  const coreDb = getCoreDb(env)

  // Single database mode fallback
  if (!env.DB_SHARD_1 && env.DB) {
    return env.DB
  }

  if (coreDb) {
    try {
      const row: any = await coreDb
        .prepare('SELECT shard_id FROM conversation_index WHERE thread_id = ? LIMIT 1')
        .bind(conversationId)
        .first()

      if (row?.shard_id) {
        const shardBindingKey = `DB_SHARD_${row.shard_id}` as keyof Bindings
        const shardDb = (env as any)[shardBindingKey]
        if (shardDb) {
          await ensureVaultShard(shardDb, row.shard_id)
          return shardDb
        }
      }
    } catch {}
  }

  // Fallback to active write shard or core database
  return env.DB_SHARD_1 || coreDb || env.DB
}

/**
 * Records or updates thread-to-shard mapping in the master index on DB_CORE.
 */
export async function recordThreadShardMapping(
  coreDb: any,
  threadId: string,
  shardId: number,
  customerName?: string,
  customerHandle?: string,
  lastSnippet?: string
): Promise<void> {
  if (!coreDb || !threadId) return
  const now = Date.now()
  const cleanThreadId = String(threadId).slice(0, 64)
  const cleanCustomerName = String(customerName || 'Customer').slice(0, 64)
  const cleanCustomerHandle = String(customerHandle || 'anonymous').replace(/^@/, '').slice(0, 64)
  const cleanSnippet = String(lastSnippet || '').slice(0, 100)

  try {
    await coreDb
      .prepare(`
        INSERT INTO conversation_index (
          thread_id, 
          customer_name, 
          customer_handle, 
          shard_id, 
          last_message_snippet, 
          last_message_at, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(thread_id) DO UPDATE SET
          last_message_snippet = excluded.last_message_snippet,
          last_message_at = excluded.last_message_at,
          shard_id = excluded.shard_id
      `)
      .bind(
        cleanThreadId,
        cleanCustomerName,
        cleanCustomerHandle,
        shardId,
        cleanSnippet,
        now,
        now
      )
      .run()
  } catch (err: any) {
    console.warn('[Conversation Index Map Warning]', err?.message)
  }
}

/**
 * Initializes message vault tables and composite indexes on a specific database shard.
 */
export async function ensureVaultShard(shardDb: any, shardId: number): Promise<void> {
  const cacheKey = `shard_${shardId}`
  if (!shardDb || initializedVaultShards.has(cacheKey)) return

  try {
    // 1. Messages table for the chat engine
    await shardDb.prepare(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        read_at INTEGER
      )
    `).run()

    // 2. High-performance composite indexes
    await shardDb.prepare(`
      CREATE INDEX IF NOT EXISTS idx_msgs_conv_time 
      ON messages (conversation_id, created_at ASC)
    `).run()

    await shardDb.prepare(`
      CREATE INDEX IF NOT EXISTS idx_msgs_created_at 
      ON messages (created_at DESC)
    `).run()

    // 3. Media Blobs table (used if Shard 9 is allocated for zero-card binary media)
    await shardDb.prepare(`
      CREATE TABLE IF NOT EXISTS media_blobs (
        id TEXT PRIMARY KEY,
        content_type TEXT NOT NULL,
        byte_size INTEGER NOT NULL,
        data BLOB NOT NULL,
        created_at INTEGER NOT NULL
      )
    `).run()

    initializedVaultShards.add(cacheKey)
  } catch (err: any) {
    console.warn(`[Vault Shard ${shardId} Init Warning]`, err?.message)
  }
}
