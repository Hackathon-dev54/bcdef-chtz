import { Hono } from 'hono'
import { ensureD1Database } from '../db'
import { memoryStore } from '../store'
import { getCoreDb, getD1DatabaseSizeMB, SHARD_HARDCAP_MB, MAX_VAULT_SHARDS } from '../sharding'
import { checkRateLimit } from '../security'
import type { Bindings } from '../types'

const profileRoutes = new Hono<{ Bindings: Bindings }>()

// Human-friendly Crockford Base32 alphabet (excludes 0, O, 1, I, L to prevent confusion)
const PIN_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generatePin(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  let part1 = ''
  let part2 = ''
  for (let i = 0; i < 4; i++) {
    part1 += PIN_ALPHABET[bytes[i] % PIN_ALPHABET.length]
  }
  for (let i = 4; i < 8; i++) {
    part2 += PIN_ALPHABET[bytes[i] % PIN_ALPHABET.length]
  }
  return `NP-${part1}-${part2}`
}

const MAX_FAQS = 50
const MAX_FAQ_JSON_BYTES = 30000

function sanitizeFaqs(input: any): { q: string; a: string; keywords?: string[] }[] {
  if (!Array.isArray(input)) return []
  const out: { q: string; a: string; keywords?: string[] }[] = []
  for (const item of input.slice(0, MAX_FAQS)) {
    const q = String(item?.q ?? '').trim().slice(0, 400)
    const a = String(item?.a ?? '').trim().slice(0, 800)
    if (!q || !a) continue
    const keywords = Array.isArray(item?.keywords)
      ? item.keywords.map((k: any) => String(k).trim().toLowerCase().slice(0, 40)).filter(Boolean).slice(0, 20)
      : undefined
    out.push(keywords && keywords.length ? { q, a, keywords } : { q, a })
  }
  return out
}

function safeParseFaqs(raw: string | undefined | null) {
  if (!raw) return []
  try {
    return sanitizeFaqs(JSON.parse(raw))
  } catch {
    return []
  }
}

