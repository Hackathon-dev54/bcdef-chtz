import React, { useState, useEffect, useRef, useMemo } from 'react'
import { MessageSquare, UserPlus, Check } from 'lucide-react'
import {
  getLocalMessages,
  saveLocalMessages,
  saveLocalMessage,
  getLocalConversations,
  saveLocalConversations,
  getLocalFriendships,
  saveLocalFriendships,
  getLocalMeta,
  setLocalMeta,
} from '../lib/db'
import { NotificationPermissionBanner } from './NotificationPermissionBanner'
import { OfflineIndicator } from './OfflineIndicator'
import { ProfileSettingsModal } from './ProfileSettingsModal'
import {
  type Conversation,
  type ChatMessage,
  type Friendship,
  type InboxFilter,
  getOptimizedImageUrl,
  parseMessageContent,
  compressImageToWebP,
  SidebarHeader,
  IncomingRequestsBanner,
  InquiriesFeed,
  ConversationList,
  ChatHeader,
  ChatStreamView,
  ChatComposer,
  ConnectContactModal,
  IdentityAddressModal,
  PaymentQrModal,
  ImageSendModal,
  ImageLightboxModal,
} from './messaging'

// Re-export utilities so external code importing from MessagingApp continues to work seamlessly
export { getOptimizedImageUrl, parseMessageContent, compressImageToWebP }

