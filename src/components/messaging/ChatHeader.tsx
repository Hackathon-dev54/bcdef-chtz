import React from 'react'
import {
  ArrowLeft,
  Store,
  Video,
  Phone,
  MoreHorizontal,
  PanelRight,
} from 'lucide-react'
import { PWAInstallButton } from '../PWAInstallButton'
import { NotificationToggleButton } from '../NotificationToggleButton'
import type { Conversation } from './types'

interface ChatHeaderProps {
  activeConv: Conversation
  accountType: 'personal' | 'business'
  currentUser: { handle: string }
  streamConnected: boolean
  onBack: () => void
  onToggleSidebar?: () => void
  isSidebarOpen?: boolean
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeConv,
  accountType,
  currentUser,
  streamConnected,
  onBack,
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const displayName = activeConv.otherUser?.displayName || 'Contact'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="h-16 px-4 sm:px-6 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-white dark:bg-[#121214] shrink-0 transition-colors">
      {/* Left: Contact Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="md:hidden p-1.5 -ml-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Back to all chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200 shadow-xs">
            {initials}
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute bottom-0 right-0 border-2 border-white dark:border-[#121214]"></span>
        </div>

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 truncate">
            <span className="truncate">{displayName}</span>
            {activeConv.status === 'letterbox' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 flex items-center gap-1">
                <Store className="w-2.5 h-2.5" /> Letterbox
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Active now</span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-2 text-zinc-500 dark:text-zinc-400 shrink-0">
        <button
          type="button"
          title="Start video call"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          type="button"
          title="Start voice call"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Phone className="w-4 h-4" />
        </button>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Contact Info' : 'Show Contact Info'}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSidebarOpen
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          title="More options"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