// GET Current Profile & Privacy Settings
profileRoutes.get('/api/profile', async (c) => {
  const db = c.env?.DB
  let adminHandle = 'admin'
  let adminDisplayName = 'Chatze User'

  const user = memoryStore.users.get('usr_admin')
  if (user) {
    adminHandle = user.handle
    adminDisplayName = user.display_name
  }

  const profile = {
    displayName: memoryStore.config.get('display_name') || adminDisplayName,
    handle: adminHandle,
    accountType: (memoryStore.config.get('account_type') as 'personal' | 'business') || 'personal',
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
    hubNodeId: memoryStore.config.get('hub_node_id') || 'node_' + (user?.handle || 'admin'),
    instanceUrl: c.req.url.replace(/\/api\/.*$/, ''),
    customFaqs: safeParseFaqs(memoryStore.config.get('custom_faqs')),
  }

  if (db) {
    try {
      await ensureD1Database(db)
      const { results } = await db.prepare(
        "SELECT key, value FROM system_config WHERE key IN ('display_name', 'account_type', 'bio', 'business_category', 'business_phone', 'business_location', 'business_hours', 'delivery_info', 'catalog_tags', 'privacy_mode', 'friend_pin', 'inquiry_letterbox_enabled', 'hub_listed', 'hub_node_id', 'custom_faqs')"
      ).all()

      if (Array.isArray(results)) {
        for (const row of results as any[]) {
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

      const adminRow: any = await db.prepare("SELECT handle, display_name FROM users WHERE role = 'admin' LIMIT 1").first()
      if (adminRow) {
        profile.handle = adminRow.handle
        if (!profile.displayName) profile.displayName = adminRow.display_name
      }
    } catch (e: any) {
      console.warn('[D1 Profile Read Warning]', e?.message)
    }
  }

  // Ensure default privacy_mode exists in D1 (Default is pin_only)
  if (db && !memoryStore.config.get('privacy_mode')) {
    try {
      await db.prepare("INSERT OR IGNORE INTO system_config (key, value) VALUES ('privacy_mode', ?)").bind(profile.privacyMode).run()
    } catch {}
  }

  // Ensure default PIN exists
  if (!profile.friendPin) {
    profile.friendPin = generatePin()
    memoryStore.config.set('friend_pin', profile.friendPin)
    if (db) {
      try {
        await db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('friend_pin', ?)").bind(profile.friendPin).run()
      } catch {}
    }
  }

  return c.json({ profile })
})

// POST Update Profile & Privacy Settings
profileRoutes.post('/api/profile', async (c) => {
  try {
    const body = await c.req.json()
    const {
      displayName,
      accountType,
      bio,
      businessCategory,
      businessPhone,
      businessLocation,
      businessHours,
      deliveryInfo,
      catalogTags,
      privacyMode,
      friendPin,
      inquiryLetterboxEnabled,
      hubListed,
      customFaqs,
    } = body

    // Only touch custom FAQs when the client explicitly sends them
    let cleanFaqsJson: string | null = null
    if (customFaqs !== undefined) {
      cleanFaqsJson = JSON.stringify(sanitizeFaqs(customFaqs))
      if (cleanFaqsJson.length > MAX_FAQ_JSON_BYTES) {
        return c.json({ error: 'FAQ list too large (max ~30KB / 50 entries)' }, 400)
      }
      memoryStore.config.set('custom_faqs', cleanFaqsJson)
    }

    const cleanName = (displayName || '').trim() || 'Chatze User'
    const cleanAccountType = accountType === 'business' ? 'business' : 'personal'
    const cleanBio = (bio || '').trim()
    const cleanCategory = (businessCategory || 'General & Retail').trim()
    const cleanPhone = (businessPhone || '').trim()
    const cleanLocation = (businessLocation || 'Kathmandu, Nepal').trim()
    const cleanHours = (businessHours || 'Sun - Fri: 10:00 AM - 7:00 PM').trim()
    const cleanDelivery = (deliveryInfo || 'All Nepal Courier & Inside Valley Delivery').trim()
    const cleanCatalog = (catalogTags || 'Retail, Wholesale, Custom Orders, Cash on Delivery').trim()
    
    // For business accounts, friend requests are ALWAYS private (pin_only or closed) to prevent spam
    let cleanPrivacy = ['open', 'pin_only', 'closed'].includes(privacyMode) ? privacyMode : 'pin_only'
    if (cleanAccountType === 'business' && cleanPrivacy === 'open') {
      cleanPrivacy = 'pin_only'
    }

    const cleanPin = (friendPin || '').trim() || generatePin()
    const cleanLetterbox = inquiryLetterboxEnabled !== false ? 'true' : 'false'
    const cleanHubListed = hubListed !== false ? 'true' : 'false'

    // Update memory store
    memoryStore.config.set('display_name', cleanName)
    memoryStore.config.set('account_type', cleanAccountType)
    memoryStore.config.set('bio', cleanBio)
    memoryStore.config.set('business_category', cleanCategory)
    memoryStore.config.set('business_phone', cleanPhone)
    memoryStore.config.set('business_location', cleanLocation)
    memoryStore.config.set('business_hours', cleanHours)
    memoryStore.config.set('delivery_info', cleanDelivery)
    memoryStore.config.set('catalog_tags', cleanCatalog)
    memoryStore.config.set('privacy_mode', cleanPrivacy)
    memoryStore.config.set('friend_pin', cleanPin)
    memoryStore.config.set('inquiry_letterbox_enabled', cleanLetterbox)
    memoryStore.config.set('hub_listed', cleanHubListed)

    const admin = memoryStore.users.get('usr_admin')
    if (admin) {
      admin.display_name = cleanName
    }

    const db = c.env?.DB
    if (db) {
      try {
        await ensureD1Database(db)
        await db.batch([
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('display_name', ?)").bind(cleanName),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('account_type', ?)").bind(cleanAccountType),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('bio', ?)").bind(cleanBio),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('business_category', ?)").bind(cleanCategory),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('business_phone', ?)").bind(cleanPhone),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('business_location', ?)").bind(cleanLocation),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('business_hours', ?)").bind(cleanHours),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('delivery_info', ?)").bind(cleanDelivery),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('catalog_tags', ?)").bind(cleanCatalog),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('privacy_mode', ?)").bind(cleanPrivacy),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('friend_pin', ?)").bind(cleanPin),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('inquiry_letterbox_enabled', ?)").bind(cleanLetterbox),
          db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('hub_listed', ?)").bind(cleanHubListed),
          db.prepare("UPDATE users SET display_name = ? WHERE role = 'admin'").bind(cleanName),
          ...(cleanFaqsJson !== null
            ? [db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('custom_faqs', ?)").bind(cleanFaqsJson)]
            : []),
        ])
      } catch (d1Err: any) {
        console.warn('[D1 Profile Save Warning]', d1Err?.message)
      }
    }

    return c.json({
      success: true,
      profile: {
        displayName: cleanName,
        accountType: cleanAccountType,
        bio: cleanBio,
        businessCategory: cleanCategory,
        businessPhone: cleanPhone,
        businessLocation: cleanLocation,
        businessHours: cleanHours,
        deliveryInfo: cleanDelivery,
        catalogTags: cleanCatalog,
        privacyMode: cleanPrivacy,
        friendPin: cleanPin,
        inquiryLetterboxEnabled: cleanLetterbox === 'true',
        hubListed: cleanHubListed === 'true',
        instanceUrl: c.req.url.replace(/\/api\/.*$/, ''),
        customFaqs: safeParseFaqs(memoryStore.config.get('custom_faqs')),
      },
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to update profile' }, 400)
  }
})

