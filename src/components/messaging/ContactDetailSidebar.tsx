import React, { useState, useMemo } from 'react'
import {
  X,
  MoreHorizontal,
  UserCheck,
  Archive,
  FileText,
  Image as ImageIcon,
  Bell,
  BellOff,
  ExternalLink,
} from 'lucide-react'
import type { Conversation, ChatMessage } from './types'
import { parseMessageContent, getOptimizedImageUrl } from './mediaUtils'

interface ContactDetailSidebarProps {
  activeConv: Conversation
  messages: ChatMessage[]
  isOpen: boolean
  onClose: () => void
  onOpenLightbox?: (url: string) => void
}

export const ContactDetailSidebar: React.FC<ContactDetailSidebarProps> = ({
  activeConv,
  messages,
  isOpen,
  onClose,
  onOpenLightbox,
}) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isArchived, setIsArchived] = useState(activeConv.status === 'archived')

  // Extract shared media files from messages
  const sharedMedia = useMemo(() => {
    const list: { id: string; url: string; caption?: string; date: string }[] = []
    for (const msg of messages) {
      const parsed = parseMessageContent(msg.body)
      if (parsed.isImage && parsed.imageUrl) {
        list.push({
          id: msg.id,
          url: parsed.imageUrl,
          caption: parsed.caption || 'Shared photo',
          date: new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        })
      }
    }
    return list
  }, [messages])

  if (!isOpen) return null

  const displayName = activeConv.otherUser?.displayName || 'Contact'
  const username = activeConv.otherUser?.username || 'user'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <aside className="w-72 lg:w-80 h-full border-l border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] flex flex-col shrink-0 overflow-y-auto select-none transition-all">
      {/* Header */}
      <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Contact
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-6 flex flex-col items-center text-center border-b border-zinc-200 dark:border-zinc-800/80 space-y-3">
        <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xl text-zinc-800 dark:text-zinc-200 shadow-xs">
          {initials}
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {displayName}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            @{username}
            {activeConv.remoteInstanceUrl ? ` • ${activeConv.remoteInstanceUrl.replace(/^https?:\/\//, '')}` : ' • Connected contact'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 w-full justify-center">
          <button
            type="button"
            className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Connected</span>
          </button>
          <button
            type="button"
            onClick={() => setIsArchived(!isArchived)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isArchived
                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{isArchived ? 'Archived' : 'Archive'}</span>
          </button>
        </div>
      </div>

      {/* Shared Files & Media */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
            Shared files
          </span>
          <span className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer">
            View all ({sharedMedia.length})
          </span>
        </div>

        {sharedMedia.length === 0 ? (
          <div className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No shared media files in this conversation.
          </div>
        ) : (
          <div className="space-y-2">
            {sharedMedia.slice(0, 4).map((file) => (
              <div
                key={file.id}
                onClick={() => onOpenLightbox && onOpenLightbox(file.url)}
                className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-600 dark:text-zinc-300">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {file.caption || 'Shared photo'}
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {file.date}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notifications / Mute Setting */}
      <div className="p-4 space-y-3">
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 block">
          Notifications
        </span>
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Mute conversation
          </span>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
              isMuted ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full transition-transform absolute top-1 ${
                isMuted
                  ? 'translate-x-5 bg-white dark:bg-zinc-950'
                  : 'translate-x-1 bg-white'
              }`}
            />
          </button>
        </div>
      </div>
    </aside>
  )
}
