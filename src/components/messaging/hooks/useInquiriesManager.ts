import { useState, useCallback } from 'react'
import { getAuthHeaders } from '../authUtils'
import { InboxFilter } from '../types'

export function useInquiriesManager({
  currentDisplayName,
  onAfterReply,
  setInboxFilter,
}: {
  currentDisplayName: string
  onAfterReply: () => Promise<void>
  setInboxFilter: (filter: InboxFilter) => void
}) {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [pendingInquiryCount, setPendingInquiryCount] = useState<number>(0)
  const [replyingInquiryId, setReplyingInquiryId] = useState<string | null>(null)
  const [copiedShopLink, setCopiedShopLink] = useState(false)
  const [inquiryActionToast, setInquiryActionToast] = useState<string | null>(null)

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await fetch('/api/inquiries', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries || [])
        setPendingInquiryCount(data.pendingCount || 0)
      }
    } catch {}
  }, [])

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
        await onAfterReply()
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

  return {
    inquiries,
    setInquiries,
    pendingInquiryCount,
    setPendingInquiryCount,
    replyingInquiryId,
    setReplyingInquiryId,
    copiedShopLink,
    inquiryActionToast,
    setInquiryActionToast,
    fetchInquiries,
    handleReplyInquiry,
    handleDismissInquiry,
    shopPortfolioUrl,
    handleCopyShopUrl,
    handleShareShopUrl,
  }
}
