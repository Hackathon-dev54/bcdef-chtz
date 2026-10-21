import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Compass,
  X,
} from 'lucide-react'
import { CHATZE_HUB_URL } from '../lib/hubConfig'
import { evaluateClientFaq } from '../lib/clientFaqBot'
import { compressImageToWebP } from './MessagingApp'

// Modular subcomponents & types
import type { ShopProfile, CustomerInquiryPageProps, ChatMessage } from './letterbox/types'
import { playGentleChime } from './letterbox/audio'
import { LetterboxHeader } from './letterbox/LetterboxHeader'
import { LetterboxAuthRequired } from './letterbox/LetterboxAuthRequired'
import { LetterboxLiveChat } from './letterbox/LetterboxLiveChat'
import { LetterboxPendingCard } from './letterbox/LetterboxPendingCard'
import { LetterboxCompositionForm } from './letterbox/LetterboxCompositionForm'

export function CustomerInquiryPage({
  shopHandle = 'admin',
  currentUser = null,
  onSwitchToOwnerLogin,
  onGoToApp,
}: CustomerInquiryPageProps) {
  const [profile, setProfile] = useState<ShopProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [authedUser, setAuthedUser] = useState<any>(currentUser)
  const [selectedCategory, setSelectedCategory] = useState('🏷️ Price & Stock')
  const [senderName, setSenderName] = useState(currentUser?.display_name || '')
  const [senderContact, setSenderContact] = useState(currentUser?.handle ? `@${currentUser.handle}` : '')
  const [senderEmail, setSenderEmail] = useState('')
  const [sovereignNode, setSovereignNode] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [existingInquiry, setExistingInquiry] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedShare, setCopiedShare] = useState(false)

  // Live Chat state once inquiry is accepted
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [isNoteExpanded, setIsNoteExpanded] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Zero-Invocation FAQ Deflection Bot (Evaluated 100% locally in visitor browser)
  const botMatch = useMemo(() => {
    if (!profile) return null
    return evaluateClientFaq(noteContent, {
      displayName: profile.displayName,
      businessLocation: profile.businessLocation,
      businessPhone: profile.businessPhone,
      businessHours: profile.businessHours,
      deliveryInfo: profile.deliveryInfo,
      catalogTags: profile.catalogTags,
      bio: profile.bio,
      customFaqs: profile.customFaqs || [],
    })
  }, [noteContent, profile])

  // Quick chips: merchant's own FAQs first, otherwise built-in defaults
  const faqChips = useMemo(() => {
    const custom = profile?.customFaqs || []
    if (custom.length) {
      return custom.slice(0, 6).map((f) => ({
        label: f.q.length > 32 ? `${f.q.slice(0, 30)}…` : f.q,
        query: f.q,
      }))
    }
    return [
      { label: '📍 Store Location?', query: 'Where is your store located?' },
      { label: '🕒 Opening Hours?', query: 'What are your opening hours?' },
      { label: '🚚 Delivery Details?', query: 'Do you deliver inside or outside valley?' },
      { label: '📞 Phone Number?', query: 'What is your contact phone number?' },
    ]
  }, [profile?.customFaqs])

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Redirect state for direct browser visits (must go through Chatze Hub unless explicitly opened with embed param)
  const [redirectCountdown, setRedirectCountdown] = useState(3)

  // Embedding context detection
  const isIframe = typeof window !== 'undefined' && window.self !== window.top
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isChatzeHubEmbed = urlParams?.get('embed') === 'chatze_hub'

  // The official deployed Chatze Hub gateway target URL for redirection
  const hubRedirectUrl = `${CHATZE_HUB_URL}/?shop=${encodeURIComponent(shopHandle)}&target=letterbox`

  // Scroll to bottom of messages container
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      })
    }
  }

  // 1. Direct browser visit redirection countdown (only when completely outside Hub embed context)
  useEffect(() => {
    if (!isIframe && !isChatzeHubEmbed) {
      const timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            if (typeof window !== 'undefined') {
              window.location.href = hubRedirectUrl
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isIframe, isChatzeHubEmbed, hubRedirectUrl])

  // 2. Load shop profile & detect existing auth session & existing inquiries
  useEffect(() => {
    async function loadData() {
      let resolvedUser: any = currentUser

      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setProfile(data.profile)
          }
        }

        // Check URL query params passed from Chatze Hub embed
        const hubUserName = urlParams?.get('hub_user_name')
        const hubUserEmail = urlParams?.get('hub_user_email')
        const hubSovereignNode = urlParams?.get('hub_sovereign_node')
        const hubSovereignHandle = urlParams?.get('hub_sovereign_handle')
        const hubToken = urlParams?.get('hub_token')

        if (hubUserName && !resolvedUser) {
          const generatedHandle =
            hubSovereignHandle ||
            (hubUserEmail ? hubUserEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : null) ||
            hubUserName.toLowerCase().replace(/[^a-z0-9_]/g, '_')

          const hubAuthedUser = {
            id: `usr_hub_${(hubUserEmail || hubUserName).replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
            handle: generatedHandle,
            display_name: hubUserName,
            email: hubUserEmail || undefined,
            sovereign_node_url: hubSovereignNode || undefined,
            is_hub_user: true,
          }
          resolvedUser = hubAuthedUser
          setAuthedUser(hubAuthedUser)
          setSenderName(hubUserName)
          if (hubUserEmail) setSenderEmail(hubUserEmail)
          if (hubSovereignNode) setSovereignNode(hubSovereignNode)
          setSenderContact(hubSovereignHandle ? `@${hubSovereignHandle}` : (hubUserEmail || `@${generatedHandle}`))
        }

        const localToken = localStorage.getItem('chatze_auth_token') || hubToken
        if (!resolvedUser && localToken) {
          try {
            const sRes = await fetch('/api/auth/session', {
              headers: { Authorization: `Bearer ${localToken}` },
            })
            if (sRes.ok) {
              const sData = await sRes.json()
              if (sData.user) {
                resolvedUser = sData.user
                setAuthedUser(sData.user)
                if (!senderName) setSenderName(sData.user.display_name)
                if (!senderContact) setSenderContact(`@${sData.user.handle}`)
              }
            }
          } catch {}
        }

        // Customer handle & identity resolution
        const storedInquiryId = localStorage.getItem(`chatze_inq_id_${shopHandle}`) || localStorage.getItem(`chatze_inquiry_id_${shopHandle}`)
        const storedHandle = localStorage.getItem(`chatze_inq_handle_${shopHandle}`)
        const storedUserId = localStorage.getItem(`chatze_inq_user_${shopHandle}`)

        const effectiveCustomerHandle =
          resolvedUser?.handle ||
          hubSovereignHandle ||
          (hubUserEmail ? hubUserEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : null) ||
          storedHandle ||
          (resolvedUser?.display_name ? resolvedUser.display_name.toLowerCase().replace(/[^a-z0-9_]/g, '') : null)

        const effectiveCustomerUserId = resolvedUser?.id || storedUserId || ''

        // Check if there is an active inquiry for this customer
        const inqQueryParams = new URLSearchParams()
        if (effectiveCustomerHandle) inqQueryParams.set('handle', effectiveCustomerHandle)
        if (effectiveCustomerUserId) inqQueryParams.set('userId', effectiveCustomerUserId)
        if (storedInquiryId) inqQueryParams.set('inquiryId', storedInquiryId)

        const inqRes = await fetch(`/api/inquiries?${inqQueryParams.toString()}`)
        if (inqRes.ok) {
          const inqData = await inqRes.json()
          if (inqData.inquiries && inqData.inquiries.length > 0) {
            const myNote =
              inqData.inquiries.find((i: any) => i.id === storedInquiryId) ||
              inqData.inquiries.find(
                (i: any) =>
                  i.sender_handle === effectiveCustomerHandle ||
                  (effectiveCustomerUserId && i.sender_user_id === effectiveCustomerUserId)
              ) ||
              inqData.inquiries[0]

            if (myNote) {
              setExistingInquiry(myNote)
              setSubmitted(true)

              // Check conversation messages
              const convId = myNote.conversation_id || `conv_${myNote.sender_handle}`
              loadConversationMessages(convId)
            } else if (effectiveCustomerHandle) {
              loadConversationMessages(`conv_${effectiveCustomerHandle}`)
            }
          } else if (effectiveCustomerHandle) {
            loadConversationMessages(`conv_${effectiveCustomerHandle}`)
          }
        }
      } catch (e) {
        console.warn('Failed to load shop or inquiry data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [shopHandle, currentUser])

  // Helper to fetch conversation messages and auto-unlock live chat if messages exist
  const loadConversationMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/messaging?conversationId=${encodeURIComponent(convId)}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(
            data.messages.map((m: any) => ({
              ...m,
              status: 'sent',
            }))
          )
          setSubmitted(true)
          setExistingInquiry((prev: any) => ({
            ...(prev || {
              id: convId,
              category: 'Customer Inquiry',
              content: data.messages[0]?.body || 'Inquiry conversation',
              created_at: Date.now(),
            }),
            status: 'accepted',
            conversation_id: convId,
          }))
          return data.messages
        }
      }
    } catch (e) {
      console.warn('Failed to fetch messages', e)
    }
    return []
  }

  // 3. Real-Time SSE Stream Connection for instant inquiry status updates and live messages
  useEffect(() => {
    const customerHandle =
      authedUser?.handle ||
      existingInquiry?.sender_handle ||
      urlParams?.get('hub_sovereign_handle') ||
      (urlParams?.get('hub_user_email') ? urlParams.get('hub_user_email')!.split('@')[0] : 'guest')

    const customerUserId = authedUser?.id || existingInquiry?.sender_user_id || `usr_${customerHandle}`
    const activeConvId = existingInquiry?.conversation_id || `conv_${customerHandle}`

    let es: EventSource | null = null

    try {
      es = new EventSource(`/api/stream?userId=${encodeURIComponent(customerUserId)}`)

      // Inquiry status updated event (Merchant clicked Accept or Add Friend)
      es.addEventListener('inquiry_status_updated', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data)
          const targetConv = payload.conversationId || activeConvId
          const isMatch =
            !existingInquiry ||
            payload.inquiryId === existingInquiry.id ||
            payload.conversationId === activeConvId ||
            (payload.customerHandle && payload.customerHandle.toLowerCase() === customerHandle.toLowerCase())

          if (isMatch) {
            setExistingInquiry((prev: any) => ({
              ...(prev || {
                id: targetConv,
                sender_handle: customerHandle,
                category: 'Customer Inquiry',
                content: 'Inquiry note',
                created_at: Date.now(),
              }),
              status: payload.status,
              conversation_id: targetConv,
            }))
            setSubmitted(true)

            if (payload.status === 'accepted') {
              loadConversationMessages(targetConv)
              if (soundEnabled) playGentleChime()
            }
          }
        } catch (err) {
          console.warn('SSE inquiry_status_updated parse error', err)
        }
      })

      // New message received event: Automatically unlocks live chatbox
      es.addEventListener('new_message', (e: MessageEvent) => {
        try {
          const incoming = JSON.parse(e.data)
          const targetConv = existingInquiry?.conversation_id || activeConvId
          const cleanSender = (incoming.senderHandle || incoming.senderId || '').replace(/^@/, '').toLowerCase()

          // Check if message belongs to this customer's conversation
          if (
            incoming.conversationId === targetConv ||
            incoming.conversationId === `conv_${customerHandle}` ||
            incoming.recipientHandle === customerHandle ||
            cleanSender === customerHandle.toLowerCase()
          ) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id || (m.body === incoming.body && m.status === 'sending'))) {
                return prev.map((m) =>
                  m.id === incoming.id || (m.body === incoming.body && m.status === 'sending')
                    ? { ...incoming, status: 'sent' }
                    : m
                )
              }
              return [...prev, { ...incoming, status: 'sent' }]
            })

            // Instantly transition to live chatbox mode!
            setExistingInquiry((prev: any) => ({
              ...(prev || {
                id: incoming.conversationId || targetConv,
                sender_handle: customerHandle,
                category: 'Customer Chat',
                content: incoming.body,
                created_at: Date.now(),
              }),
              status: 'accepted',
              conversation_id: incoming.conversationId || targetConv,
            }))
            setSubmitted(true)

            // Play notification sound if message is from the merchant
            if (cleanSender !== customerHandle.toLowerCase()) {
              if (soundEnabled) playGentleChime()
            }

            setTimeout(() => scrollToBottom('smooth'), 50)
          }
        } catch (err) {
          console.warn('SSE new_message parse error', err)
        }
      })
    } catch (err) {
      console.warn('SSE initialization failed', err)
    }

    return () => {
      if (es) {
        es.close()
      }
    }
  }, [existingInquiry?.id, existingInquiry?.conversation_id, authedUser?.handle, soundEnabled])

  // 4. On-demand sync helper (Zero background invocations, pure event-driven SSE architecture)
  const syncInquiryAndMessages = async () => {
    const customerHandle =
      authedUser?.handle ||
      existingInquiry?.sender_handle ||
      urlParams?.get('hub_sovereign_handle') ||
      (urlParams?.get('hub_user_email') ? urlParams.get('hub_user_email')!.split('@')[0] : '')

    const customerUserId = authedUser?.id || existingInquiry?.sender_user_id || ''
    const storedInqId = existingInquiry?.id || localStorage.getItem(`chatze_inq_id_${shopHandle}`) || ''
    const convId = existingInquiry?.conversation_id || (customerHandle ? `conv_${customerHandle}` : '')

    if (convId) {
      await loadConversationMessages(convId)
    }

    if (customerHandle || customerUserId || storedInqId) {
      try {
        const inqQueryParams = new URLSearchParams()
        if (customerHandle) inqQueryParams.set('handle', customerHandle)
        if (customerUserId) inqQueryParams.set('userId', customerUserId)
        if (storedInqId) inqQueryParams.set('inquiryId', storedInqId)

        const res = await fetch(`/api/inquiries?${inqQueryParams.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.inquiries && data.inquiries.length > 0) {
            const matched = data.inquiries.find((i: any) => i.id === storedInqId) || data.inquiries[0]
            if (matched) {
              setExistingInquiry(matched)
              if (matched.status === 'accepted') {
                const cId = matched.conversation_id || `conv_${matched.sender_handle}`
                loadConversationMessages(cId)
              }
            }
          }
        }
      } catch {}
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${CHATZE_HUB_URL}/?shop=${encodeURIComponent(shopHandle)}`
      navigator.clipboard.writeText(url)
      setCopiedShare(true)
      setTimeout(() => setCopiedShare(false), 2500)
    }
  }

  const handleTriggerHubLogin = () => {
    if (typeof window !== 'undefined' && window.parent) {
      window.parent.postMessage({ type: 'CHATZE_REQUEST_GOOGLE_LOGIN', shop: shopHandle }, '*')
    }
  }

  // Submit initial 1-card inquiry note
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return

    if (!authedUser && !senderName.trim()) {
      handleTriggerHubLogin()
      return
    }

    setSubmitting(true)
    setErrorMessage('')

    const token = localStorage.getItem('chatze_auth_token') || urlParams?.get('hub_token')
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const cleanHandle =
      authedUser?.handle ||
      (authedUser?.email ? authedUser.email.split('@')[0] : null) ||
      (senderEmail ? senderEmail.split('@')[0] : null) ||
      senderName.toLowerCase().replace(/[^a-z0-9_]/g, '_') ||
      'google_user'

    const cleanUserId = authedUser?.id || `usr_hub_${cleanHandle}`

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          shopHandle: profile?.handle || shopHandle,
          senderName: authedUser?.display_name || senderName,
          senderHandle: cleanHandle,
          senderUserId: cleanUserId,
          senderEmail: authedUser?.email || senderEmail,
          contactPhone: senderContact.startsWith('@') ? '' : senderContact,
          category: selectedCategory,
          content: noteContent.trim(),
          senderOriginUrl: sovereignNode || window.location.origin,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        const inqObj = {
          id: data.inquiryId,
          sender_handle: cleanHandle,
          sender_name: authedUser?.display_name || senderName,
          sender_user_id: cleanUserId,
          content: `[${selectedCategory}] ${noteContent.trim()}`,
          category: selectedCategory,
          status: 'pending',
          conversation_id: `conv_${cleanHandle}`,
          created_at: Date.now(),
        }

        setSubmitted(true)
        setExistingInquiry(inqObj)

        // Persist IDs in localStorage
        localStorage.setItem(`chatze_inq_id_${shopHandle}`, data.inquiryId)
        localStorage.setItem(`chatze_inq_handle_${shopHandle}`, cleanHandle)
        localStorage.setItem(`chatze_inq_user_${shopHandle}`, cleanUserId)
      } else {
        if (data.code === 'AUTH_REQUIRED') {
          handleTriggerHubLogin()
        }
        setErrorMessage(data.error || 'Failed to submit inquiry')
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error while submitting note')
    } finally {
      setSubmitting(false)
    }
  }

  // Send a message inside the live Letterbox chat
  const handleSendChatMessage = async (e?: React.FormEvent, customBody?: string) => {
    if (e) e.preventDefault()
    const textToSend = customBody || chatInput.trim()
    if (!textToSend || isSendingChat) return

    const customerHandle =
      authedUser?.handle ||
      existingInquiry?.sender_handle ||
      (urlParams?.get('hub_user_email') ? urlParams.get('hub_user_email')!.split('@')[0] : 'customer')

    const customerUserId = authedUser?.id || existingInquiry?.sender_user_id || `usr_${customerHandle}`
    const conversationId = existingInquiry?.conversation_id || `conv_${customerHandle}`
    const targetShopHandle = profile?.handle || shopHandle

    const tempId = 'temp_' + Math.random().toString(36).slice(2, 9)
    const optimisticMsg: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: customerUserId,
      senderHandle: customerHandle,
      recipientHandle: targetShopHandle,
      body: textToSend,
      createdAt: new Date().toISOString(),
      status: 'sending',
    }

    setMessages((prev) => [...prev, optimisticMsg])
    if (!customBody) setChatInput('')
    scrollToBottom('smooth')
    setIsSendingChat(true)

    try {
      const res = await fetch('/api/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          body: textToSend,
          senderId: customerUserId,
          myHandle: customerHandle,
          remoteHandle: targetShopHandle,
          tempId,
        }),
      })

      const data = await res.json()
      if (res.ok && data.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data.message, status: 'sent' } : m))
        )
      }
    } catch (err) {
      console.warn('Failed to send message', err)
    } finally {
      setIsSendingChat(false)
    }
  }

  // Handle image upload from customer with in-browser WebP compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const { dataUrl } = await compressImageToWebP(file, 850, 0.72)
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataUrl,
          contentType: 'image/webp',
        }),
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        const targetUrl = uploadData.wsrvUrl || uploadData.url
        if (targetUrl) {
          handleSendChatMessage(undefined, `![Customer Attachment](${targetUrl})`)
          return
        }
      }
    } catch (err) {
      console.warn('Customer image compression/upload warning', err)
    }
  }

  // ==========================================================================
  // SCENARIO 1: DIRECT BROWSER VISIT -> AUTO-REDIRECT TO CHATZE HUB
  // ==========================================================================
  if (!isIframe && !isChatzeHubEmbed) {
    return (
      <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#00a884]/30">
        <div className="max-w-md w-full bg-[#111b21] border border-[#222e35] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-[#00a884]/15 border border-[#00a884]/30 flex items-center justify-center mx-auto text-[#00a884] shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00a884]/10 border border-[#00a884]/30 text-[#00a884] text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Spam-Shielded Letterbox</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Redirecting to Chatze Hub...
            </h1>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              Direct browser access to this Letterbox is protected. To safeguard merchants from automated spam, customer inquiries require verified Google identity on <strong>Chatze Hub</strong>.
            </p>
          </div>
          <div className="p-4 bg-[#182229] border border-[#222e35] rounded-2xl space-y-2 text-left text-xs">
            <div className="flex items-center justify-between text-[#8696a0]">
              <span>Target Shop:</span>
              <strong className="text-white font-mono">@{shopHandle}</strong>
            </div>
            <div className="flex items-center justify-between text-[#8696a0]">
              <span>Redirecting in:</span>
              <span className="text-[#00a884] font-bold font-mono">{redirectCountdown}s</span>
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <a
              href={hubRedirectUrl}
              className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Chatze Hub Now</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-[11px] text-[#8696a0]">
              1-Tap Google Sign-In • Zero Message Bloat • Instant Inquiry
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b141a] flex flex-col items-center justify-center text-[#8696a0] gap-3 font-sans">
        <div className="w-8 h-8 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium tracking-wide">Connecting to Sovereign Letterbox...</p>
      </div>
    )
  }

  // Unlisted Node Check
  const isShopUnlisted = profile && profile.hubListed === false
  if (isShopUnlisted) {
    return (
      <div className="min-h-screen bg-[#0b141a] text-[#e9edef] flex flex-col items-center justify-center p-4 font-sans selection:bg-[#00a884]/30">
        <div className="max-w-md w-full bg-[#111b21] border border-[#222e35] rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              404 • Unlisted Node
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Letterbox Not Listed on Chatze Hub
            </h1>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              The merchant (<strong>@{shopHandle}</strong>) has not published this Letterbox in the Chatze Hub directory. Customer inquiries are currently disabled.
            </p>
          </div>
          <a
            href={CHATZE_HUB_URL}
            target="_top"
            className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Verified Shops on Chatze Hub</span>
          </a>
        </div>
      </div>
    )
  }

  const tagsList = profile?.catalogTags
    ? profile.catalogTags.split(',').map((t) => t.trim()).filter(Boolean)
    : ['Authentic Products', 'Inside Valley Delivery', 'Nationwide Courier', 'Fast Response']

  const isChatOpen =
    existingInquiry?.status === 'accepted' ||
    messages.length > 0 ||
    (existingInquiry && existingInquiry.status !== 'pending' && existingInquiry.status !== 'dismissed')

  const isPendingReview = (existingInquiry?.status === 'pending' || submitted) && !isChatOpen && messages.length === 0

  const customerHandle =
    authedUser?.handle ||
    existingInquiry?.sender_handle ||
    (urlParams?.get('hub_user_email') ? urlParams.get('hub_user_email')!.split('@')[0] : 'customer')

  return (
    <div className="h-screen w-full bg-[#0b141a] text-[#e9edef] flex flex-col font-sans selection:bg-[#00a884]/30 overflow-hidden">
      {/* Top Header Banner */}
      <LetterboxHeader
        profile={profile}
        shopHandle={shopHandle}
        isChatOpen={isChatOpen}
        soundEnabled={soundEnabled}
        copiedShare={copiedShare}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        onCopyLink={handleCopyLink}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-h-0 max-w-4xl w-full mx-auto overflow-hidden">
        {!authedUser && !senderName ? (
          <LetterboxAuthRequired onTriggerHubLogin={handleTriggerHubLogin} />
        ) : isChatOpen ? (
          <LetterboxLiveChat
            existingInquiry={existingInquiry}
            customerHandle={customerHandle}
            authedUser={authedUser}
            messages={messages}
            chatInput={chatInput}
            isSendingChat={isSendingChat}
            isNoteExpanded={isNoteExpanded}
            messagesContainerRef={messagesContainerRef}
            fileInputRef={fileInputRef}
            onToggleNoteExpanded={() => setIsNoteExpanded((prev) => !prev)}
            onChangeChatInput={setChatInput}
            onSendChatMessage={handleSendChatMessage}
            onImageUpload={handleImageUpload}
            onOpenLightbox={(url) => setLightboxUrl(url)}
          />
        ) : isPendingReview || submitted ? (
          <LetterboxPendingCard
            profile={profile}
            existingInquiry={existingInquiry}
            selectedCategory={selectedCategory}
            noteContent={noteContent}
            onSyncInquiryAndMessages={syncInquiryAndMessages}
          />
        ) : (
          <LetterboxCompositionForm
            profile={profile}
            shopHandle={shopHandle}
            tagsList={tagsList}
            senderName={senderName}
            senderEmail={senderEmail}
            senderContact={senderContact}
            sovereignNode={sovereignNode}
            authedUser={authedUser}
            selectedCategory={selectedCategory}
            faqChips={faqChips}
            botMatch={botMatch}
            noteContent={noteContent}
            errorMessage={errorMessage}
            submitting={submitting}
            onSelectCategory={setSelectedCategory}
            onChangeNoteContent={setNoteContent}
            onChangeSenderContact={setSenderContact}
            onSubmit={handleSubmit}
          />
        )}
      </main>

      {/* Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn cursor-pointer"
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 bg-[#202c33] text-white rounded-full hover:bg-[#2a3942]"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Clean Bottom Footer */}
      <footer className="p-2 sm:p-2.5 border-t border-[#202c33] bg-[#111b21]/90 flex-shrink-0 text-center text-[11px] text-[#8696a0]">
        Powered by <strong className="text-white">Chatze Sovereign Letterbox</strong> • Cloudflare Edge Architecture 🇳🇵
      </footer>
    </div>
  )
}

export default CustomerInquiryPage
