// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/bcdef-chtz)

import { Hono } from 'hono'
import { ensureD1Database } from '../db'
import { memoryStore, validateSession } from '../store'
import { resolveOtherUser } from './conversations'
import { generatePin } from './profile'
import type { Bindings } from '../types'

const bootstrapRoutes = new Hono<{ Bindings: Bindings }>()

function safeParseFaqs(raw: string | undefined | null) {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// 1-Hit Bootstrap Endpoint (Combines Profile, Conversations, Inquiries & Friendships into 1 Single Invocation)
bootstrapRoutes.get('/api/bootstrap', async (c) => {
  const db = c.env?.DB

  if (db) {
    try {
      await ensureD1Database(db)
    } catch {}
  }

  const authHeader = c.req.header('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  let viewer: any = null
  if (token) {
    viewer = await validateSession(token, db)
  }

  const adminUser = memoryStore.users.get('usr_admin')
  let shopHandle = adminUser?.handle || 'admin'
  let shopDisplayName = memoryStore.config.get('display_name') || adminUser?.display_name || 'Chatze User'
  let accountType = (memoryStore.config.get('account_type') as 'personal' | 'business') || 'personal'

  const profile: any = {
    displayName: shopDisplayName,
    handle: shopHandle,
    accountType,
    bio: memoryStore.config.get('bio') || '',
    businessCategory: memoryStore.config.get('business_category') || 'General & Retail',
    businessPhone: memoryStore.config.get('business_phone') || '',
    businessLocation: memoryStore.config.get('business_location') || 'Kathmandu, Nepal',
    businessHours: memoryStore.config.get('business_hours') || 'Sun - Fri: 10:00 AM - 7:00 PM',
    deliveryInfo: memoryStore.config.get('delivery_info') || 'All Nepal Courier & Inside Valley Delivery',
    catalogTags: memoryStore.config.get('catalog_tags') || 'Retail, Wholesale, Custom Orders, Cash on Delivery',
    privacyMode: (memoryStore.config.get('privacy_mode') as 'open' | 'pin_only' | 'closed') || 'pin_only',
    friendPin: memoryStore.config.get('friend_pin') || '',
    inquiryLetterboxEnabled: memoryStore.config.get('inquiry_letterbox_enabled') !== 'false',
    hubListed: memoryStore.config.get('hub_listed') !== 'false',
    hubNodeId: memoryStore.config.get('hub_node_id') || 'node_' + shopHandle,
    instanceUrl: c.req.url.replace(/\/api\/.*$/, ''),
    customFaqs: safeParseFaqs(memoryStore.config.get('custom_faqs')),
  }

  let conversations: any[] = []
  let inquiries: any[] = []
  let friendships: any[] = []
  let d1Success = false

  if (db) {
    try {
      // Parallel batch query on Cloudflare D1
      const [sysConfigRows, adminRow, convRows, inqRows, friendRows]: any[] = await Promise.all([
        db.prepare(
          "SELECT key, value FROM system_config WHERE key IN ('display_name', 'account_type', 'bio', 'business_category', 'business_phone', 'business_location', 'business_hours', 'delivery_info', 'catalog_tags', 'privacy_mode', 'friend_pin', 'inquiry_letterbox_enabled', 'hub_listed', 'hub_node_id', 'custom_faqs')"
        ).all().catch(() => ({ results: [] })),
        db.prepare("SELECT handle, display_name FROM users WHERE role = 'admin' LIMIT 1").first().catch(() => null),
        db.prepare("SELECT * FROM conversations ORDER BY last_message_at DESC LIMIT 100").all().catch(() => ({ results: [] })),
        db.prepare("SELECT * FROM static_inquiries ORDER BY created_at DESC LIMIT 50").all().catch(() => ({ results: [] })),
        db.prepare("SELECT * FROM federation_friendships ORDER BY created_at DESC LIMIT 50").all().catch(() => ({ results: [] })),
      ])

      if (Array.isArray(sysConfigRows?.results)) {
        for (const row of sysConfigRows.results) {
          if (row.key === 'display_name') profile.displayName = row.value
          if (row.key === 'account_type') profile.accountType = row.value
          if (row.key === 'bio') profile.bio = row.value
          if (row.key === 'business_category') profile.businessCategory = row.value
          if (row.key === 'business_phone') profile.businessPhone = row.value
          if (row.key === 'business_location') profile.businessLocation = row.value
          if (row.key === 'business_hours') profile.businessHours = row.value
          if (row.key === 'delivery_info') profile.deliveryInfo = row.value
          if (row.key === 'catalog_tags') profile.catalogTags = row.value
          if (row.key === 'privacy_mode') profile.privacyMode = row.value
          if (row.key === 'friend_pin') profile.friendPin = row.value
          if (row.key === 'inquiry_letterbox_enabled') profile.inquiryLetterboxEnabled = row.value === 'true'
          if (row.key === 'hub_listed') profile.hubListed = row.value === 'true'
          if (row.key === 'hub_node_id') profile.hubNodeId = row.value
          if (row.key === 'custom_faqs') profile.customFaqs = safeParseFaqs(row.value)
        }
      }

      if (adminRow?.handle) {
        shopHandle = adminRow.handle
        profile.handle = adminRow.handle
        if (adminRow.display_name && !profile.displayName) {
          profile.displayName = adminRow.display_name
        }
      }

      shopDisplayName = profile.displayName || shopDisplayName

      if (!profile.friendPin) {
        profile.friendPin = generatePin()
        memoryStore.config.set('friend_pin', profile.friendPin)
        if (db) {
          try {
            await db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('friend_pin', ?)").bind(profile.friendPin).run()
          } catch {}
        }
      }

      if (db && !memoryStore.config.get('privacy_mode')) {
        try {
          await db.prepare("INSERT OR IGNORE INTO system_config (key, value) VALUES ('privacy_mode', ?)").bind(profile.privacyMode).run()
        } catch {}
      }

      // Map conversations
      if (Array.isArray(convRows?.results)) {
        conversations = convRows.results.map((row: any) => ({
          id: row.id,
          otherUser: resolveOtherUser(row, viewer, shopHandle, shopDisplayName),
          status: row.status,
          remoteInstanceUrl: row.remote_instance_url || null,
          lastMessage: row.last_message_snippet
            ? {
                content: row.last_message_snippet,
                createdAt: row.last_message_at,
              }
            : null,
        }))
      }

      if (Array.isArray(inqRows?.results)) {
        inquiries = inqRows.results
      }

      if (Array.isArray(friendRows?.results)) {
        friendships = friendRows.results
      }

      d1Success = true
    } catch (err: any) {
      console.warn('[D1 Bootstrap Warning, falling back to memory]', err?.message)
    }
  }

  // Memory fallback ONLY if D1 was unavailable or failed
  if (!d1Success) {
    const viewerHandle = (viewer?.handle || '').toLowerCase().replace(/^@/, '')
    const viewerId = viewer?.id || ''
    const isBusinessOwner = profile.accountType === 'business' && (!viewer || viewer.role === 'admin' || viewer.id === adminUser?.id)
    const allConvs = Array.from(memoryStore.conversations.values())
    const filtered = !isBusinessOwner && (viewerHandle || viewerId)
      ? allConvs.filter((c) => c.user_b === viewerId || c.user_b === viewerHandle || c.remote_handle === viewerHandle)
      : allConvs

    conversations = filtered
      .sort((a, b) => b.last_message_at - a.last_message_at)
      .map((conv) => ({
        id: conv.id,
        otherUser: resolveOtherUser(conv, viewer, shopHandle, shopDisplayName),
        status: conv.status,
        remoteInstanceUrl: conv.remote_instance_url || null,
        lastMessage: conv.last_message_snippet
          ? {
              content: conv.last_message_snippet,
              createdAt: conv.last_message_at,
            }
          : null,
      }))

    inquiries = Array.from(memoryStore.inquiries.values()).sort((a, b) => b.created_at - a.created_at)
    friendships = Array.from(memoryStore.friendships.values()).sort((a, b) => b.created_at - a.created_at)
  }

  return c.json({
    profile,
    conversations,
    inquiries,
    friendships,
    timestamp: Date.now(),
  })
})

export default bootstrapRoutes
