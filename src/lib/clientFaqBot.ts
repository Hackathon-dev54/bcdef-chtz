// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/bcdef-chtz)

/**
 * Client-Side Zero-Invocation Deflection & FAQ Bot
 * Runs 100% locally in the visitor's browser with zero network hits,
 * zero Worker invocations, and zero D1 database reads/writes.
 *
 * Merchants can upload / paste their own FAQ list (JSON, Markdown or TXT)
 * from Settings. Custom FAQs are always matched BEFORE the built-in rules.
 */

export interface CustomFaq {
  q: string
  a: string
  keywords?: string[]
}

export interface ShopKnowledge {
  displayName?: string
  businessLocation?: string
  businessPhone?: string
  businessHours?: string
  deliveryInfo?: string
  catalogTags?: string
  bio?: string
  customFaqs?: CustomFaq[]
}

export interface BotMatchResult {
  matched: boolean
  category?: 'custom' | 'location' | 'phone' | 'hours' | 'delivery' | 'pricing' | 'greeting'
  title: string
  answer: string
  nepaliSnippet?: string
}

export const MAX_CUSTOM_FAQS = 50
export const MAX_FAQ_TEXT_LENGTH = 400

// ---------------------------------------------------------------------------
// Parser: accepts JSON, Markdown or plain TXT
// ---------------------------------------------------------------------------
function cleanFaq(raw: any): CustomFaq | null {
  if (!raw || typeof raw !== 'object') return null
  const q = String(raw.q ?? raw.question ?? '').trim().slice(0, MAX_FAQ_TEXT_LENGTH)
  const a = String(raw.a ?? raw.answer ?? '').trim().slice(0, MAX_FAQ_TEXT_LENGTH * 2)
  if (!q || !a) return null
  let keywords: string[] | undefined
  const kw = raw.keywords ?? raw.tags
  if (Array.isArray(kw)) {
    keywords = kw.map((k: any) => String(k).trim().toLowerCase()).filter(Boolean).slice(0, 20)
  } else if (typeof kw === 'string' && kw.trim()) {
    keywords = kw.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean).slice(0, 20)
  }
  return keywords && keywords.length ? { q, a, keywords } : { q, a }
}

/**
 * Supported formats:
 *  JSON:  [{ "q": "...", "a": "...", "keywords": ["..."] }]  (or { "faqs": [...] })
 *  MD:    ## Question?   (or ### / - / Q:)  followed by answer lines,
 *         optional line "Keywords: a, b, c"
 *  TXT:   Q: Question?
 *         A: Answer
 *         K: keyword1, keyword2   (optional)
 */
export function parseFaqText(input: string): CustomFaq[] {
  const text = (input || '').trim()
  if (!text) return []

  // 1. JSON
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.faqs) ? parsed.faqs : []
      return list.map(cleanFaq).filter(Boolean).slice(0, MAX_CUSTOM_FAQS) as CustomFaq[]
    } catch {
      // fall through to text parsing
    }
  }

  // 2. Markdown / TXT line parser
  const faqs: CustomFaq[] = []
  let current: { q: string; a: string[]; keywords?: string } | null = null

  const flush = () => {
    if (current) {
      const f = cleanFaq({ q: current.q, a: current.a.join(' ').trim(), keywords: current.keywords })
      if (f) faqs.push(f)
    }
    current = null
  }

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue

    const qMatch =
      line.match(/^#{1,6}\s*(?:Q[:.)]\s*)?(.+)$/i) || // ## Question  /  ### Q: Question
      line.match(/^(?:[-*]\s*)?\*{0,2}Q(?:uestion)?\*{0,2}\s*[:.)-]\s*\*{0,2}(.+?)\*{0,2}$/i) // Q: Question
    const aMatch = line.match(/^(?:[-*]\s*)?\*{0,2}A(?:nswer)?\*{0,2}\s*[:.)-]\s*\*{0,2}(.+?)\*{0,2}$/i)
    const kMatch = line.match(/^(?:[-*]\s*)?\*{0,2}(?:K|Keywords?|Tags?)\*{0,2}\s*[:]\s*(.+)$/i)

    if (kMatch && current) {
      current.keywords = kMatch[1]
    } else if (aMatch && current) {
      current.a.push(aMatch[1])
    } else if (qMatch) {
      flush()
      current = { q: qMatch[1].trim(), a: [] }
    } else if (current) {
      current.a.push(line.replace(/^[-*>]\s*/, ''))
    }
  }
  flush()
  return faqs.slice(0, MAX_CUSTOM_FAQS)
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'you', 'your', 'i', 'me', 'my', 'we', 'our',
  'what', 'how', 'can', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'it', 'this', 'that',
  'with', 'have', 'has', 'be', 'will', 'there', 'any', 'please', 'ho', 'cha', 'ma', 'ko',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
}

