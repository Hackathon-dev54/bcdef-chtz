import React, { useState, useEffect, useRef } from 'react'
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
} from '../../../lib/db'
import { getAuthHeaders } from '../authUtils'
import { Conversation, ChatMessage, Friendship } from '../types'

export function useMessagingSync({
  currentUser,
  onNewInquiry,
  scrollToBottom,
  setHasNewUnreadWhileScrolled,
  messagesContainerRef,
}: {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  onNewInquiry: () => void
  scrollToBottom: (behavior?: 'smooth' | 'instant') => void
  setHasNewUnreadWhileScrolled: (val: boolean) => void
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [streamConnected, setStreamConnected] = useState(false)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('chatze_presence_online') !== 'false'
  })

  const togglePresence = () => {
    setIsOnline((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('chatze_presence_online', String(next))
      }
      return next
    })
  }

  const activeConvRef = useRef<Conversation | null>(null)
  activeConvRef.current = activeConv

  const onNewInquiryRef = useRef(onNewInquiry)
  onNewInquiryRef.current = onNewInquiry

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

  // Tab-Visibility & Presence Aware SSE Stream
  useEffect(() => {
    if (!isOnline) {
      setStreamConnected(false)
      return
    }

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
        onNewInquiryRef.current()
      })

      evtSource.addEventListener('inquiry_status_updated', () => {
        onNewInquiryRef.current()
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
  }, [currentUser.id, isOnline])

  // Send Message
  const handleSendMessage = async (
    textToSend: string,
    onSuccessCallback?: () => void
  ) => {
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
    if (onSuccessCallback) onSuccessCallback()
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

  return {
    conversations,
    setConversations,
    activeConv,
    setActiveConv,
    messages,
    setMessages,
    friendships,
    setFriendships,
    streamConnected,
    loadConversations,
    loadFriendships,
    loadMessages,
    runSync,
    handleSendMessage,
    activeConvRef,
    isOnline,
    togglePresence,
  }
}
