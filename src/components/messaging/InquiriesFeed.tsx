import React from 'react'
import {
  Store,
  ExternalLink,
  Settings,
  ArrowRight,
  UserCheck,
  Phone,
} from 'lucide-react'
import { CHATZE_HUB_URL, getHubStoreUrl } from '../../lib/hubConfig'
import type { Conversation } from './types'

interface InquiriesFeedProps {
  accountType: 'personal' | 'business'
  currentUser: { handle: string }
  inquiries: any[]
  conversations: Conversation[]
  filteredConversations: Conversation[]
  activeConv: Conversation | null
  setActiveConv: (conv: Conversation) => void
  handleReplyInquiry: (inquiryId: string, asFriend?: boolean) => void
  handleDismissInquiry: (inquiryId: string, blockDomain?: boolean) => void
  replyingInquiryId: string | null
  onOpenProfile: () => void
}

export const InquiriesFeed: React.FC<InquiriesFeedProps> = ({
  accountType,
  currentUser,
  inquiries,
  conversations,
  filteredConversations,
  activeConv,
  setActiveConv,
  handleReplyInquiry,
  handleDismissInquiry,
  replyingInquiryId,
  onOpenProfile,
}) => {
  return (
    <div className="p-3 space-y-3 select-none">
      {accountType === 'personal' ? (
        /* CUSTOMER / PRIVATE ACCOUNT LETTERBOX */
        <div className="space-y-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-100" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">My Customer Letterbox</span>
              </div>
              <a
                href={CHATZE_HUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2 py-0.5 rounded font-bold border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>+ Explore Hub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Track status of inquiries you dropped to shops. Once accepted, chat unlocks in real-time.
            </p>
          </div>

          {/* 1. Pending & Recent Notes sent by this customer */}
          {inquiries.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block px-1">
                Sent Inquiries ({inquiries.length})
              </span>
              {inquiries.map((inq) => {
                const matchingConv = conversations.find((c) => c.status === 'letterbox')
                return (
                  <div key={inq.id} className="p-3 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{inq.category || 'Customer Note'}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          inq.status === 'accepted'
                            ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                            : inq.status === 'dismissed'
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {inq.status === 'accepted' ? 'Accepted' : inq.status === 'dismissed' ? 'Dismissed' : 'Pending Review'}
                      </span>
                    </div>

                    <p className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs border border-zinc-200 dark:border-zinc-800 leading-relaxed font-sans">
                      &quot;{inq.content}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>{new Date(inq.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {inq.status === 'accepted' && (
                        <button
                          onClick={() => {
                            const conv = matchingConv || conversations.find((c) => c.status === 'letterbox')
                            if (conv) setActiveConv(conv)
                          }}
                          className="text-zinc-900 dark:text-zinc-100 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Chat</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {inquiries.length === 0 && (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Store className="w-8 h-8 mx-auto text-zinc-400" />
              <p className="font-semibold text-zinc-900 dark:text-zinc-100">No Letterbox Notes Yet</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                You haven&apos;t dropped any notes to shops. Explore verified stores on Chatze Hub to inquire about products and services!
              </p>
              <a
                href={CHATZE_HUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors cursor-pointer shadow-xs"
              >
                <span>Explore Stores on Chatze Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      ) : (
        /* BUSINESS ACCOUNT LETTERBOX */
        <div className="space-y-3">
          {/* Chatze Hub Integration Status Bar */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 text-zinc-900 dark:text-zinc-100 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">
                  Chatze Hub Gateway Active
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block truncate">
                  Inquiries arrive via spam-shielded Google Auth embed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={getHubStoreUrl(currentUser.handle)}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Preview on Hub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                onClick={onOpenProfile}
                className="p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors"
                title="Hub Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <Store className="w-8 h-8 mx-auto text-zinc-400 mb-2" />
              <p className="font-medium text-zinc-900 dark:text-zinc-100">No Customer Notes Yet</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Customers drop 1 inquiry note into your shop&apos;s Letterbox without spamming server compute.
              </p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-3 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 text-xs shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block truncate">{inq.sender_name}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate block">
                      @{inq.sender_handle} • {inq.sender_root_domain}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      inq.status === 'accepted'
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                        : inq.status === 'dismissed'
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>

                <p className="p-2.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-900 dark:text-zinc-100 text-xs border border-zinc-200 dark:border-zinc-800 leading-relaxed font-sans">
                  &quot;{inq.content}&quot;
                </p>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400 pt-0.5">
                  <span>{new Date(inq.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 font-semibold">1-Card Protected</span>
                </div>

                {inq.status === 'pending' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReplyInquiry(inq.id, false)}
                        disabled={replyingInquiryId === inq.id}
                        title="Accept as Customer Letterbox Chat (Friends list remains clean)"
                        className="flex-1 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{replyingInquiryId === inq.id ? 'Opening...' : 'Accept as Letterbox'}</span>
                      </button>
                      <button
                        onClick={() => handleReplyInquiry(inq.id, true)}
                        disabled={replyingInquiryId === inq.id}
                        title="Accept and promote customer to Trusted Friend under Friends tab"
                        className="flex-1 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 border border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Accept as Friend</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      {inq.content.includes('📞') && (
                        <a
                          href={`tel:${inq.content.split('📞')[1]?.split('•')[0]?.trim() || ''}`}
                          className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg text-[11px] flex items-center gap-1 font-semibold mr-auto cursor-pointer transition-colors"
                          title="Call customer directly"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDismissInquiry(inq.id, false)}
                        className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleDismissInquiry(inq.id, true)}
                        title="Block this root domain permanently"
                        className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {/* Active Customer Chats for merchant */}
          {filteredConversations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block px-1">
                Active Customer Chats ({filteredConversations.length})
              </span>
              {filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-zinc-100 shrink-0">
                      {conv.otherUser.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{conv.otherUser.displayName}</span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{conv.lastMessage?.content || 'Chat open'}</p>
                      <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 items-center gap-1">
                        <Store className="w-2.5 h-2.5" /> Customer Letterbox
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
