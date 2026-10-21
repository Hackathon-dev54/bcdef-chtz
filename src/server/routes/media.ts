// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/bcdef-chtz)

import { Hono } from 'hono'
import { ensureD1Database } from '../db'
import { memoryStore } from '../store'
import { verifyImageMagicBytes, isValidIdentifier, checkRateLimit } from '../security'
import { getCoreDb } from '../sharding'
import type { Bindings } from '../types'

const mediaRoutes = new Hono<{ Bindings: Bindings }>()

const MAX_IMAGE_BYTES = 500 * 1024 // 500 KB hardcap (compressed to ~25 KB WebP on client)

/**
 * Resolves the database for zero-card binary media storage.
 * Defaults to Shard 9 (dedicated media vault), then DB_CORE, then DB.
 */
function getMediaDb(env?: Bindings): any {
  if (!env) return null
  return env.DB_SHARD_8 || env.DB_SHARD_9 || getCoreDb(env) || env.DB || null
}

// Security-Hardened Media Upload API (Adaptive Zero-Card D1 Binary + R2 Switch + wsrv.nl CDN)
const handleMediaUpload = async (c: any) => {
  try {
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'local'
    const rateCheck = checkRateLimit(`media_up_${clientIp}`, 30, 60000)
    if (!rateCheck.allowed) {
      return c.json({ error: 'Upload rate limit reached. Please wait a minute.' }, 429)
    }

    let rawBytes: Uint8Array | null = null
    const contentTypeHeader = c.req.header('content-type') || ''

    if (contentTypeHeader.includes('application/json')) {
      const body = await c.req.json()
      let base64Data = body?.data
      if (!base64Data || typeof base64Data !== 'string') {
        return c.json({ error: 'Missing image data' }, 400)
      }
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
      }
      try {
        const binaryStr = atob(base64Data)
        rawBytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          rawBytes[i] = binaryStr.charCodeAt(i)
        }
      } catch {
        return c.json({ error: 'Invalid Base64 payload' }, 400)
      }
    } else {
      // Direct raw binary stream / buffer
      const arrayBuffer = await c.req.arrayBuffer()
      rawBytes = new Uint8Array(arrayBuffer)
    }

    if (!rawBytes || rawBytes.length === 0) {
      return c.json({ error: 'Empty media content' }, 400)
    }

    if (rawBytes.length > MAX_IMAGE_BYTES) {
      return c.json({ error: 'Image exceeds maximum size of 500KB. Please compress before upload.' }, 400)
    }

    // Security Gate: Strict Magic Bytes Verification (WebP, JPEG, PNG only)
    const magicResult = verifyImageMagicBytes(rawBytes)
    if (!magicResult.valid) {
      return c.json({
        error: 'Invalid file format. Only authentic WebP, JPEG, and PNG images are permitted.',
        code: 'SECURITY_MAGIC_BYTES_REJECTED'
      }, 400)
    }

    const mime = magicResult.mime
    const mediaId = 'med_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
    const now = Date.now()
    let storageEngine = 'd1_binary'

    // Storage Path A: Cloudflare R2 Bucket (if bound and credit card enabled)
    if (c.env?.MEDIA_BUCKET && typeof c.env.MEDIA_BUCKET.put === 'function') {
      try {
        await c.env.MEDIA_BUCKET.put(mediaId, rawBytes, {
          httpMetadata: { contentType: mime }
        })
        storageEngine = 'cloudflare_r2'
      } catch (r2Err: any) {
        console.warn('[R2 Storage Fallback to D1]', r2Err?.message)
      }
    }

    // Storage Path B: Zero Credit Card D1 Binary Storage (Shard 9 or fallback)
    if (storageEngine !== 'cloudflare_r2') {
      const mediaDb = getMediaDb(c.env)
      if (mediaDb) {
        try {
          await mediaDb.prepare(`
            CREATE TABLE IF NOT EXISTS media_blobs (
              id TEXT PRIMARY KEY,
              content_type TEXT NOT NULL,
              byte_size INTEGER NOT NULL,
              data BLOB NOT NULL,
              created_at INTEGER NOT NULL
            )
          `).run()

          await mediaDb.prepare(
            'INSERT OR REPLACE INTO media_blobs (id, content_type, byte_size, data, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(mediaId, mime, rawBytes.length, rawBytes, now).run()

          storageEngine = c.env?.DB_SHARD_8 ? 'd1_shard_8' : (c.env?.DB_SHARD_9 ? 'd1_shard_9' : 'd1_core')
        } catch (d1Err: any) {
          console.warn('[D1 Media Blob Insert Warning]', d1Err?.message)
        }
      }
    }

    // In-memory caching for sub-millisecond edge delivery
    memoryStore.media.set(mediaId, {
      id: mediaId,
      contentType: mime,
      data: rawBytes,
      createdAt: now,
    })

    const reqUrl = new URL(c.req.url)
    const publicUrl = `${reqUrl.protocol}//${reqUrl.host}/api/media/${mediaId}`
    const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(publicUrl)}&w=480&q=80&output=webp&we&default=1&n=-1`

    return c.json({
      success: true,
      id: mediaId,
      url: publicUrl,
      wsrvUrl,
      storage: storageEngine,
      byteSize: rawBytes.length,
      mime,
    }, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Media upload failed' }, 400)
  }
}

mediaRoutes.post('/api/media/upload', handleMediaUpload)
mediaRoutes.post('/api/media', handleMediaUpload)

// Serve media file with security headers and caching
mediaRoutes.get('/api/media/:id', async (c) => {
  const id = c.req.param('id')
  if (!id || !isValidIdentifier(id)) {
    return c.text('Invalid media identifier', 400)
  }

  // 1. Check in-memory cache
  const cached = memoryStore.media.get(id)
  if (cached && typeof cached.data !== 'string') {
    return new Response(cached.data as any, {
      status: 200,
      headers: {
        'Content-Type': cached.contentType || 'image/webp',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }

  // 2. Check Cloudflare R2 bucket
  if (c.env?.MEDIA_BUCKET && typeof c.env.MEDIA_BUCKET.get === 'function') {
    try {
      const r2Obj = await c.env.MEDIA_BUCKET.get(id)
      if (r2Obj) {
        return new Response(r2Obj.body as any, {
          status: 200,
          headers: {
            'Content-Type': r2Obj.httpMetadata?.contentType || 'image/webp',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch (r2Err: any) {
      console.warn('[R2 Get Warning]', r2Err?.message)
    }
  }

  // 3. Check D1 binary storage (Shard 9 or DB_CORE/DB)
  const mediaDb = getMediaDb(c.env)
  if (mediaDb) {
    try {
      const blobRow: any = await mediaDb.prepare(
        'SELECT content_type, data FROM media_blobs WHERE id = ? LIMIT 1'
      ).bind(id).first()

      if (blobRow && blobRow.data) {
        const bytes = blobRow.data instanceof Uint8Array ? blobRow.data : new Uint8Array(blobRow.data)
        return new Response(bytes, {
          status: 200,
          headers: {
            'Content-Type': blobRow.content_type || 'image/webp',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch {}

    // Legacy fallback: check media_attachments (base64 string)
    try {
      const legacyRow: any = await mediaDb.prepare(
        'SELECT content_type, data FROM media_attachments WHERE id = ? LIMIT 1'
      ).bind(id).first()

      if (legacyRow && legacyRow.data) {
        let base64Content = legacyRow.data
        if (base64Content.includes(',')) {
          base64Content = base64Content.split(',')[1]
        }
        const binaryStr = atob(base64Content)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i)
        }

        return new Response(bytes, {
          status: 200,
          headers: {
            'Content-Type': legacyRow.content_type || 'image/webp',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'none'; sandbox",
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
          },
        })
      }
    } catch {}
  }

  return c.text('Media not found', 404)
})

export default mediaRoutes
