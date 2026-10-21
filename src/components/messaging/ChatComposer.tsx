import React from 'react'
import { Sparkles, Image as ImageIcon, Send } from 'lucide-react'
import { type Conversation, UNIVERSAL_QUICK_REPLIES } from './types'

interface ChatComposerProps {
  activeConv: Conversation
  inputText: string
  setInputText: (val: string) => void
  handleSendMessage: (e?: React.FormEvent, customText?: string) => void
  handlePaste: (e: React.ClipboardEvent) => void
  handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  activeConv,
  inputText,
  setInputText,
  handleSendMessage,
  handlePaste,
  handleFileInputChange,
  fileInputRef,
}) => {
  const isPending = activeConv.status === 'pending'

  return (
    <>
      {/* Quick Replies Bar */}
      {!isPending && (
        <div className="px-3 sm:px-5 py-2 border-t border-[#202c33] bg-[#111b21]/70 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00a884]" /> Quick:
          </span>
          {UNIVERSAL_QUICK_REPLIES.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(undefined, reply.text)}
              className="px-2.5 sm:px-3 py-1 bg-[#202c33] hover:bg-[#2a3942] border border-[#222e35] rounded-full text-[11px] sm:text-xs text-[#e9edef] whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Composer Bar */}
      <form
        onSubmit={handleSendMessage}
        onPaste={handlePaste}
        className="p-2.5 sm:p-3.5 border-t border-[#202c33] bg-[#202c33]/50 flex items-center gap-2 sm:gap-3 shrink-0"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 sm:p-2.5 text-[#8696a0] hover:text-[#00a884] hover:bg-[#2a3942] rounded-xl transition-all cursor-pointer disabled:opacity-40 shrink-0"
          title="Attach & Send Photo (or Paste with Ctrl+V)"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          disabled={isPending}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isPending
              ? 'Waiting for contact to approve...'
              : 'Type a message or paste photo (Ctrl+V)...'
          }
          className="flex-1 bg-[#2a3942] border border-[#222e35] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] disabled:opacity-40 transition-all"
        />
        <button
          type="submit"
          disabled={isPending || !inputText.trim()}
          className="p-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 text-[#111b21] font-bold rounded-xl transition-all shadow-md shadow-[#00a884]/20 cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </form>
    </>
  )
}
