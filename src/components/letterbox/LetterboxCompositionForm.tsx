import React from 'react'
import {
  Store,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Phone,
  Send,
} from 'lucide-react'
import type { ShopProfile } from './types'
import { INQUIRY_CATEGORIES } from './types'
import type { BotMatchResult } from '../../lib/clientFaqBot'

interface LetterboxCompositionFormProps {
  profile: ShopProfile | null
  shopHandle: string
  tagsList: string[]
  senderName: string
  senderEmail: string
  senderContact: string
  sovereignNode: string
  authedUser: any
  selectedCategory: string
  faqChips: { label: string; query: string }[]
  botMatch: BotMatchResult | null
  noteContent: string
  errorMessage: string
  submitting: boolean
  onSelectCategory: (cat: string) => void
  onChangeNoteContent: (content: string) => void
  onChangeSenderContact: (contact: string) => void
  onSubmit: (e: React.FormEvent) => void
}

export function LetterboxCompositionForm({
  profile,
  shopHandle,
  tagsList,
  senderName,
  senderEmail,
  senderContact,
  sovereignNode,
  authedUser,
  selectedCategory,
  faqChips,
  botMatch,
  noteContent,
  errorMessage,
  submitting,
  onSelectCategory,
  onChangeNoteContent,
  onChangeSenderContact,
  onSubmit,
}: LetterboxCompositionFormProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
      {/* Merchant Info Card */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {profile?.displayName || 'Sovereign Merchant'}
              </h1>
              <span className="text-xs text-[#8696a0] font-mono">@{profile?.handle || shopHandle}</span>
            </div>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              {profile?.bio || 'Welcome to our official sovereign storefront. Drop an inquiry note below for quick assistance.'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#182229] border border-[#2a3942] flex items-center justify-center text-[#00a884] flex-shrink-0">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Quick Store Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-[#202c33] text-[11px] text-[#8696a0]">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#00a884]" />
            <span className="truncate">{profile?.businessLocation || 'Kathmandu, Nepal'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00a884]" />
            <span className="truncate">{profile?.businessHours || 'Open Regular Hours'}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
            <Truck className="w-3.5 h-3.5 text-[#00a884]" />
            <span className="truncate">{profile?.deliveryInfo || 'Valley & Nationwide'}</span>
          </div>
        </div>

        {/* Catalog Tags */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tagsList.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-[#182229] border border-[#222e35] text-[10px] text-[#8696a0]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 1-CARD INQUIRY COMPOSITION BOX */}
      <div className="bg-[#111b21] border border-[#202c33] rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg">
        {/* Identity Badge Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202c33] flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#8696a0]">
            <ShieldCheck className="w-4 h-4 text-[#00a884]" />
            <span>
              Inquiring as: <strong className="text-white">{senderName || authedUser?.display_name}</strong>
            </span>
            {senderEmail && (
              <span className="text-[10px] text-[#8696a0] font-mono">({senderEmail})</span>
            )}
          </div>
          {sovereignNode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/30 text-[10px]">
              <Sparkles className="w-3 h-3" />
              Sovereign Node Linked
            </span>
          )}
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Category Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#aebac1] mb-1.5">
              Select Topic
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INQUIRY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.label)}
                  className={`p-2 rounded-xl text-xs font-medium text-left transition-all border cursor-pointer ${
                    selectedCategory === cat.label
                      ? 'bg-[#00a884]/15 border-[#00a884] text-white shadow-sm'
                      : 'bg-[#182229] border-[#222e35] text-[#8696a0] hover:text-white hover:border-[#2a3942]'
                  }`}
                >
                  <div className="font-semibold truncate">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Zero-Invocation FAQ Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#8696a0] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00a884]" />
              <span>Quick Questions (Instant 0ms Answer):</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {faqChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onChangeNoteContent(chip.query)}
                  className="px-2.5 py-1 rounded-lg bg-[#182229] hover:bg-[#202c33] border border-[#2a3942] hover:border-[#00a884]/40 text-[11px] text-[#8696a0] hover:text-[#00a884] transition-all cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instant Zero-Invocation Bot Answer Box */}
          {botMatch && (
            <div className="p-3.5 bg-[#00a884]/10 border border-[#00a884]/40 rounded-2xl space-y-2 animate-fadeIn shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-[#00a884]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin-slow" />
                  {botMatch.title}
                </span>
                <span className="text-[10px] bg-[#00a884]/25 text-[#00a884] border border-[#00a884]/30 px-2 py-0.5 rounded-full font-mono">
                  ⚡ 0-Wait Instant
                </span>
              </div>
              <p className="text-xs text-[#e9edef] leading-relaxed font-sans font-medium">
                {botMatch.answer}
              </p>
              {botMatch.nepaliSnippet && (
                <p className="text-[11px] text-[#8696a0] italic border-t border-[#00a884]/20 pt-1.5">
                  {botMatch.nepaliSnippet}
                </p>
              )}
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-[#8696a0]">Question answered? No need to wait for reply!</span>
                <button
                  type="button"
                  onClick={() => onChangeNoteContent('')}
                  className="text-[#00a884] hover:underline font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Inquiry Note Content */}
          <div>
            <label className="block text-xs font-semibold text-[#aebac1] mb-1 flex items-center justify-between">
              <span>Your Note to {profile?.displayName || 'Merchant'} *</span>
              <span className="text-[10px] text-[#8696a0]">{noteContent.length}/500 chars</span>
            </label>
            <textarea
              rows={4}
              required
              maxLength={500}
              value={noteContent}
              onChange={(e) => onChangeNoteContent(e.target.value)}
              placeholder="Ask about pricing, current stock, color options, or delivery timelines to your city..."
              className="w-full bg-[#182229] border border-[#2a3942] focus:border-[#00a884] rounded-xl p-3 text-xs text-white placeholder-[#8696a0] focus:outline-none leading-relaxed resize-none"
            />
          </div>

          {/* Optional Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#aebac1] mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#00a884]" />
              <span>Contact Phone / WhatsApp (Optional)</span>
            </label>
            <input
              type="text"
              value={senderContact.startsWith('@') ? '' : senderContact}
              onChange={(e) => onChangeSenderContact(e.target.value)}
              placeholder="e.g. 9801234567 (for courier coordination)"
              className="w-full bg-[#182229] border border-[#2a3942] focus:border-[#00a884] rounded-xl px-3 py-2 text-xs text-white placeholder-[#8696a0] focus:outline-none"
            />
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={submitting || !noteContent.trim()}
            className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Placing Note in Letterbox...' : 'Drop 1-Card Inquiry Note'}</span>
          </button>
          <p className="text-[11px] text-[#8696a0] text-center">
            🛡️ Direct Cloudflare D1 Delivery • Zero Middleman Message Storage • Anti-Bot Shielded
          </p>
        </form>
      </div>
    </div>
  )
}
