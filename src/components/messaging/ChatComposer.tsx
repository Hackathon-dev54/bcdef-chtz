import React from 'react'
import { Sparkles, Paperclip, Smile, Send, Lock } from 'lucide-react'
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="p-3 sm:p-5 border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] shrink-0 space-y-2.5 transition-colors">
      {/* Quick Replies Bar */}
      {!isPending && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick:
          </span>
          {UNIVERSAL_QUICK_REPLIES.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(undefined, reply.text)}
              className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors shrink-0 cursor-pointer"
            >
              {reply.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Capsule Composer Bar */}
      <form
        onSubmit={handleSendMessage}
        onPaste={handlePaste}
        className="relative flex items-center rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-1.5 sm:p-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-all shadow-xs"
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          disabled={isPending}
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          title="Attach photo / document (Ctrl+V)"
        >
          <Paperclip className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Input Field */}
        <input
          type="text"
          disabled={isPending}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isPending
              ? 'Waiting for contact to approve...'
              : 'Write a message...'
          }
          className="flex-1 bg-transparent px-2 py-1 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none disabled:opacity-40"
        />

        {/* Emoji Button */}
        <button
          type="button"
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Emoji"
          onClick={() => setInputText(inputText + ' 😊')}
        >
          <Smile className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={isPending || !inputText.trim()}
          className="p-2 sm:p-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-30 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
          title="Send message"
        >
          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </form>

      {/* Subtle Bottom Status Line: ⌘ Enter to send • End-to-end encrypted */}
      <div className="flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500 px-1 font-medium select-none">
        <span className="flex items-center gap-1">
          <span>⌘</span>
          <span>Enter to send</span>
        </span>
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-500/80" />
          <span>End-to-end encrypted</span>
        </span>
      </div>
    </div>
  )
}
