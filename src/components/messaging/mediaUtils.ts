import type { ParsedMessage } from './types'

// ============================================================================
// wsrv.nl Global Image Cache & Resizing Proxy Integration
// Free, open-source image cache and resizing proxy: https://wsrv.nl
// ============================================================================
export function getOptimizedImageUrl(rawUrl: string, width = 800): string {
  if (!rawUrl) return ''
  // If it's a local data URI (pre-upload preview), return directly
  if (rawUrl.startsWith('data:image')) return rawUrl
  // If already routed through wsrv.nl, return as is
  if (rawUrl.includes('wsrv.nl')) return rawUrl

  let fullUrl = rawUrl
  if (fullUrl.startsWith('/')) {
    if (typeof window !== 'undefined') {
      fullUrl = window.location.origin + fullUrl
    }
  } else if (fullUrl.startsWith('//')) {
    fullUrl = 'https:' + fullUrl
  }

  // Bypass wsrv.nl for local development hosts that external proxy cannot access
  if (fullUrl.includes('localhost') || fullUrl.includes('127.0.0.1')) {
    return fullUrl
  }

  // Route through wsrv.nl with WebP conversion, dimension resize, auto-EXIF rotation (&af=true), and progressive display (&il=true)
  return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&w=${width}&output=webp&q=80&af=true&il=true`
}

export function parseMessageContent(body: string): ParsedMessage {
  if (!body) return { isImage: false, text: '' }

  // Pattern 1: [img:URL] or [img:URL|caption]
  const imgTagMatch = body.match(/^\[img:(https?:\/\/[^\s|\]]+)(?:\|(.*))?\]$/i)
  if (imgTagMatch) {
    return {
      isImage: true,
      imageUrl: imgTagMatch[1],
      caption: imgTagMatch[2] ? imgTagMatch[2].trim() : undefined,
    }
  }

  // Pattern 2: Direct public image URL or media endpoint
  const isDirectImage =
    /^https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif|svg)(\?[^\s]*)?$/i.test(body.trim()) ||
    /^https?:\/\/[^\s]+\/api\/media\/med_[a-z0-9]+/i.test(body.trim())

  if (isDirectImage) {
    return {
      isImage: true,
      imageUrl: body.trim(),
    }
  }

  return { isImage: false, text: body }
}

// Client-side HTML5 canvas compression before sending to Cloudflare (Saves 90-95% D1 DB storage!)
export async function compressImageToWebP(
  file: File,
  maxDim = 850,
  quality = 0.72
): Promise<{ dataUrl: string; sizeKb: number; originalKb: number }> {
  const originalKb = Math.round(file.size / 1024)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas context not available'))
        ctx.drawImage(img, 0, 0, width, height)

        let dataUrl = canvas.toDataURL('image/webp', quality)
        let sizeKb = Math.round((dataUrl.length * (3 / 4)) / 1024)

        // Adaptive second pass: If photo is still > 140KB (heavy detail), apply slightly more compression to protect D1
        if (sizeKb > 140) {
          dataUrl = canvas.toDataURL('image/webp', 0.6)
          sizeKb = Math.round((dataUrl.length * (3 / 4)) / 1024)
        }

        resolve({ dataUrl, sizeKb, originalKb })
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
