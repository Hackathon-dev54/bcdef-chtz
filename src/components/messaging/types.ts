export interface Conversation {
  id: string
  otherUser: { id?: string; username: string; displayName: string }
  status?: string // 'active' | 'pending' | 'archived' | 'letterbox'
  remoteInstanceUrl?: string | null
  lastMessage?: { content: string; createdAt: number } | null
  unreadCount?: number
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
  status?: 'sending' | 'sent' | 'delivered'
}

export interface Friendship {
  id: string
  local_user_id: string
  remote_handle: string
  remote_instance_url: string
  status: string // 'pending' | 'active' | 'rejected'
  direction: 'incoming' | 'outgoing'
  created_at: number
}

export interface ParsedMessage {
  isImage: boolean
  imageUrl?: string
  caption?: string
  text?: string
}

export type InboxFilter = 'all' | 'unread' | 'pending' | 'friends' | 'letterbox' | 'inquiries'

export const UNIVERSAL_QUICK_REPLIES = [
  { label: '👋 Hey there!', text: '👋 Hey! How are you doing?' },
  { label: '📍 Share Location', text: '📍 Meeting point / current location shared.' },
  { label: '✅ Sounds good!', text: '✅ Sounds great, let’s do that!' },
  { label: '📞 Call me later', text: '📞 A bit busy right now, call you in a bit.' },
  { label: '💳 Payment QR', text: '💳 Payment QR: eSewa, Khalti, or mobile banking accepted.' },
]