// POST Regenerate Friend PIN (Cryptographically secure WebCrypto Base32)
const handleRegeneratePin = async (c: any) => {
  const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'local'
  const rate = checkRateLimit(`pin_regen_${clientIp}`, 10, 60000)
  if (!rate.allowed) {
    return c.json({ error: 'Too many PIN change requests. Please wait a minute.' }, 429)
  }

  const newPin = generatePin()
  memoryStore.config.set('friend_pin', newPin)
  const db = c.env?.DB
  if (db) {
    try {
      await ensureD1Database(db)
      await db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('friend_pin', ?)").bind(newPin).run()
    } catch (err: any) {
      console.warn('[D1 PIN Update Warning]', err?.message)
    }
  }
  return c.json({ success: true, friendPin: newPin })
}

profileRoutes.post('/api/profile/pin/regenerate', handleRegeneratePin)
profileRoutes.post('/api/auth/regenerate-pin', handleRegeneratePin)

// GET /api/system/shards: Real-Time D1 Shard & Storage Quota Health
profileRoutes.get('/api/system/shards', async (c) => {
  const coreDb = getCoreDb(c.env)
  const isMultiSharded = Boolean(c.env?.DB_SHARD_1)

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

  const coreSizeMB = await getD1DatabaseSizeMB(coreDb)
  const shardStatuses: any[] = []

  for (let i = 1; i <= MAX_VAULT_SHARDS; i++) {
    const bindingKey = `DB_SHARD_${i}` as keyof Bindings
    const shardDb = (c.env as any)?.[bindingKey]

    if (shardDb) {
      const sizeMB = await getD1DatabaseSizeMB(shardDb)
      shardStatuses.push({
        shardId: i,
        databaseName: `chatze_shard_${i}`,
        bindingKey,
        sizeMB: Number(sizeMB.toFixed(2)),
        hardcapMB: SHARD_HARDCAP_MB,
        percentUsed: Number(((sizeMB / SHARD_HARDCAP_MB) * 100).toFixed(1)),
        status: i === activeShardId ? 'active_write' : sizeMB >= SHARD_HARDCAP_MB ? 'sealed_full' : 'standby',
        isMediaVault: i === 8 || i === 9,
      })
    } else {
      shardStatuses.push({
        shardId: i,
        databaseName: `chatze_shard_${i}`,
        bindingKey,
        sizeMB: 0,
        hardcapMB: SHARD_HARDCAP_MB,
        percentUsed: 0,
        status: 'unbound',
        isMediaVault: i === 8 || i === 9,
      })
    }
  }

  let mediaEngine = 'd1_core'
  if (c.env?.MEDIA_BUCKET) {
    mediaEngine = 'cloudflare_r2'
  } else if (c.env?.DB_SHARD_8) {
    mediaEngine = 'd1_shard_8'
  } else if (c.env?.DB_SHARD_9) {
    mediaEngine = 'd1_shard_9'
  }

  return c.json({
    isMultiSharded,
    activeShardId,
    hardcapPerShardMB: SHARD_HARDCAP_MB,
    maxVaultShards: MAX_VAULT_SHARDS,
    coreDatabase: {
      name: 'chatze_core',
      sizeMB: Number(coreSizeMB.toFixed(2)),
      hardcapMB: SHARD_HARDCAP_MB,
    },
    shards: shardStatuses,
    mediaStorageEngine: mediaEngine,
    r2Connected: Boolean(c.env?.MEDIA_BUCKET),
    totalPotentialCapacityMB: MAX_VAULT_SHARDS * SHARD_HARDCAP_MB,
  })
})

export default profileRoutes
