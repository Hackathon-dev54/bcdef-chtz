import React from 'react'
import { ArrowLeft, Store } from 'lucide-react'
import { PWAInstallButton } from '../PWAInstallButton'
import { NotificationToggleButton } from '../NotificationToggleButton'
import type { Conversation } from './types'

interface ChatHeaderProps {
  activeConv: Conversation
  accountType: 'personal' | 'business'
  currentUser: { handle: string }
  streamConnected: boolean
  onBack: () => void
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConv,
  accountType,
  currentUser,
  streamConnected,
  onBack,
}) => {
  return (
    <div className="h-16 px-3 sm:px-5 border-b border-[#202c33] flex items-center justify-between bg-[#202c33]/70 shrink-0 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Back button on mobile */}
        <button
          onClick={onBack}
          className="md:hidden p-2 -ml-1 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#202c33] transition-colors shrink-0"
          title="Back to all chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#111b21] border border-[#222e35] flex items-center justify-center font-bold text-xs text-[#00a884] shrink-0">
          {activeConv.otherUser.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-semibold text-[#e9edef] flex items-center gap-1.5 truncate">
            <span className="truncate">{activeConv.otherUser.displayName}</span>
            {activeConv.status === 'letterbox' ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 shrink-0 flex items-center gap-1">
                <Store className="w-2.5 h-2.5" />{' '}
                {accountType === 'personal' ? 'Letterbox Shop' : 'Letterbox Customer'}
              </span>
            ) : activeConv.status === 'pending' ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                Pending
              </span>
            ) : (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-normal bg-[#00a884]/10 text-[#00a884] border border-[#00a884]/20 shrink-0">
                Friend
              </span>
            )}
          </h2>
          <p className="text-[11px] text-[#8696a0] truncate">
            {activeConv.remoteInstanceUrl
              ? activeConv.remoteInstanceUrl.replace(/^https?:\/\//, '')
              : `@${activeConv.otherUser.username}`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-[#8696a0] shrink-0">
        <PWAInstallButton />
        <NotificationToggleButton userHandle={currentUser.handle} />
        <span className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#111b21] border border-[#202c33] text-[10px] sm:text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              streamConnected ? 'bg-[#00a884]' : 'bg-amber-400 animate-ping'
            }`}
          />
          <span className="hidden sm:inline">
            {streamConnected ? '100s SSE Live' : 'Reconnecting...'}
          </span>
        </span>
      </div>
    </div>
  )
}
