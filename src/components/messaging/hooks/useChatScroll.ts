import { useRef, useState } from 'react'

export function useChatScroll() {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const [hasNewUnreadWhileScrolled, setHasNewUnreadWhileScrolled] = useState(false)

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

  return {
    messagesContainerRef,
    messagesEndRef,
    showScrollBottom,
    hasNewUnreadWhileScrolled,
    setHasNewUnreadWhileScrolled,
    handleScroll,
    scrollToBottom,
  }
}
