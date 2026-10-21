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
      <div className="p-8 text-center text-xs text-[#8696a0] space-y-2">
        <MessageSquare className="w-8 h-8 mx-auto text-[#8696a0]/40 mb-2" />
        <p className="font-medium text-[#e9edef]">No chats in this queue</p>
        <p className="text-[11px] text-[#8696a0]">
          {inboxFilter === 'friends'
            ? 'Your private Friends list is clean. Accept inquiries as Friends to promote them here.'
            : 'Click "+ Connect Contact" above to connect to another deployed instance.'}
        </p>
      </div>
    )
  }

  return (
    <>
      {conversations.map((conv) => {
        const isActive = activeConv?.id === conv.id
        const isPending = conv.status === 'pending'
        return (
          <div
            key={conv.id}
            onClick={() => setActiveConv(conv)}
            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors relative ${
              isActive ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]/40'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-[#202c33] border border-[#222e35] flex items-center justify-center font-bold text-xs text-[#00a884] shrink-0">
              {conv.otherUser.displayName.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#e9edef] truncate">
                  {conv.otherUser.displayName}
                </span>
                {conv.lastMessage && (
                  <span className="text-[10px] text-[#8696a0] shrink-0">
                    {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-[11px] text-[#8696a0] truncate max-w-[170px]">
                  {conv.lastMessage?.content || (isPending ? 'Waiting for approval...' : 'Connected')}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {conv.status === 'letterbox' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-0.5">
                      <Store className="w-2.5 h-2.5" /> Letterbox
                    </span>
                  )}
                  {isPending && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
