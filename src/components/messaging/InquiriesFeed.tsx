import React from 'react'
import { Store, ExternalLink, ArrowRight, Settings, UserCheck, Phone } from 'lucide-react'
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
    <div className="p-3 space-y-3">
      {accountType === 'personal' ? (
        /* CUSTOMER / PRIVATE ACCOUNT LETTERBOX */
        <div className="space-y-3">
          <div className="p-3 bg-gradient-to-r from-purple-950/40 via-[#111b21] to-[#00a884]/10 border border-purple-500/30 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-bold text-xs text-[#e9edef]">My Customer Letterbox</span>
              </div>
              <a
                href={CHATZE_HUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] bg-[#00a884]/20 text-[#00a884] hover:bg-[#00a884]/30 px-2 py-0.5 rounded font-bold border border-[#00a884]/30 flex items-center gap-1 cursor-pointer"
              >
                <span>+ Explore Hub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <p className="text-[11px] text-[#8696a0]">
              Track status of inquiries you dropped to shops. Once accepted, chat unlocks in real-time.
            </p>
          </div>

          {/* 1. Pending & Recent Notes sent by this customer */}
          {inquiries.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider block px-1">
                Sent Inquiries ({inquiries.length})
              </span>
              {inquiries.map((inq) => {
                const matchingConv = conversations.find((c) => c.status === 'letterbox')
                return (
                  <div key={inq.id} className="p-3 bg-[#111b21] border border-[#202c33] rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#e9edef]">{inq.category || 'Customer Note'}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          inq.status === 'accepted'
                            ? 'bg-[#00a884]/20 text-[#00a884]'
                            : inq.status === 'dismissed'
                            ? 'bg-[#202c33] text-[#8696a0]'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {inq.status === 'accepted' ? 'Accepted' : inq.status === 'dismissed' ? 'Dismissed' : 'Pending Review'}
                      </span>
                    </div>

                    <p className="p-2.5 bg-[#0b141a] rounded-lg text-[#e9edef] text-xs border border-[#202c33]/70 leading-relaxed font-sans">
                      "{inq.content}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
                      <span>{new Date(inq.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {inq.status === 'accepted' && (
                        <button
                          onClick={() => {
                            const conv = matchingConv || conversations.find((c) => c.status === 'letterbox')
                            if (conv) setActiveConv(conv)
                          }}
                          className="text-[#00a884] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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

          {/* 2. Accepted 2-way Customer Chats for this personal account */}
          {filteredConversations.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#202c33]/60">
              <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider block px-1">
                Active Customer Chats ({filteredConversations.length})
              </span>
              {filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 rounded-xl border border-[#202c33] flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-[#2a3942]' : 'bg-[#111b21] hover:bg-[#202c33]/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                      {conv.otherUser.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#e9edef] truncate">{conv.otherUser.displayName}</span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-[#8696a0]">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8696a0] truncate mt-0.5">{conv.lastMessage?.content || 'Chat open'}</p>
                      <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 items-center gap-1">
                        <Store className="w-2.5 h-2.5" /> Customer Letterbox
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {inquiries.length === 0 && filteredConversations.length === 0 && (
            <div className="p-8 text-center text-xs text-[#8696a0] space-y-3 bg-[#111b21] rounded-2xl border border-[#202c33]">
              <Store className="w-8 h-8 mx-auto text-purple-400/60" />
              <p className="font-semibold text-[#e9edef]">No Letterbox Notes Yet</p>
              <p className="text-[11px] text-[#8696a0] max-w-xs mx-auto">
                You haven't dropped any notes to shops. Explore verified stores on Chatze Hub to inquire about products and services!
              </p>
              <a
                href={CHATZE_HUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#00a884] text-[#111b21] rounded-xl font-bold text-xs hover:bg-[#02906f] transition-all cursor-pointer shadow-md"
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
          <div className="p-3 bg-[#111b21] border border-[#202c33] rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Store className="w-4 h-4 text-[#00a884] shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-[#e9edef] block truncate">
                  Chatze Hub Gateway Active
                </span>
                <span className="text-[10px] text-[#8696a0] block truncate">
                  Inquiries arrive via spam-shielded Google Auth embed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={getHubStoreUrl(currentUser.handle)}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Preview on Hub</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                onClick={onOpenProfile}
                className="p-1 text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] hover:bg-[#2a3942] rounded-lg cursor-pointer"
                title="Hub Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {inquiries.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8696a0] space-y-2 bg-[#111b21] rounded-2xl border border-[#202c33]">
              <Store className="w-8 h-8 mx-auto text-[#8696a0]/40 mb-2" />
              <p className="font-medium text-[#e9edef]">No Customer Notes Yet</p>
              <p className="text-[11px] text-[#8696a0]">
                Customers drop 1 inquiry note into your shop's Letterbox without spamming server compute.
              </p>
            </div>
          ) : (
            inquiries.map((inq) => (
              <div key={inq.id} className="p-3 bg-[#111b21] border border-[#202c33] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="font-bold text-[#e9edef] block truncate">{inq.sender_name}</span>
                    <span className="text-[10px] text-[#8696a0] truncate block">
                      @{inq.sender_handle} • {inq.sender_root_domain}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      inq.status === 'accepted'
                        ? 'bg-[#00a884]/20 text-[#00a884]'
                        : inq.status === 'dismissed'
                        ? 'bg-[#202c33] text-[#8696a0]'
                        : 'bg-purple-500/20 text-purple-400'
                    }`}
                  >
                    {inq.status}
                  </span>
                </div>

                <p className="p-2.5 bg-[#0b141a] rounded-lg text-[#e9edef] text-xs border border-[#202c33]/70 leading-relaxed font-sans">
                  "{inq.content}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#8696a0] pt-0.5">
                  <span>{new Date(inq.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  <span className="text-purple-400 font-semibold">1-Card Protected</span>
                </div>

                {inq.status === 'pending' && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleReplyInquiry(inq.id, false)}
                        disabled={replyingInquiryId === inq.id}
                        title="Accept as Customer Letterbox Chat (Friends list remains clean)"
                        className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>{replyingInquiryId === inq.id ? 'Opening...' : 'Accept as Letterbox'}</span>
                      </button>
                      <button
                        onClick={() => handleReplyInquiry(inq.id, true)}
                        disabled={replyingInquiryId === inq.id}
                        title="Accept and promote customer to Trusted Friend under Friends tab"
                        className="flex-1 py-1.5 bg-purple-600/25 hover:bg-purple-600/35 border border-purple-500/40 text-purple-200 font-bold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                        <span>Accept as Friend</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      {inq.content.includes('📞') && (
                        <a
                          href={`tel:${inq.content.split('📞')[1]?.split('•')[0]?.trim() || ''}`}
                          className="px-2.5 py-1 bg-[#202c33] hover:bg-[#2a3942] text-[#00a884] rounded-lg text-[11px] flex items-center gap-1 font-semibold mr-auto cursor-pointer"
                          title="Call customer directly"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      )}
                      <button
                        onClick={() => handleDismissInquiry(inq.id, false)}
                        className="px-2.5 py-1 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] rounded-lg text-[11px] transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleDismissInquiry(inq.id, true)}
                        title="Block this root domain permanently"
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] transition-all cursor-pointer"
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
            <div className="space-y-2 pt-2 border-t border-[#202c33]/60">
              <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider block px-1">
                Active Customer Chats ({filteredConversations.length})
              </span>
              {filteredConversations.map((conv) => {
                const isActive = activeConv?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`p-3 rounded-xl border border-[#202c33] flex items-start gap-3 cursor-pointer transition-colors ${
                      isActive ? 'bg-[#2a3942]' : 'bg-[#111b21] hover:bg-[#202c33]/50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-xs text-purple-300 shrink-0">
                      {conv.otherUser.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#e9edef] truncate">{conv.otherUser.displayName}</span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-[#8696a0]">
                            {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8696a0] truncate mt-0.5">{conv.lastMessage?.content || 'Chat open'}</p>
                      <span className="inline-flex mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 items-center gap-1">
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
