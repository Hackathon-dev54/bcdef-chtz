import React from 'react'
import {
  Search,
  Settings,
  Store,
  Share2,
  QrCode,
  LogOut,
  Globe,
  Check,
  Copy,
  ExternalLink,
  Shield,
  UserPlus,
} from 'lucide-react'
import { CHATZE_HUB_URL } from '../../lib/hubConfig'
import { PWAInstallButton } from '../PWAInstallButton'
import { NotificationToggleButton } from '../NotificationToggleButton'
import type { InboxFilter } from './types'

interface SidebarHeaderProps {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  currentDisplayName: string
  accountType: 'personal' | 'business'
  shopPortfolioUrl: string
  copiedShopLink: boolean
  handleCopyShopUrl: () => void
  handleShareShopUrl: () => void
  searchQuery: string
  setSearchQuery: (val: string) => void
  inboxFilter: InboxFilter
  setInboxFilter: (filter: InboxFilter) => void
  pendingInquiryCount: number
  inquiriesCount: number
  hasLetterboxActivity: boolean
  onOpenProfile: () => void
  onOpenIdentity: () => void
  onOpenQr: () => void
  onOpenConnectContact: () => void
  onLogout: () => void
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  currentUser,
  currentDisplayName,
  accountType,
  shopPortfolioUrl,
  copiedShopLink,
  handleCopyShopUrl,
  handleShareShopUrl,
  searchQuery,
  setSearchQuery,
  inboxFilter,
  setInboxFilter,
  pendingInquiryCount,
  inquiriesCount,
  hasLetterboxActivity,
  onOpenProfile,
  onOpenIdentity,
  onOpenQr,
  onOpenConnectContact,
  onLogout,
}) => {
  return (
    <div className="p-3.5 border-b border-[#202c33] space-y-3 bg-[#202c33]/40">
      <div className="flex items-center justify-between">
        <div
          onClick={onOpenProfile}
          title="Click to customize Profile & Anti-Spam Settings"
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/30 flex items-center justify-center font-bold text-xs text-[#00a884] shrink-0">
            {currentDisplayName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[#e9edef] leading-tight truncate max-w-[130px] sm:max-w-[160px]">
              {currentDisplayName}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8696a0]">
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse"></span>
              <span className="truncate">@{currentUser.handle}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <PWAInstallButton className="hidden sm:inline-flex" />
          <NotificationToggleButton userHandle={currentUser.handle} />
          <button
            onClick={onOpenProfile}
            title="Profile & Anti-Spam Settings"
            className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <a
            href={CHATZE_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Browse Chatze Hub Directory (Discover Sovereign Stores)"
            className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
          >
            <Store className="w-4 h-4" />
          </a>
          <button
            onClick={onOpenIdentity}
            title="My Instance Address / Share"
            className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenQr}
            title="Payment QR"
            className="p-2 rounded-full text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] transition-colors"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button
            onClick={onLogout}
            title="Lock / Logout"
            className="p-2 rounded-full text-[#8696a0] hover:text-rose-400 hover:bg-[#202c33] transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dedicated Business Letterbox & Portfolio Share Card */}
      {accountType === 'business' && (
        <div className="p-3 bg-gradient-to-br from-purple-950/40 via-[#111b21] to-[#00a884]/10 border border-purple-500/30 rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold text-xs text-[#e9edef]">Public Letterbox & Portfolio</span>
            </div>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
              Share Hub
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0b141a] p-1.5 rounded-xl border border-[#202c33]">
            <Globe className="w-3.5 h-3.5 text-[#8696a0] shrink-0 ml-1" />
            <span className="text-[11px] font-mono text-[#8696a0] truncate flex-1 select-all">
              {shopPortfolioUrl ? shopPortfolioUrl.replace(/^https?:\/\//, '') : '/shop'}
            </span>
            <button
              type="button"
              onClick={handleCopyShopUrl}
              title="Copy Customer Share Link"
              className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              {copiedShopLink ? <Check className="w-3 h-3 text-[#00a884]" /> : <Copy className="w-3 h-3 text-[#8696a0]" />}
              <span>{copiedShopLink ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={handleShareShopUrl}
              title="Share link"
              className="p-1 text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              title="Open Customer Landing Page"
              className="p-1 text-[#8696a0] hover:text-[#00a884] hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
            <span className="flex items-center gap-1 text-amber-400">
              <Shield className="w-3 h-3" /> Friend Requests: Private Only
            </span>
            <button
              onClick={() => setInboxFilter('inquiries')}
              className="text-purple-400 font-semibold hover:underline cursor-pointer"
            >
              Letterbox ({inquiriesCount})
            </button>
          </div>
        </div>
      )}

      {/* Connect Contact Button */}
      <button
        onClick={onOpenConnectContact}
        className="w-full py-2.5 px-3 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-[#00a884]/20 cursor-pointer"
      >
        <UserPlus className="w-4 h-4" /> + Connect Contact (Subdomain / Domain)
      </button>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8696a0]" />
        <input
          type="text"
          placeholder="Search or start new chat..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#202c33] border border-[#222e35] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884] transition-all"
        />
      </div>

      {/* Chat Queue Filter Pills */}
      <div className="flex items-center gap-1 bg-[#0b141a]/60 p-1 rounded-xl border border-[#202c33] text-[11px]">
        <button
          onClick={() => setInboxFilter('all')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            inboxFilter === 'all' ? 'bg-[#202c33] text-[#e9edef]' : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setInboxFilter('friends')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            inboxFilter === 'friends' ? 'bg-[#202c33] text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setInboxFilter('letterbox')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
            inboxFilter === 'inquiries' || inboxFilter === 'letterbox'
              ? 'bg-[#202c33] text-purple-400 font-bold'
              : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <span>Letterbox</span>
          {accountType === 'business' && pendingInquiryCount > 0 ? (
            <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-bold text-[9px] flex items-center justify-center">
              {pendingInquiryCount}
            </span>
          ) : (
            hasLetterboxActivity && <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          )}
        </button>
        <button
          onClick={() => setInboxFilter('unread')}
          className={`flex-1 py-1 rounded-lg font-medium transition-all ${
            inboxFilter === 'unread' ? 'bg-[#202c33] text-[#00a884]' : 'text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          Unread
        </button>
      </div>
    </div>
  )
}
