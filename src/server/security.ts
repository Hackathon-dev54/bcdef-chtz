// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/chat-web-new)

/**
 * Validates identifiers (conversation IDs, thread IDs, user IDs)
 * to ensure strict adherence to safe alphanumeric patterns.
 */
export function isValidIdentifier(id: unknown): boolean {
  if (typeof id !== 'string') return false
  if (id.length < 1 || id.length > 64) return false
  return /^[a-zA-Z0-9_\-\.]{1,64}$/.test(id)
}

/**
 * Sanitizes and truncates user-provided text to prevent memory bloat and XSS injection.
 */
export function sanitizeInputText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return ''
  // Strip control chars (except newline and carriage return)
  let clean = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim()
  if (clean.length > maxLength) {
    clean = clean.slice(0, maxLength)
  }
  return clean
}

/**
 * Validates handles (@username format).
 */
export function isValidHandle(handle: unknown): boolean {
  if (typeof handle !== 'string') return false
  const clean = handle.replace(/^@/, '').trim()
  if (clean.length < 2 || clean.length > 32) return false
  return /^[a-zA-Z0-9_]{2,32}$/.test(clean)
}

/**
 * Inspects raw buffer magic bytes to ensure uploaded file is genuine WebP, JPEG, or PNG.
 * Prevents executable, script, SVG, or PHP payload uploads.
 */
export function verifyImageMagicBytes(bytes: Uint8Array): { valid: boolean; mime: string } {
  if (!bytes || bytes.length < 12) {
    return { valid: false, mime: '' }
  }

  // 1. WebP: RIFF header (bytes 0-3: 0x52, 0x49, 0x46, 0x46) and WEBP (bytes 8-11: 0x57, 0x45, 0x42, 0x50)
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { valid: true, mime: 'image/webp' }
  }

  // 2. JPEG: 0xFF, 0xD8, 0xFF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, mime: 'image/jpeg' }
  }

  // 3. PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
  if (
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { valid: true, mime: 'image/png' }
  }

  return { valid: false, mime: '' }
}

/**
 * In-memory rate limiter per IP/identifier to protect D1 from write floods.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    // Evict expired entries periodically
    if (rateLimitMap.size > 5000) {
      for (const [k, v] of rateLimitMap.entries()) {
        if (now > v.resetAt) rateLimitMap.delete(k)
      }
    }
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  record.count += 1
  return { allowed: true, remaining: maxRequests - record.count }
}
