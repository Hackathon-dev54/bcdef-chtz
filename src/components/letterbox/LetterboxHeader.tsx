import React from 'react'
import { Store, BadgeCheck, Volume2, VolumeX, Check, Copy } from 'lucide-react'
import type { ShopProfile } from './types'

interface LetterboxHeaderProps {
  profile: ShopProfile | null
  shopHandle: string
  isChatOpen: boolean
  soundEnabled: boolean
  copiedShare: boolean
  onToggleSound: () => void
  onCopyLink: () => void
}

export function LetterboxHeader({
  profile,
  shopHandle,
  isChatOpen,
  soundEnabled,
  copiedShare,
  onToggleSound,
  onCopyLink,
}: LetterboxHeaderProps) {
  return (
    <header className="border-b border-[#202c33] bg-[#111b21] flex-shrink-0 z-20">
      <div className="max-w-4xl w-full mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#00a884]/20 border border-[#00a884]/40 flex items-center justify-center text-[#00a884] font-bold text-xs flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs sm:text-sm tracking-wide text-[#e9edef] truncate">
                {profile?.displayName || 'Chatze Sovereign Store'}
              </span>
              <span className="text-[10px] bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 flex-shrink-0">
                <BadgeCheck className="w-3 h-3" /> Hub Verified
              </span>
            </div>
            <p className="text-[11px] text-[#8696a0] flex items-center gap-2 truncate">
              <span>@{profile?.handle || shopHandle}</span>
              <span>•</span>
              <span className="text-[#00a884] font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                {isChatOpen ? 'Live Chat Unlocked' : 'Letterbox Active'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isChatOpen && (
            <button
              onClick={onToggleSound}
              title={soundEnabled ? 'Mute incoming chimes' : 'Unmute chimes'}
              className="p-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] text-xs rounded-lg transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-[#00a884]" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onCopyLink}
            title="Share store link"
            className="px-2.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#00a884]" />
                <span className="text-[#00a884] text-[11px] hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px] hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
