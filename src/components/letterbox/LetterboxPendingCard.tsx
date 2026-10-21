import React from 'react'
import { Clock, MessageSquare, ShieldCheck } from 'lucide-react'
import type { ShopProfile } from './types'

interface LetterboxPendingCardProps {
  profile: ShopProfile | null
  existingInquiry: any
  selectedCategory: string
  noteContent: string
  onSyncInquiryAndMessages: () => void
}

export function LetterboxPendingCard({
  profile,
  existingInquiry,
  selectedCategory,
  noteContent,
  onSyncInquiryAndMessages,
}: LetterboxPendingCardProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
      <div className="max-w-lg w-full bg-[#111b21] border border-[#00a884]/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center animate-fadeIn">
        <div className="relative w-16 h-16 rounded-3xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center mx-auto text-[#00a884] shadow-inner">
          <Clock className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00a884] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#00a884]" />
          </span>
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00a884] bg-[#00a884]/10 border border-[#00a884]/30 px-3 py-1 rounded-full">
            Status: Pending Review
          </span>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Inquiry Note Placed in Letterbox!
          </h2>
          <p className="text-xs text-[#8696a0] max-w-sm mx-auto leading-relaxed">
            Your note is recorded directly on <strong>{profile?.displayName || 'Merchant'}</strong>'s edge node. As soon as the merchant accepts, this window will automatically unlock into live chat!
          </p>
        </div>

        {/* Inquiry Note Card Preview */}
        <div className="p-3.5 bg-[#182229] border border-[#222e35] rounded-2xl text-left text-xs space-y-2 max-w-md mx-auto">
          <div className="flex items-center justify-between text-[11px] text-[#8696a0]">
            <span className="font-semibold text-[#00a884]">{existingInquiry?.category || selectedCategory}</span>
            <span className="flex items-center gap-1 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>Awaiting Merchant</span>
            </span>
          </div>
          <p className="p-3 bg-[#0b141a] rounded-xl text-[#e9edef] text-xs border border-[#222e35] font-sans leading-relaxed break-words">
            "{existingInquiry?.content || noteContent}"
          </p>
        </div>

        {/* Instant Check / Open Live Chat Button */}
        <button
          type="button"
          onClick={onSyncInquiryAndMessages}
          className="w-full py-2.5 bg-[#182229] hover:bg-[#202c33] border border-[#00a884]/40 text-[#00a884] hover:text-[#25d366] font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Check for Merchant Reply / Open Chat</span>
        </button>

        <div className="pt-2 border-t border-[#222e35] flex items-center justify-center gap-2 text-[11px] text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-[#00a884]" />
          <span>Direct Edge SSE Active • Auto-unlocks when merchant replies</span>
        </div>
      </div>
    </div>
  )
}
