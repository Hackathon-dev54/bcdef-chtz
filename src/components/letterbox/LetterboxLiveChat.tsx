import React from 'react'
import {
  ShieldCheck,
  MessageSquare,
  Clock,
  CheckCheck,
  Send,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ChatMessage } from './types'
import { QUICK_PROMPTS } from './types'

interface LetterboxLiveChatProps {
  existingInquiry: any
  customerHandle: string
  authedUser: any
  messages: ChatMessage[]
  chatInput: string
  isSendingChat: boolean
  isNoteExpanded: boolean
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onToggleNoteExpanded: () => void
  onChangeChatInput: (val: string) => void
  onSendChatMessage: (e?: React.FormEvent, directText?: string) => void
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenLightbox: (url: string) => void
}

export function LetterboxLiveChat({
  existingInquiry,
  customerHandle,
  authedUser,
  messages,
  chatInput,
  isSendingChat,
  isNoteExpanded,
  messagesContainerRef,
  fileInputRef,
  onToggleNoteExpanded,
  onChangeChatInput,
  onSendChatMessage,
  onImageUpload,
  onOpenLightbox,
}: LetterboxLiveChatProps) {
  // Helper to parse message for image markdown ![alt](url)
  const parseMessage = (text: string) => {
    const imgRegex = /!\[(.*?)\]\((.*?)\)/
    const match = text.match(imgRegex)
    if (match) {
      return {
        isImage: true,
        alt: match[1],
        url: match[2],
        caption: text.replace(imgRegex, '').trim(),
      }
    }
    return { isImage: false, text }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0b141a]">
      {/* Pinned Original Inquiry Header (Collapsible) */}
      <div className="bg-[#182229] border-b border-[#222e35] px-3 py-2 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-[#8696a0]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse flex-shrink-0" />
            <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
              Inquiry Accepted: {existingInquiry?.category || 'Customer Inquiry'}
            </span>
            <span className="text-[10px] bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30 px-2 py-0.5 rounded-full font-bold hidden sm:inline">
              Chat Open
            </span>
          </div>
          <button
            onClick={onToggleNoteExpanded}
            className="flex items-center gap-1 text-[11px] text-[#00a884] hover:underline cursor-pointer flex-shrink-0 ml-2"
          >
            <span>{isNoteExpanded ? 'Hide Note' : 'View Note'}</span>
            {isNoteExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isNoteExpanded && (
          <div className="mt-2 p-2.5 bg-[#111b21] rounded-xl border border-[#2a3942] text-xs text-[#e9edef] space-y-1 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
              <span>From: @{customerHandle}</span>
              <span>{existingInquiry?.created_at ? new Date(existingInquiry.created_at).toLocaleString() : ''}</span>
            </div>
            <p className="font-sans leading-relaxed text-[11px]">
              "{existingInquiry?.content}"
            </p>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 min-h-0 bg-[#0b141a]"
      >
        {/* Top welcome bubble */}
        <div className="flex justify-center my-2">
          <div className="bg-[#182229] border border-[#222e35] text-[#8696a0] text-[10px] sm:text-[11px] px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
            <span>Sovereign Letterbox Chat • Messages stored on merchant's Cloudflare D1</span>
          </div>
        </div>

        {messages.length === 0 && (
          <div className="py-8 text-center space-y-2 text-[#8696a0]">
            <div className="w-10 h-10 rounded-full bg-[#182229] border border-[#222e35] flex items-center justify-center mx-auto text-[#00a884]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs">Chat is live! Send a message or question below.</p>
          </div>
        )}

        {messages.map((msg) => {
          const cleanSender = (msg.senderHandle || msg.senderId || '').replace(/^@/, '').trim().toLowerCase()
          const isMe =
            cleanSender === customerHandle.toLowerCase() ||
            msg.senderId === authedUser?.id ||
            cleanSender === 'customer' ||
            cleanSender === (authedUser?.handle || '').toLowerCase()

          const parsed = parseMessage(msg.body)

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 shadow-md ${
                  isMe
                    ? 'bg-[#005c4b] text-white rounded-tr-xs'
                    : 'bg-[#202c33] text-[#e9edef] rounded-tl-xs border border-[#2a3942]'
                }`}
              >
                {!isMe && (
                  <p className="text-[10px] font-bold text-[#00a884] mb-1">
                    {msg.senderHandle ? `@${msg.senderHandle.replace(/^@/, '')}` : 'Merchant'}
                  </p>
                )}

                {/* Image Message Rendering */}
                {parsed.isImage && parsed.url ? (
                  <div className="space-y-1.5">
                    <div
                      onClick={() => onOpenLightbox(parsed.url!)}
                      className="relative rounded-xl overflow-hidden cursor-pointer bg-[#111b21] max-h-[300px] flex items-center justify-center border border-white/5"
                    >
                      <img
                        src={parsed.url}
                        alt={parsed.alt || 'Shared Image'}
                        className="w-full h-auto object-cover max-h-[300px]"
                      />
                    </div>
                    {parsed.caption && (
                      <p className="text-xs leading-relaxed px-1 break-words">{parsed.caption}</p>
                    )}
                  </div>
                ) : (
                  <p className="break-words leading-relaxed text-xs sm:text-sm">{msg.body}</p>
                )}

                <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-[#8696a0]">
                  <span>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                  {isMe &&
                    (msg.status === 'sending' ? (
                      <Clock className="w-3 h-3 animate-spin text-[#8696a0]" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="px-3 py-1.5 bg-[#111b21] border-t border-[#202c33] flex items-center gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendChatMessage(undefined, prompt)}
            className="px-2.5 py-1 bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] rounded-full text-[11px] text-[#8696a0] hover:text-white whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={onSendChatMessage}
        className="p-2 sm:p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2 flex-shrink-0"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach photo or slip"
          className="p-2 text-[#8696a0] hover:text-white hover:bg-[#2a3942] rounded-xl transition-colors cursor-pointer flex-shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChangeChatInput(e.target.value)}
          placeholder="Type a message to shop owner..."
          className="flex-1 bg-[#2a3942] border border-[#374248] focus:border-[#00a884] rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-[#8696a0] focus:outline-none"
        />

        <button
          type="submit"
          disabled={!chatInput.trim() || isSendingChat}
          className="p-2 sm:px-3 sm:py-2 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 text-[#111b21] font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer flex-shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="text-xs font-bold hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  )
}
