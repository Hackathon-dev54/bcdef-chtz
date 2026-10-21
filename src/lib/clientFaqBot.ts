// SPDX-License-Identifier: Elastic-2.0
// Copyright (c) 2026 Chatze Contributors (https://github.com/Hackathon-dev54/bcdef-chtz)

/**
 * Client-Side Zero-Invocation Deflection & FAQ Bot
 * Runs 100% locally in the visitor's browser with zero network hits,
 * zero Worker invocations, and zero D1 database reads/writes.
 */

export interface ShopKnowledge {
  displayName?: string
  businessLocation?: string
  businessPhone?: string
  businessHours?: string
  deliveryInfo?: string
  catalogTags?: string
  bio?: string
}

export interface BotMatchResult {
  matched: boolean
  category?: 'location' | 'phone' | 'hours' | 'delivery' | 'pricing' | 'greeting'
  title: string
  answer: string
  nepaliSnippet?: string
}

const LOCATION_KEYWORDS = [
  'location', 'where', 'address', 'shop', 'store', 'direction', 'map', 'thikana',
  'kaha', 'kaha ho', 'kata', 'kata cha', 'कहाँ', 'ठेगाना', 'कहाँ छ', 'कता छ'
]

const PHONE_KEYWORDS = [
  'phone', 'number', 'contact', 'call', 'mobile', 'whatsapp', 'viber',
  'number dinus', 'fon', 'फोन', 'नम्बर', 'सम्पर्क', 'कल'
]

const HOURS_KEYWORDS = [
  'hour', 'time', 'timing', 'open', 'close', 'opening', 'closing', 'today', 'sunday', 'saturday',
  'kahile khulcha', 'khulla', 'समय', 'खुल्ने समय', 'कहिले खुल्छ', 'बन्द'
]

const DELIVERY_KEYWORDS = [
  'delivery', 'shipping', 'courier', 'send', 'pathao', 'inDrive', 'kathmandu bahira',
  'delivery huncha', 'home delivery', 'डेलिभरी', 'पठाउनुहुन्छ', 'सामान'
]

const PRICING_KEYWORDS = [
  'price', 'cost', 'rate', 'how much', 'kati ho', 'kati parcha', 'kati', 'mulyo',
  'मूल्य', 'कति हो', 'कति पर्छ', 'रेट'
]

const GREETING_KEYWORDS = [
  'hi', 'hello', 'namaste', 'hey', 'salam', 'hola', 'नमस्ते', 'हेलो'
]

function containsAnyKeyword(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase()
  return keywords.some((kw) => normalized.includes(kw.toLowerCase()))
}

export function evaluateClientFaq(
  query: string,
  knowledge: ShopKnowledge
): BotMatchResult | null {
  if (!query || query.trim().length < 2) return null
  const clean = query.trim().toLowerCase()

  // 1. Location / Address Match
  if (containsAnyKeyword(clean, LOCATION_KEYWORDS)) {
    const loc = knowledge.businessLocation?.trim()
    if (loc) {
      return {
        matched: true,
        category: 'location',
        title: '📍 Store Location / पसलको ठेगाना',
        answer: `We are located at: ${loc}`,
        nepaliSnippet: `हाम्रो पसल ${loc} मा अवस्थित छ।`,
      }
    }
  }

  // 2. Phone / Contact Match
  if (containsAnyKeyword(clean, PHONE_KEYWORDS)) {
    const phone = knowledge.businessPhone?.trim()
    if (phone) {
      return {
        matched: true,
        category: 'phone',
        title: '📞 Direct Contact / सम्पर्क नम्बर',
        answer: `You can reach us directly at: ${phone}`,
        nepaliSnippet: `सिधै सम्पर्कको लागि: ${phone}`,
      }
    }
  }

  // 3. Opening Hours Match
  if (containsAnyKeyword(clean, HOURS_KEYWORDS)) {
    const hours = knowledge.businessHours?.trim()
    if (hours) {
      return {
        matched: true,
        category: 'hours',
        title: '🕒 Business Hours / खुल्ने समय',
        answer: `Our business hours are: ${hours}`,
        nepaliSnippet: `खुल्ने तालिका: ${hours}`,
      }
    }
  }

  // 4. Delivery & Shipping Match
  if (containsAnyKeyword(clean, DELIVERY_KEYWORDS)) {
    const delivery = knowledge.deliveryInfo?.trim()
    if (delivery) {
      return {
        matched: true,
        category: 'delivery',
        title: '🚚 Delivery Policy / डेलिभरी जानकारी',
        answer: delivery,
        nepaliSnippet: `डेलिभरी सेवा उपलब्ध छ: ${delivery}`,
      }
    }
  }

  // 5. Pricing / Catalog Match
  if (containsAnyKeyword(clean, PRICING_KEYWORDS)) {
    const catalog = knowledge.catalogTags?.trim()
    if (catalog) {
      return {
        matched: true,
        category: 'pricing',
        title: '🏷️ Products & Pricing / उत्पादन र मूल्य',
        answer: `Available categories & pricing info: ${catalog}`,
        nepaliSnippet: `हाम्रा सामानहरू: ${catalog}`,
      }
    }
  }

  // 6. Friendly Greeting Match
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