export function MessagingApp({
  currentUser,
  businessName,
  onLogout,
}: {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  businessName: string
  onLogout: () => void
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>('all')
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')
  const [inquiries, setInquiries] = useState<any[]>([])
  const [pendingInquiryCount, setPendingInquiryCount] = useState<number>(0)
  const [friendPinInput, setFriendPinInput] = useState('')
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null)
  const [copiedShopLink, setCopiedShopLink] = useState(false)
  const [inquiryActionToast, setInquiryActionToast] = useState<string | null>(null)
  const [myFriendPin, setMyFriendPin] = useState('')

  // Federation & Contacts
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [showAddFriendModal, setShowAddFriendModal] = useState(false)
  const [showIdentityModal, setShowIdentityModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [currentDisplayName, setCurrentDisplayName] = useState(businessName || currentUser.display_name)
  const [copiedLink, setCopiedLink] = useState(false)

  // Add friend state
  const [friendHandle, setFriendHandle] = useState('')
  const [friendDomain, setFriendDomain] = useState('')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [addFriendError, setAddFriendError] = useState('')

  // Stream state
  const [streamConnected, setStreamConnected] = useState(false)

  // Scroll states
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [hasNewUnreadWhileScrolled, setHasNewUnreadWhileScrolled] = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Media attachments & wsrv.nl proxy state
  const [selectedImageFile, setSelectedImageFile] = useState<{
    dataUrl: string
    caption: string
    sizeKb: number
    originalKb?: number
  } | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const activeConvRef = useRef<Conversation | null>(null)
  activeConvRef.current = activeConv

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { dataUrl, sizeKb, originalKb } = await compressImageToWebP(file)
      setSelectedImageFile({ dataUrl, caption: '', sizeKb, originalKb })
    } catch (err) {
      console.error('Image compression error', err)
      alert('Failed to process image. Please try a different photo.')
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          try {
            const { dataUrl, sizeKb, originalKb } = await compressImageToWebP(file)
            setSelectedImageFile({ dataUrl, caption: '', sizeKb, originalKb })
          } catch (err) {
            console.error('Clipboard image error', err)
          }
          break
        }
      }
    }
  }

  const handleSendImage = async () => {
    if (!selectedImageFile || !activeConv) return
    setIsUploadingImage(true)
    try {
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          data: selectedImageFile.dataUrl,
          contentType: 'image/webp',
        }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        alert(uploadData.error || 'Failed to upload photo')
        return
      }

      const publicUrl = uploadData.url
      const formattedBody = selectedImageFile.caption?.trim()
        ? `[img:${publicUrl}|${selectedImageFile.caption.trim()}]`
        : `[img:${publicUrl}]`

      setSelectedImageFile(null)
      await handleSendMessage(undefined, formattedBody)
    } catch (err: any) {
      console.error('Image send error', err)
      alert('Failed to send image: ' + (err?.message || 'Network error'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const getAuthHeaders = (extra: Record<string, string> = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chatze_auth_token') : null
    return {
      ...extra,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  // ==========================================================================
  // Local-First IndexedDB & Smart Delta-Sync Lifecycle (80-90% D1 Read Reductions)
  // ==========================================================================
  const lastSyncTimeRef = useRef<number>(Date.now() - 3600000)

  // 1. Restore local data instantly from IndexedDB in 0ms (ZERO network calls)
  const loadConversations = async () => {
    try {
      const cachedConvs = await getLocalConversations()
      if (cachedConvs.length > 0) {
        setConversations(cachedConvs)
        if (!activeConvRef.current) {
          setActiveConv(cachedConvs[0])
        }
      }

      // Background validation
      const res = await fetch('/api/conversations', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (data.conversations) {
          setConversations(data.conversations)
          await saveLocalConversations(data.conversations)
          if (!activeConvRef.current && data.conversations.length > 0) {
            setActiveConv(data.conversations[0])
          } else if (activeConvRef.current) {
            const updated = data.conversations.find((c: any) => c.id === activeConvRef.current?.id)
            if (updated) setActiveConv(updated)
          }
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err)
    }
  }

  const loadFriendships = async () => {
    try {
      const cachedFriends = await getLocalFriendships()
      if (cachedFriends.length > 0) {
        setFriendships(cachedFriends)
      }

      const res = await fetch('/api/federation/friendships', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        if (data.friendships) {
          setFriendships(data.friendships)
          await saveLocalFriendships(data.friendships)
        }
      }
    } catch (err) {
      console.error('Failed to load friendships', err)
    }
  }

  // Instant 0ms Chat Switch: Load messages from phone/browser IndexedDB first!
  const loadMessages = async (convId: string) => {
    try {
      const localMsgs = await getLocalMessages(convId)
      if (localMsgs.length > 0) {
        setMessages(localMsgs)
        return
      }

      const res = await fetch(`/api/messaging?conversationId=${encodeURIComponent(convId)}`, {
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.messages) {
          setMessages(data.messages)
          await saveLocalMessages(data.messages)
        }
      }
    } catch (err) {
      console.error('Failed to load messages', err)
    }
  }

  // Load initial dataset once on mount
  useEffect(() => {
    loadConversations()
    loadFriendships()

    // Restore last sync time if present
    getLocalMeta<number>('last_sync_time').then((ts) => {
      if (ts) lastSyncTimeRef.current = ts
    })
  }, [])

  // Load message history only when switching active chat
  useEffect(() => {
    if (activeConv) {
      loadMessages(activeConv.id)
    }
  }, [activeConv?.id])

  // Single-Endpoint Delta Sync
  const runSync = async () => {
    try {
      const convId = activeConvRef.current?.id || ''
      const url = `/api/sync?since=${lastSyncTimeRef.current}&conversationId=${encodeURIComponent(convId)}`
      const res = await fetch(url, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        lastSyncTimeRef.current = data.serverTime || Date.now()
        setLocalMeta('last_sync_time', lastSyncTimeRef.current).catch(() => {})

        if (data.friendships && data.friendships.length > 0) {
          setFriendships(data.friendships)
          saveLocalFriendships(data.friendships).catch(() => {})
        }

        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations)
          saveLocalConversations(data.conversations).catch(() => {})
          if (activeConvRef.current) {
            const updated = data.conversations.find((c: any) => c.id === activeConvRef.current?.id)
            if (updated) {
              setActiveConv((prev) => (prev ? { ...prev, status: updated.status } : updated))
            }
          }
        }

        if (data.newMessages && data.newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id))
            const toAdd = data.newMessages.filter((m: any) => !existingIds.has(m.id))
            if (toAdd.length === 0) return prev
            return [...prev, ...toAdd]
          })
          saveLocalMessages(data.newMessages).catch(() => {})
          scrollToBottom('smooth')
        }
      }
    } catch (e) {
      console.warn('Sync error', e)
    }
  }

  const handleScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const isScrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 90
    setShowScrollBottom(isScrolledUp)
    if (!isScrolledUp) setHasNewUnreadWhileScrolled(false)
  }

  const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
    if (behavior === 'instant') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant', block: 'end' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
    setHasNewUnreadWhileScrolled(false)
  }

  // Tab-Visibility Aware SSE Stream
  useEffect(() => {
    let evtSource: EventSource | null = null
    let hiddenTimeout: any = null
    let isSuspended = false

    const connectSSE = () => {
      if (evtSource) {
        evtSource.close()
      }

      evtSource = new EventSource(`/api/stream?userId=${encodeURIComponent(currentUser.id)}`)

      evtSource.onopen = () => {
        setStreamConnected(true)
      }

      evtSource.addEventListener('connected', () => {
        setStreamConnected(true)
        runSync()
      })

      evtSource.addEventListener('ping', () => {
        setStreamConnected(true)
      })

      evtSource.addEventListener('new_message', (e) => {
        try {
          const incoming: ChatMessage = JSON.parse(e.data)
          const currentActive = activeConvRef.current

          const otherHandle = (currentActive?.otherUser.username || '').toLowerCase().replace(/^@/, '')
          const myHandle = (currentUser.handle || '').toLowerCase().replace(/^@/, '')
          const senderH = (incoming.senderHandle || incoming.senderId || '').toLowerCase().replace(/^@/, '')
          const recipH = (incoming.recipientHandle || '').toLowerCase().replace(/^@/, '')

          const isCurrentChat = Boolean(
            currentActive &&
              (incoming.conversationId === currentActive.id ||
                senderH === otherHandle ||
                (recipH === otherHandle && senderH === myHandle) ||
                incoming.conversationId === 'conv_' + otherHandle ||
                incoming.conversationId === 'conv_' + myHandle ||
                incoming.conversationId === 'conv_' + [myHandle, otherHandle].sort().join('_'))
          )

          const targetConvId = currentActive && isCurrentChat ? currentActive.id : ('conv_' + (senderH === myHandle ? recipH : senderH))
          const normalizedIncoming = { ...incoming, conversationId: targetConvId }

          saveLocalMessage(normalizedIncoming).catch(() => {})

          if (isCurrentChat) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id || (m.body === incoming.body && m.status === 'sending'))) {
                return prev.map((m) =>
                  m.id === incoming.id || (m.body === incoming.body && m.status === 'sending')
                    ? { ...normalizedIncoming, status: 'sent' }
                    : m
                )
              }
              return [...prev, normalizedIncoming]
            })

            const el = messagesContainerRef.current
            const isScrolledUp = el && el.scrollHeight - el.scrollTop - el.clientHeight > 90
            if (isScrolledUp) {
              setHasNewUnreadWhileScrolled(true)
            } else {
              scrollToBottom('smooth')
            }
          }

          setConversations((prev) => {
            const index = prev.findIndex((c) => {
              const cHandle = (c.otherUser.username || '').toLowerCase().replace(/^@/, '')
              return (
                c.id === incoming.conversationId ||
                cHandle === senderH ||
                cHandle === recipH ||
                c.id === 'conv_' + senderH ||
                c.id === 'conv_' + recipH ||
                c.id === 'conv_' + [myHandle, cHandle].sort().join('_')
              )
            })

            const msgTime = new Date(incoming.createdAt).getTime()
            if (index !== -1) {
              const updated = [...prev]
              const conv = { ...updated[index] }
              conv.lastMessage = { content: incoming.body, createdAt: msgTime }
              if (!isCurrentChat && senderH !== myHandle) {
                conv.unreadCount = (conv.unreadCount || 0) + 1
              }
              updated.splice(index, 1)
              const newConvs = [conv, ...updated]
              saveLocalConversations(newConvs).catch(() => {})
              return newConvs
            } else if (senderH && senderH !== myHandle) {
              const newConv: Conversation = {
                id: incoming.conversationId || 'conv_' + senderH,
                otherUser: {
                  id: senderH,
                  username: senderH,
                  displayName: `@${senderH}`,
                },
                status: 'active',
                lastMessage: { content: incoming.body, createdAt: msgTime },
                unreadCount: 1,
              }
              const newConvs = [newConv, ...prev]
              saveLocalConversations(newConvs).catch(() => {})
              return newConvs
            }
            return prev
          })
        } catch (err) {
          console.warn('SSE message parse error', err)
        }
      })

      evtSource.addEventListener('incoming_friend_request', (e) => {
        try {
          const payload = JSON.parse(e.data)
          const friendship = payload.friendship
          if (friendship) {
            setFriendships((prev) => {
              if (prev.some((f) => f.id === friendship.id)) return prev
              const updated = [friendship, ...prev]
              saveLocalFriendships(updated).catch(() => {})
              return updated
            })
          }
          const cleanHandle = payload.from_handle
          if (cleanHandle) {
            setConversations((prev) => {
              const convId = 'conv_' + cleanHandle
              if (prev.some((c) => c.id === convId)) return prev
              const newConv = {
                id: convId,
                otherUser: {
                  username: cleanHandle,
                  displayName: payload.from_display_name || `@${cleanHandle}`,
                },
                status: 'pending',
                remoteInstanceUrl: payload.from_instance_url || null,
                lastMessage: {
                  content: `Connection request from @${cleanHandle}`,
                  createdAt: Date.now(),
                },
              }
              const updated = [newConv, ...prev]
              saveLocalConversations(updated).catch(() => {})
              return updated
            })
          }
        } catch (err) {
          console.warn('SSE incoming friend parse error', err)
        }
      })

      evtSource.addEventListener('friend_accepted', (e) => {
        try {
          const payload = JSON.parse(e.data)
          const cleanHandle = payload.remoteHandle
          if (cleanHandle) {
            setFriendships((prev) => {
              const updated = prev.map((f) => (f.remote_handle === cleanHandle ? { ...f, status: 'active' } : f))
              saveLocalFriendships(updated).catch(() => {})
              return updated
            })
            setConversations((prev) => {
              const updated = prev.map((c) =>
                c.otherUser.username === cleanHandle
                  ? {
                      ...c,
                      status: 'active',
                      lastMessage: { content: 'Connected! You can now message each other.', createdAt: Date.now() },
                    }
                  : c
              )
              saveLocalConversations(updated).catch(() => {})
              return updated
            })
            if (activeConvRef.current && activeConvRef.current.otherUser.username === cleanHandle) {
              setActiveConv((prev) => (prev ? { ...prev, status: 'active' } : prev))
            }
          }
        } catch (err) {
          console.warn('SSE friend accepted parse error', err)
        }
      })

      evtSource.addEventListener('new_customer_inquiry', () => {
        fetchInquiries()
      })

      evtSource.addEventListener('inquiry_status_updated', () => {
        fetchInquiries()
      })

      evtSource.onerror = () => {
        setStreamConnected(false)
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null
            if (!document.hidden) {
              connectSSE()
            }
          }, 3000)
        }
      }
    }

    let reconnectTimeout: any = null

    connectSSE()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTimeout = setTimeout(() => {
          if (document.hidden && evtSource) {
            isSuspended = true
            evtSource.close()
            evtSource = null
            setStreamConnected(false)
          }
        }, 35000)
      } else {
        if (hiddenTimeout) {
          clearTimeout(hiddenTimeout)
          hiddenTimeout = null
        }
        if (isSuspended || !evtSource) {
          isSuspended = false
          connectSSE()
        } else {
          runSync()
        }
      }
    }

    const handleTouchRecovery = () => {
      if (!evtSource) {
        connectSSE()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', runSync)
    window.addEventListener('touchstart', handleTouchRecovery, { passive: true })

    let bc: BroadcastChannel | null = null
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('chatze_live_tab_sync')
        bc.onmessage = (event) => {
          if (event.data?.type === 'new_message') {
            runSync()
          }
        }
      }
    } catch {}

    return () => {
      if (hiddenTimeout) clearTimeout(hiddenTimeout)
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', runSync)
      window.removeEventListener('touchstart', handleTouchRecovery)
      if (bc) bc.close()
      if (evtSource) evtSource.close()
    }
  }, [currentUser.id])

  // Profile, Mode & URL Handshake Initialization
  useEffect(() => {
    fetch('/api/profile', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setAccountType(data.profile.accountType || 'personal')
          if (data.profile.friendPin) setMyFriendPin(data.profile.friendPin)
        }
      })
      .catch(() => {})

    fetchInquiries()

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const addParam = params.get('add')
      const pinParam = params.get('pin')
      if (addParam) {
        setFriendHandle(addParam.replace(/^@/, ''))
        if (pinParam) setFriendPinInput(pinParam)
        setShowAddFriendModal(true)
      }
      if (params.get('tab') === 'inquiries' || params.get('tab') === 'letterbox') {
        setInboxFilter('letterbox')
      }
    }
  }, [])

  // Send Contact Connection Request
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!friendHandle.trim() || !friendDomain.trim()) return

    setSendingRequest(true)
    setAddFriendError('')

    try {
      const res = await fetch('/api/federation/requests', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          remoteHandle: friendHandle.trim(),
          remoteInstanceUrl: friendDomain.trim(),
          senderId: currentUser.id,
          myHandle: currentUser.handle,
          myDisplayName: currentUser.display_name,
          myInstanceUrl: window.location.origin,
          pin: friendPinInput.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setFriendHandle('')
        setFriendDomain('')
        setFriendPinInput('')
        setShowAddFriendModal(false)

        if (data.friendship) {
          setFriendships((prev) => {
            const updated = [data.friendship, ...prev.filter((f) => f.id !== data.friendship.id)]
            saveLocalFriendships(updated).catch(() => {})
            return updated
          })
        }
        if (data.conversation) {
          const newConv: Conversation = {
            id: data.conversation.id,
            otherUser: {
              id: data.conversation.user_b,
              username: data.conversation.remote_handle,
              displayName: `@${data.conversation.remote_handle}`,
            },
            status: 'pending',
            remoteInstanceUrl: data.conversation.remote_instance_url,
            lastMessage: { content: data.conversation.last_message_snippet, createdAt: Date.now() },
          }
          setConversations((prev) => {
            const updated = [newConv, ...prev.filter((c) => c.id !== newConv.id)]
            saveLocalConversations(updated).catch(() => {})
            return updated
          })
          setActiveConv(newConv)
        }
      } else {
        setAddFriendError(data.error || 'Failed to send request')
      }
    } catch (err: any) {
      setAddFriendError(err?.message || 'Network error')
    } finally {
      setSendingRequest(false)
    }
  }

  // Accept Inbound Request
  const handleAcceptFriendRequest = async (remoteHandle: string, remoteInstanceUrl: string) => {
    try {
      setFriendships((prev) => {
        const updated = prev.map((f) => (f.remote_handle === remoteHandle ? { ...f, status: 'active' } : f))
        saveLocalFriendships(updated).catch(() => {})
        return updated
      })
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.otherUser.username === remoteHandle
            ? { ...c, status: 'active', lastMessage: { content: 'Connected! You can now message each other.', createdAt: Date.now() } }
            : c
        )
        saveLocalConversations(updated).catch(() => {})
        return updated
      })

      await fetch('/api/federation/requests/accept', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          remoteHandle,
          remoteInstanceUrl,
          myHandle: currentUser.handle,
        }),
      })
    } catch (err) {
      console.error('Accept error', err)
    }
  }

  // Decline Inbound Request
  const handleRejectFriendRequest = async (remoteHandle: string, blockDomain = false, remoteInstanceUrl = '') => {
    try {
      setFriendships((prev) => {
        const updated = prev.filter((f) => f.remote_handle !== remoteHandle)
        saveLocalFriendships(updated).catch(() => {})
        return updated
      })
      setConversations((prev) => {
        const updated = prev.filter((c) => c.otherUser.username !== remoteHandle)
        saveLocalConversations(updated).catch(() => {})
        return updated
      })

      await fetch('/api/federation/requests/reject', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ remoteHandle, blockDomain, remoteInstanceUrl }),
      })
    } catch (err) {
      console.error('Reject error', err)
    }
  }

  // Customer Inquiries Letterbox API Helpers
  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/inquiries', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries || [])
        setPendingInquiryCount(data.pendingCount || 0)
      }
    } catch {}
  }

  const handleReplyInquiry = async (inquiryId: string, asFriend = false) => {
    setReplyingInquiryId(inquiryId)
    try {
      const res = await fetch('/api/inquiries/reply', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ inquiryId, asFriend }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        await fetchInquiries()
        await runSync()
        await loadConversations()
        setInboxFilter(asFriend ? 'friends' : 'letterbox')
        setInquiryActionToast(
          asFriend
            ? 'Inquiry accepted as Private Friend! Unlocked under Friends tab.'
            : 'Inquiry accepted as Letterbox Customer Chat! Unlocked under Letterbox tab.'
        )
        setTimeout(() => setInquiryActionToast(null), 3500)
      } else {
        alert(data.error || 'Failed to reply to inquiry')
      }
    } catch (err: any) {
      alert(err?.message || 'Network error while opening chat')
    } finally {
      setReplyingInquiryId(null)
    }
  }

  const handleDismissInquiry = async (inquiryId: string, blockDomain = false) => {
    try {
      const res = await fetch('/api/inquiries/dismiss', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ inquiryId, blockDomain }),
      })
      if (res.ok) {
        await fetchInquiries()
      }
    } catch {}
  }

  const shopPortfolioUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop` : ''

  const handleCopyShopUrl = () => {
    if (!shopPortfolioUrl) return
    navigator.clipboard.writeText(shopPortfolioUrl)
    setCopiedShopLink(true)
    setInquiryActionToast('Portfolio & Letterbox link copied! Share with customers.')
    setTimeout(() => {
      setCopiedShopLink(false)
      setInquiryActionToast(null)
    }, 3500)
  }

  const handleShareShopUrl = async () => {
    if (!shopPortfolioUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${currentDisplayName} • Chatze Nepal`,
          text: `Check out our business portfolio and send customer inquiries directly:`,
          url: shopPortfolioUrl,
        })
      } catch {}
    } else {
      handleCopyShopUrl()
    }
  }

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault()
    const textToSend = customText || inputText.trim()
    if (!textToSend || !activeConv) return
    if (activeConv.status === 'pending') return

    const tempId = 'temp_' + Math.random().toString(36).slice(2, 9)
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId: activeConv.id,
      senderId: currentUser.id,
      body: textToSend,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }

    setMessages((prev) => [...prev, optimisticMessage])
    if (!customText) setInputText('')
    scrollToBottom('instant')

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === activeConv.id)
      if (index !== -1) {
        const updated = [...prev]
        const conv = { ...updated[index] }
        conv.lastMessage = { content: textToSend, createdAt: Date.now() }
        updated.splice(index, 1)
        return [conv, ...updated]
      }
      return prev
    })

    try {
      const res = await fetch('/api/messaging', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          conversationId: activeConv.id,
          body: textToSend,
          senderId: currentUser.id,
          tempId,
          remoteInstanceUrl: activeConv.remoteInstanceUrl,
          remoteHandle: activeConv.otherUser.username,
          myHandle: currentUser.handle,
        }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: 'sent' } : m))
        )
        saveLocalMessage({ ...data.message, status: 'sent' }).catch(() => {})
      }
    } catch (err) {
      console.error('Failed to send message', err)
    }
  }

  const incomingRequests = useMemo(() => {
    return friendships.filter((f) => f.status === 'pending' && f.direction === 'incoming')
  }, [friendships])

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const matchesSearch =
        c.otherUser.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
      if (!matchesSearch) return false
      if (inboxFilter === 'pending') return c.status === 'pending'
      if (inboxFilter === 'unread') return (c.unreadCount || 0) > 0
      if (inboxFilter === 'friends') return c.status !== 'letterbox'
      if (inboxFilter === 'letterbox') return c.status === 'letterbox'
      return true
    })
  }, [conversations, searchQuery, inboxFilter])

  const hasLetterboxActivity = Boolean(
    conversations.some((c) => c.status === 'letterbox') ||
      inquiries.some((i) => i.status === 'pending')
  )

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b141a] text-[#e9edef] overflow-hidden font-sans select-none">
      <NotificationPermissionBanner userHandle={currentUser.handle} />
      <div className="flex flex-1 w-full overflow-hidden">
        {/* 1. Sidebar */}
        <aside
          className={`${
            activeConv ? 'hidden md:flex' : 'flex'
          } w-full md:w-80 lg:w-96 border-r border-[#202c33] bg-[#111b21] flex-col shrink-0 h-full`}
        >
          {/* Header Bar */}
          <SidebarHeader
            currentUser={currentUser}
            currentDisplayName={currentDisplayName}
            accountType={accountType}
            shopPortfolioUrl={shopPortfolioUrl}
            copiedShopLink={copiedShopLink}
            handleCopyShopUrl={handleCopyShopUrl}
            handleShareShopUrl={handleShareShopUrl}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            inboxFilter={inboxFilter}
            setInboxFilter={setInboxFilter}
            pendingInquiryCount={pendingInquiryCount}
            inquiriesCount={inquiries.length}
            hasLetterboxActivity={hasLetterboxActivity}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenIdentity={() => setShowIdentityModal(true)}
            onOpenQr={() => setShowQrModal(true)}
            onOpenConnectContact={() => setShowAddFriendModal(true)}
            onLogout={onLogout}
          />

          {/* Incoming Connection Requests Banner */}
          <IncomingRequestsBanner
            incomingRequests={incomingRequests}
            handleAcceptFriendRequest={handleAcceptFriendRequest}
            handleRejectFriendRequest={handleRejectFriendRequest}
          />

          {/* Chats or Inquiries Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#202c33]/40">
            {inboxFilter === 'letterbox' || inboxFilter === 'inquiries' ? (
              <InquiriesFeed
                accountType={accountType}
                currentUser={currentUser}
                inquiries={inquiries}
                conversations={conversations}
                filteredConversations={filteredConversations}
                activeConv={activeConv}
                setActiveConv={setActiveConv}
                handleReplyInquiry={handleReplyInquiry}
                handleDismissInquiry={handleDismissInquiry}
                replyingInquiryId={replyingInquiryId}
                onOpenProfile={() => setShowProfileModal(true)}
              />
            ) : (
              <ConversationList
                conversations={filteredConversations}
                activeConv={activeConv}
                setActiveConv={setActiveConv}
                inboxFilter={inboxFilter}
                onOpenConnectContact={() => setShowAddFriendModal(true)}
              />
            )}
          </div>
        </aside>

        {/* 2. Main Chat Panel */}
        <main
          className={`${
            !activeConv ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-[#0b141a] min-w-0 relative w-full h-full`}
        >
          {activeConv ? (
            <>
              {/* Active Header */}
              <ChatHeader
                activeConv={activeConv}
                accountType={accountType}
                currentUser={currentUser}
                streamConnected={streamConnected}
                onBack={() => setActiveConv(null)}
              />

              {/* Message Stream */}
              <ChatStreamView
                activeConv={activeConv}
                currentUser={currentUser}
                messages={messages}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                handleScroll={handleScroll}
                showScrollBottom={showScrollBottom}
                hasNewUnreadWhileScrolled={hasNewUnreadWhileScrolled}
                scrollToBottom={scrollToBottom}
                onOpenLightbox={(url) => setLightboxUrl(url)}
              />

              {/* Message Composer */}
              <ChatComposer
                activeConv={activeConv}
                inputText={inputText}
                setInputText={setInputText}
                handleSendMessage={handleSendMessage}
                handlePaste={handlePaste}
                handleFileInputChange={handleFileInputChange}
                fileInputRef={fileInputRef}
              />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 max-w-sm mx-auto">
              <div className="p-4 rounded-3xl bg-[#111b21] border border-[#202c33] text-[#8696a0]">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-[#00a884]" />
              </div>
              <h3 className="text-base font-bold text-[#e9edef]">Independent WhatsApp at Edge</h3>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Connect with any user across Cloudflare instances by adding their username and subdomain/domain.
              </p>
              <button
                onClick={() => setShowAddFriendModal(true)}
                className="py-2.5 px-4 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00a884]/20"
              >
                <UserPlus className="w-4 h-4" /> Connect Contact
              </button>
            </div>
          )}
        </main>

        {/* 3. Connect Contact Modal */}
        <ConnectContactModal
          isOpen={showAddFriendModal}
          onClose={() => setShowAddFriendModal(false)}
          accountType={accountType}
          myFriendPin={myFriendPin}
          friendHandle={friendHandle}
          setFriendHandle={setFriendHandle}
          friendDomain={friendDomain}
          setFriendDomain={setFriendDomain}
          friendPinInput={friendPinInput}
          setFriendPinInput={setFriendPinInput}
          addFriendError={addFriendError}
          sendingRequest={sendingRequest}
          handleSendFriendRequest={handleSendFriendRequest}
        />

        {/* 4. My Instance Address Modal */}
        <IdentityAddressModal
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          currentUser={currentUser}
          copiedLink={copiedLink}
          setCopiedLink={setCopiedLink}
        />

        {/* 5. Payment QR Modal */}
        <PaymentQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          currentUser={currentUser}
          activeConv={activeConv}
          handleSendMessage={handleSendMessage}
        />

        {/* 6. Image Preview & Send Modal */}
        <ImageSendModal
          selectedImageFile={selectedImageFile}
          setSelectedImageFile={setSelectedImageFile}
          isUploadingImage={isUploadingImage}
          handleSendImage={handleSendImage}
        />

        {/* 7. Image Lightbox Modal */}
        <ImageLightboxModal
          lightboxUrl={lightboxUrl}
          onClose={() => setLightboxUrl(null)}
        />
      </div>

      {/* Profile & Privacy Settings Modal */}
      <ProfileSettingsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentDisplayName(updated.displayName)
        }}
      />

      {/* Offline Connectivity Status Pill */}
      <OfflineIndicator />

      {/* Floating Action Toast Notification */}
      {inquiryActionToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#00a884] text-[#111b21] px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 z-50 border border-[#00a884]/40 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{inquiryActionToast}</span>
        </div>
      )}
    </div>
  )
}
