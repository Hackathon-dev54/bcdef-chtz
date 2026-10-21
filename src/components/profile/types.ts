import type { CustomFaq } from '../../lib/clientFaqBot'

export interface ProfileData {
  displayName: string
  handle: string
  accountType: 'personal' | 'business'
  bio: string
  businessCategory: string
  privacyMode: 'open' | 'pin_only' | 'closed'
  friendPin: string
  inquiryLetterboxEnabled: boolean
  instanceUrl: string
}

export interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  onProfileUpdated?: (updated: { displayName: string; accountType: 'personal' | 'business' }) => void
}

export type ProfileTab = 'account' | 'privacy' | 'hub' | 'edge'

export const BUSINESS_CATEGORIES = [
  'General & Personal Shop',
  'Clothing, Fashion & Apparel',
  'Restaurant, Cafe & Bakery',
  'Electronics, Mobiles & Tech',
  'Grocery, Kirana & Organics',
  'Handicrafts, Art & Culture',
  'Services, Freelance & Agency',
  'Hotel, Travel & Tourism',
]

export function faqsToEditableText(faqs: CustomFaq[]): string {
  if (!Array.isArray(faqs) || !faqs.length) return ''
  return faqs
    .map((f) => {
      const lines = [`Q: ${f.q}`, `A: ${f.a}`]
      if (f.keywords && f.keywords.length) lines.push(`K: ${f.keywords.join(', ')}`)
      return lines.join('\n')
    })
    .join('\n\n')
}
