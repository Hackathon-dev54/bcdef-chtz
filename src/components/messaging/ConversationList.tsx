import React from 'react'
import { MessageSquare, Store } from 'lucide-react'
import type { Conversation, InboxFilter } from './types'

interface ConversationListProps {
  conversations: Conversation[]
  activeConv: Conversation | null
  setActiveConv: (conv: Conversation) => void
  inboxFilter: InboxFilter
  onOpenConnectContact: () => void
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConv,
  setActiveConv,
  inboxFilter,
  onOpenConnectContact,
}) => {
  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">No chats in this queue</p>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-[200px] mx-auto">
          {inboxFilter === 'friends'
            ? 'Your private Friends list is clean.'
            : 'Click "+ Connect Contact" above to start a conversation.'}
        </p>
      </div>
    )
  }

  return (
    <div className="py-2 space-y-0.5">
      {/* "RECENT" Section Subtitle */}
      <div className="px-4 py-1 text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
        Recent
      </div>

      {conversations.map((conv) => {
        const isActive = activeConv?.id === conv.id
        const isPending = conv.status === 'pending'
        const initials = (conv.otherUser?.displayName || 'User').slice(0, 2).toUpperCase()
        const unreadCount = conv.unreadCount || 0

        return (
          <div
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className={`mx-2 p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-colors relative ${
              isActive
                ? 'bg-zinc-100 dark:bg-zinc-800/80 shadow-xs'
                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            {/* Avatar with Status Dot */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300/60 dark:border-zinc-700/60 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200 shadow-xs">
                {initials}
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#121214] absolute bottom-0 right-0"></span>
            </div>

            {/* Content Preview */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {conv.otherUser.displayName}
                </span>
                {conv.lastMessage && (
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 shrink-0 font-medium ml-1">
                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[170px]">
                  {conv.lastMessage?.content || (isPending ? 'Waiting for approval...' : 'Connected')}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {unreadCount > 0 ? (
                    <span className="w-4 h-4 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-bold text-[9px] flex items-center justify-center shadow-xs">
                      {unreadCount}
                    </span>
                  ) : null}

                  {conv.status === 'letterbox' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-0.5">
                      <Store className="w-2.5 h-2.5" /> Letterbox
                    </span>
                  )}

                  {isPending && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