function matchCustomFaq(query: string, faqs: CustomFaq[]): CustomFaq | null {
  const clean = query.toLowerCase()
  const queryTokens = new Set(tokenize(query))
  if (!queryTokens.size) return null

  let best: CustomFaq | null = null
  let bestScore = 0

  for (const faq of faqs) {
    let score = 0
    // Exact question click (from quick chips) = guaranteed match
    if (faq.q.toLowerCase().trim() === clean.trim()) score += 100
    for (const kw of faq.keywords || []) {
      if (kw && clean.includes(kw)) score += 3
    }
    for (const t of tokenize(faq.q)) {
      if (queryTokens.has(t)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      best = faq
    }
  }
  // Require at least 2 points (2 overlapping words or 1 keyword) to avoid noise
  return bestScore >= 2 ? best : null
}

// Word-prefix matching so "deliver" matches "deliver", "delivery", "delivering"
function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase()
  return keywords.some((kw) => {
    const k = kw.toLowerCase()
    if (/[^\x00-\x7F]/.test(k) || k.includes(' ')) return normalized.includes(k)
    return new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(normalized)
  })
}

const LOCATION_KEYWORDS = [
  'location', 'located', 'where', 'address', 'direction', 'map', 'thikana',
  'kaha', 'kata', 'कहाँ', 'ठेगाना', 'कता',
]
const PHONE_KEYWORDS = [
  'phone', 'number', 'contact', 'call', 'mobile', 'whatsapp', 'viber',
  'fon', 'फोन', 'नम्बर', 'सम्पर्क', 'कल',
]
const HOURS_KEYWORDS = [
  'hour', 'timing', 'open', 'close', 'closing', 'sunday', 'saturday',
  'kahile khulcha', 'khulla', 'खुल्ने समय', 'कहिले खुल्छ', 'बन्द',
]
const DELIVERY_KEYWORDS = [
  'deliver', 'shipping', 'ship', 'courier', 'pathao', 'indrive', 'valley', 'outside',
  'kathmandu bahira', 'home delivery', 'डेलिभरी', 'पठाउनुहुन्छ',
]
const PRICING_KEYWORDS = [
  'price', 'cost', 'rate', 'how much', 'kati', 'mulya', 'मूल्य', 'कति', 'रेट',
]
const GREETING_KEYWORDS = ['hi', 'hello', 'namaste', 'hey', 'नमस्ते', 'हेलो']

export function evaluateClientFaq(query: string, knowledge: ShopKnowledge): BotMatchResult | null {
  if (!query || query.trim().length < 2) return null
  const clean = query.trim().toLowerCase()

  // 0. Merchant custom FAQs ALWAYS win
  if (knowledge.customFaqs && knowledge.customFaqs.length) {
    const hit = matchCustomFaq(clean, knowledge.customFaqs)
    if (hit) {
      return { matched: true, category: 'custom', title: `💬 ${hit.q}`, answer: hit.a }
    }
  }

  // 1. Delivery (checked before hours so "delivery time" goes to delivery)
  if (containsAnyKeyword(clean, DELIVERY_KEYWORDS) && knowledge.deliveryInfo?.trim()) {
    const delivery = knowledge.deliveryInfo.trim()
    return {
      matched: true,
      category: 'delivery',
      title: '🚚 Delivery Policy / डेलिभरी जानकारी',
      answer: delivery,
      nepaliSnippet: `डेलिभरी सेवा: ${delivery}`,
    }
  }

  // 2. Location
  if (containsAnyKeyword(clean, LOCATION_KEYWORDS) && knowledge.businessLocation?.trim()) {
    const loc = knowledge.businessLocation.trim()
    return {
      matched: true,
      category: 'location',
      title: '📍 Store Location / पसलको ठेगाना',
      answer: `We are located at: ${loc}`,
      nepaliSnippet: `हाम्रो पसल ${loc} मा अवस्थित छ।`,
    }
  }

  // 3. Phone
  if (containsAnyKeyword(clean, PHONE_KEYWORDS) && knowledge.businessPhone?.trim()) {
    const phone = knowledge.businessPhone.trim()
    return {
      matched: true,
      category: 'phone',
      title: '📞 Direct Contact / सम्पर्क नम्बर',
      answer: `You can reach us directly at: ${phone}`,
      nepaliSnippet: `सिधै सम्पर्कको लागि: ${phone}`,
    }
  }

  // 4. Hours
  if (containsAnyKeyword(clean, HOURS_KEYWORDS) && knowledge.businessHours?.trim()) {
    const hours = knowledge.businessHours.trim()
    return {
      matched: true,
      category: 'hours',
      title: '🕒 Business Hours / खुल्ने समय',
      answer: `Our business hours are: ${hours}`,
      nepaliSnippet: `खुल्ने तालिका: ${hours}`,
    }
  }

  // 5. Pricing
  if (containsAnyKeyword(clean, PRICING_KEYWORDS) && knowledge.catalogTags?.trim()) {
    const catalog = knowledge.catalogTags.trim()
    return {
      matched: true,
      category: 'pricing',
      title: '🏷️ Products & Pricing / उत्पादन र मूल्य',
      answer: `Available categories & pricing info: ${catalog}`,
      nepaliSnippet: `हाम्रा सामानहरू: ${catalog}`,
    }
  }

  // 6. Greeting
  if (containsAnyKeyword(clean, GREETING_KEYWORDS) && clean.length < 15) {
    const name = knowledge.displayName || 'our shop'
    return {
      matched: true,
      category: 'greeting',
      title: '👋 Welcome / स्वागत छ',
      answer: `Namaste! Welcome to ${name}. How can we help you today? Feel free to ask about our location, hours, or products.`,
      nepaliSnippet: `नमस्ते! ${name} मा स्वागत छ। के सहयोग गर्न सक्छौं?`,
    }
  }

  return null
}
