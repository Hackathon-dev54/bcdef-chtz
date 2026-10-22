import React, { useState, useMemo } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Check,
  X,
  ShieldAlert,
  UserPlus,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import type { Friendship, Conversation } from './types'

interface RequestsFeedProps {
  incomingRequests: Friendship[]
  outgoingRequests: Friendship[]
  conversations: Conversation[]
  activeConv: Conversation | null
  setActiveConv: (conv: Conversation) => void
  handleAcceptFriendRequest: (remoteHandle: string, remoteInstanceUrl: string) => void
  handleRejectFriendRequest: (remoteHandle: string, blockDomain?: boolean, remoteInstanceUrl?: string) => void
  handleCancelFriendRequest: (remoteHandle: string, remoteInstanceUrl?: string) => void
  onOpenConnectContact: () => void
  searchQuery?: string
}

type SubTab = 'all' | 'received' | 'sent'

export const RequestsFeed: React.FC<RequestsFeedProps> = ({
  incomingRequests,
  outgoingRequests,
  conversations,
  activeConv,
  setActiveConv,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  onOpenConnectContact,
  searchQuery = '',
}) => {
  const [subTab, setSubTab] = useState<SubTab>('all')
  const [cancellingHandle, setCancellingHandle] = useState<string | null>(null)

  // Filter incoming by search
  const filteredIncoming = useMemo(() => {
    return incomingRequests.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        r.remote_handle.toLowerCase().includes(q) ||
        r.remote_instance_url.toLowerCase().includes(q)
      )
    })
  }, [incomingRequests, searchQuery])

  // Filter outgoing by search
  const filteredOutgoing = useMemo(() => {
    return outgoingRequests.filter((r) => {
      const q = searchQuery.toLowerCase().trim()
      if (!q) return true
      return (
        r.remote_handle.toLowerCase().includes(q) ||
        r.remote_instance_url.toLowerCase().includes(q)
      )
    })
  }, [outgoingRequests, searchQuery])

  const totalFilteredCount =
    (subTab === 'sent' ? 0 : filteredIncoming.length) +
    (subTab === 'received' ? 0 : filteredOutgoing.length)

  const handleCancelClick = async (e: React.MouseEvent, req: Friendship) => {
    e.stopPropagation()
    setCancellingHandle(req.remote_handle)
    try {
      await handleCancelFriendRequest(req.remote_handle, req.remote_instance_url)
    } finally {
      setCancellingHandle(null)
    }
  }

  const handleOutgoingRowClick = (req: Friendship) => {
    const cleanHandle = req.remote_handle.replace(/^@/, '').toLowerCase()
    const existing = conversations.find(
      (c) =>
        c.otherUser.username.toLowerCase() === cleanHandle ||
        c.id === 'conv_' + cleanHandle
    )
    if (existing) {
      setActiveConv(existing)
    } else {
      const syntheticConv: Conversation = {
        id: 'conv_' + cleanHandle,
        otherUser: {
          username: cleanHandle,
          displayName: `@${cleanHandle}`,
        },
        status: 'pending',
        remoteInstanceUrl: req.remote_instance_url,
        lastMessage: {
          content: `Friend request sent to @${cleanHandle}`,
          createdAt: req.created_at || Date.now(),
        },
      }
      setActiveConv(syntheticConv)
    }
  }

  return (
    <div className="flex flex-col h-full select-none">
      {/* Sub-Tabs Segmented Pill Switch */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/60 dark:bg-zinc-900/40">
        <div className="flex items-center gap-1 bg-zinc-200/70 dark:bg-zinc-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
              subTab === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            All ({filteredIncoming.length + filteredOutgoing.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('received')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              subTab === 'received'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Received</span>
            {filteredIncoming.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[9px] flex items-center justify-center">
                {filteredIncoming.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('sent')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              subTab === 'sent'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <span>Sent</span>
            {filteredOutgoing.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-[9px] flex items-center justify-center">
                {filteredOutgoing.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {totalFilteredCount === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500 space-y-3">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <p className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
              {subTab === 'received'
                ? 'No incoming requests'
                : subTab === 'sent'
                ? 'No sent requests'
                : 'No connection requests'}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
              {subTab === 'sent'
                ? 'When you send friend requests to other users, they will appear here.'
                : subTab === 'received'
                ? 'When another user sends you a friend request, you can approve or decline it here.'
                : 'Send or receive connection requests across federated domains.'}
            </p>
            <button
              type="button"
              onClick={onOpenConnectContact}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Connect Contact</span>
            </button>
          </div>
        ) : (
          <>
            {/* 1. RECEIVED SECTION */}
            {(subTab === 'all' || subTab === 'received') && filteredIncoming.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 px-1">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Incoming Requests ({filteredIncoming.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredIncoming.map((req) => {
                    const initials = (req.remote_handle || 'U').slice(0, 2).toUpperCase()
                    const cleanDomain = req.remote_instance_url.replace(/^https?:\/\//, '')

                    return (
                      <div
                        key={req.id}
                        className="p-3 rounded-2xl bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700/80 shadow-xs space-y-2.5 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                @{req.remote_handle}
                              </span>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 shrink-0">
                                Pending
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate font-mono">
                              {cleanDomain}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleAcceptFriendRequest(req.remote_handle, req.remote_instance_url)
                            }
                            className="flex-1 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectFriendRequest(req.remote_handle, false)}
                            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Decline</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRejectFriendRequest(req.remote_handle, true, req.remote_instance_url)
                            }
                            title="Block root domain"
                            className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Block</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 2. SENT SECTION */}
            {(subTab === 'all' || subTab === 'sent') && filteredOutgoing.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 px-1 pt-1">
                  <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Sent Requests ({filteredOutgoing.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {filteredOutgoing.map((req) => {
                    const initials = (req.remote_handle || 'U').slice(0, 2).toUpperCase()
                    const cleanDomain = req.remote_instance_url.replace(/^https?:\/\//, '')
                    const isCancelling = cancellingHandle === req.remote_handle
                    const isSelected =
                      activeConv?.otherUser?.username?.toLowerCase() ===
                        req.remote_handle.toLowerCase() ||
                      activeConv?.id === 'conv_' + req.remote_handle.toLowerCase()

                    return (
                      <div
                        key={req.id}
                        onClick={() => handleOutgoingRowClick(req)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-600 shadow-xs'
                            : 'bg-white dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                  @{req.remote_handle}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 animate-spin" />
                                  <span>Pending</span>
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate font-mono mt-0.5">
                                {cleanDomain}
                              </p>
                            </div>
                          </div>

                          {/* Cancel / Unsend Request Button */}
                          <button
                            type="button"
                            disabled={isCancelling}
                            onClick={(e) => handleCancelClick(e, req)}
                            title="Cancel / Unsend this friend request"
                            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 transition-colors cursor-pointer shrink-0 flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
                          </button>
                        </div>

                        <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                          <span className="flex items-center gap-1">
                            <span>Waiting for approval</span>
                          </span>
                          <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                            <span>View status</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
