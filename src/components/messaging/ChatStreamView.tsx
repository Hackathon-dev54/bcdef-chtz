import React from 'react'
import { Clock, ShieldCheck, Maximize2, CheckCheck, ArrowDown } from 'lucide-react'
import type { Conversation, ChatMessage } from './types'
import { getOptimizedImageUrl, parseMessageContent } from './mediaUtils'

interface ChatStreamViewProps {
  activeConv: Conversation
  currentUser: { id: string; handle: string }
  messages: ChatMessage[]
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  handleScroll: () => void
  showScrollBottom: boolean
  hasNewUnreadWhileScrolled: boolean
  scrollToBottom: (behavior?: 'smooth' | 'instant') => void
  onOpenLightbox: (url: string) => void
}

export const ChatStreamView: React.FC<ChatStreamViewProps> = ({
  activeConv,
  currentUser,
  messages,
  messagesContainerRef,
  messagesEndRef,
  handleScroll,
  showScrollBottom,
  hasNewUnreadWhileScrolled,
  scrollToBottom,
  onOpenLightbox,
}) => {
  if (activeConv.status === 'pending') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
          <Clock className="w-10 h-10 sm:w-12 sm:h-12 animate-pulse" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Connection Request Pending
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          You sent a connection request to <strong className="text-zinc-900 dark:text-zinc-100">@{activeConv.otherUser.username}</strong> on{' '}
          <span className="text-zinc-700 dark:text-zinc-300 font-mono break-all">{activeConv.remoteInstanceUrl || 'their instance'}</span>.
        </p>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-500 dark:text-zinc-400 text-left space-y-1 w-full">
          <p className="text-zinc-900 dark:text-zinc-100 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> End-to-End Edge Verification:
          </p>
          <p>1. They log in to their deployed instance and click <strong>Accept</strong>.</p>
          <p>2. Once accepted, real-time messaging unlocks instantly on both devices in <strong>0ms</strong>.</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 py-2.5 px-4 rounded-xl w-full">
          <Clock className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
          <span>Waiting for @{activeConv.otherUser.username} to accept your request...</span>
        </div>
      </div>
    )
  }

  const otherDisplayName = activeConv.otherUser?.displayName || 'Contact'

  return (
    <>
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5 min-h-0 bg-zinc-50/50 dark:bg-[#0e0e10] transition-colors"
      >
        {/* Date Divider (Clean Reference Style) */}
        <div className="flex items-center justify-center relative my-2">
          <div className="h-px bg-zinc-200 dark:bg-zinc-800 w-full absolute"></div>
          <span className="relative px-3 py-1 bg-white dark:bg-[#121214] text-[10px] font-semibold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 rounded-full border border-zinc-200 dark:border-zinc-800/80 shadow-xs">
            Today
          </span>
        </div>

        {messages.map((msg) => {
          const myId = (currentUser.id || '').trim().toLowerCase()
          const myHandle = (currentUser.handle || '').replace(/^@/, '').trim().toLowerCase()
          const otherHandle = (activeConv.otherUser?.username || (activeConv as any).remoteHandle || '')
            .replace(/^@/, '')
            .trim()
            .toLowerCase()
          const otherId = (activeConv.otherUser?.id || (activeConv as any).user_b || '').trim().toLowerCase()
          const convTarget = (activeConv.id || '').replace(/^conv_/, '').trim().toLowerCase()

          const senderClean = (msg.senderId || '').replace(/^@/, '').trim().toLowerCase()
          const senderHandleClean = ((msg as any).senderHandle || '').replace(/^@/, '').trim().toLowerCase()
          const recipientClean = ((msg as any).recipientHandle || '').replace(/^@/, '').trim().toLowerCase()

          // 1. Is this message from the customer / remote peer?
          const isFromOther = Boolean(
            (otherHandle && senderClean === otherHandle) ||
              (otherHandle && senderHandleClean === otherHandle) ||
              (otherId && senderClean === otherId) ||
              (otherHandle && senderClean.includes(otherHandle)) ||
              (convTarget && senderClean.includes(convTarget)) ||
              senderClean.startsWith('usr_hub_') ||
              senderClean === 'customer' ||
              (recipientClean &&
                recipientClean === myHandle &&
                senderClean !== myId &&
                senderClean !== myHandle &&
                senderClean !== 'usr_admin') ||
              (senderClean !== myId && senderClean !== myHandle && senderClean !== 'usr_admin' && (otherHandle || otherId))
          )

          // 2. Is this message from ME (the merchant)?
          const isMe = !isFromOther
          const parsed = parseMessageContent(msg.body)
          const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}>
              {/* Sender Name for incoming messages */}
              {!isMe && (
                <span className="text-[11px] font-semibold text-zinc-900 dark:text-zinc-200 pl-1">
                  {otherDisplayName}
                </span>
              )}

              {/* Message Bubble Container */}
              <div
                className={`max-w-[85%] sm:max-w-[70%] md:max-w-[55%] rounded-2xl ${
                  parsed.isImage ? 'p-1.5' : 'px-4 py-2.5'
                } text-[13px] sm:text-sm leading-relaxed transition-all shadow-xs ${
                  isMe
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-br-sm'
                    : 'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-sm'
                }`}
              >
                {parsed.isImage && parsed.imageUrl ? (
                  <div className="space-y-1.5">
                    <div
                      onClick={() => onOpenLightbox(parsed.imageUrl!)}
                      className="relative group rounded-xl overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-800 max-h-[380px] flex items-center justify-center border border-black/5 dark:border-white/5"
                    >
                      <img
                        src={getOptimizedImageUrl(parsed.imageUrl, 700)}
                        onError={(e) => {
                          const target = e.currentTarget
                          if (parsed.imageUrl && target.src !== parsed.imageUrl) {
                            target.src = parsed.imageUrl
                          }
                        }}
                        alt={parsed.caption || 'Photo message'}
                        loading="lazy"
                        className="w-full h-auto max-h-[380px] object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                        <span className="p-2 rounded-full bg-black/60 backdrop-blur-sm">
                          <Maximize2 className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    {parsed.caption && (
                      <p className="px-1.5 pt-0.5 break-words leading-relaxed text-[13px]">
                        {parsed.caption}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                )}
              </div>

              {/* Timestamp & Status Underneath Bubble (Exact Reference Design) */}
              <div
                className={`flex items-center gap-1 px-1 text-[10px] text-zinc-400 dark:text-zinc-500 font-medium ${
                  isMe ? 'justify-end' : 'justify-start'
                }`}
              >
                <span>{timeStr}</span>
                {isMe &&
                  (msg.status === 'sending' ? (
                    <Clock className="w-3 h-3 animate-spin text-zinc-400" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  ))}
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-24 right-4 sm:right-8 p-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center gap-1.5 text-xs cursor-pointer z-20"
        >
          <ArrowDown className="w-4 h-4" />
          {hasNewUnreadWhileScrolled && (
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-[9px]">
              New
            </span>
          )}
        </button>
      )}
    </>
  )
}
