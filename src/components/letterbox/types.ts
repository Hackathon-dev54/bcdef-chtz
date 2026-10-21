import type { CustomFaq } from '../../lib/clientFaqBot'

export interface ShopProfile {
  displayName: string
  handle: string
  accountType: string
  bio: string
  businessCategory: string
  businessPhone?: string
  businessLocation?: string
  businessHours?: string
  deliveryInfo?: string
  catalogTags?: string
  inquiryLetterboxEnabled: boolean
  hubListed?: boolean
  hubNodeId?: string
  customFaqs?: CustomFaq[]
}

export interface CustomerInquiryPageProps {
  shopHandle?: string
  currentUser?: { id: string; handle: string; display_name: string; role?: string } | null
  onSwitchToOwnerLogin: () => void
  onGoToApp?: () => void
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderHandle?: string
  recipientHandle?: string
  body: string
  createdAt: string
  readAt?: string | null
  status?: 'sending' | 'sent'
}

export interface InquiryCategory {
  id: string
  label: string
  hint: string
}

export const INQUIRY_CATEGORIES: InquiryCategory[] = [
  { id: 'price_stock', label: '🏷️ Price & Stock', hint: 'Ask about sizing, color or pricing' },
  { id: 'delivery', label: '🚚 Delivery & Location', hint: 'Delivery time to your city or valley' },
  { id: 'wholesale', label: '📦 Wholesale / Bulk', hint: 'Special pricing for bulk orders' },
  { id: 'general', label: '❓ General Question', hint: 'Custom inquiry or general request' },
]

export const QUICK_PROMPTS = [
  '📦 Can you confirm current stock and available colors?',
  '🚚 What is the delivery time and cost to Kathmandu?',
  '💳 Please share your payment QR code (eSewa / Fonepay)',
  '📍 What is your physical store address?',
]
