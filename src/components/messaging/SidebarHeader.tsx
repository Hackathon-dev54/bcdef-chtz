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
  Sun,
  Moon,
  MessageSquare,
  Sparkles,
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
  totalChatsCount?: number
  hasLetterboxActivity: boolean
  theme?: 'dark' | 'light'
  onToggleTheme?: () => void
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
  totalChatsCount = 0,
  hasLetterboxActivity,
  theme = 'dark',
  onToggleTheme,
  onOpenProfile,
  onOpenIdentity,
  onOpenQr,
  onOpenConnectContact,
  onLogout,
}) => {
  const brandName = (currentUser.handle || 'chatze').toLowerCase() + '.'
  const userInitials = (currentDisplayName || currentUser.display_name || 'ME')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] space-y-4 shrink-0 transition-colors">
      {/* 1. Top Application Bar: Brand Logo, Theme Toggle, Actions, User Avatar */}
      <div className="flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-xs shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
            {brandName}
          </span>
        </div>

        {/* Right: Controls & Profile */}
        <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          {/* Light / Dark Mode Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          <PWAInstallButton className="hidden sm:inline-flex" />
          <NotificationToggleButton userHandle={currentUser.handle} />

          {/* Hub Directory */}
          <a
            href={CHATZE_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Browse Hub Stores"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Store className="w-4 h-4" />
          </a>

          {/* Share instance URL */}
          <button
            type="button"
            onClick={onOpenIdentity}
            title="My Instance Address / QR"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Payment QR */}
          <button
            type="button"
            onClick={onOpenQr}
            title="Payment QR"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenProfile}
            title="Profile & Settings"
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* User Initials Badge (Clickable to Profile) */}
          <button
            type="button"
            onClick={onOpenProfile}
            title={`Logged in as @${currentUser.handle}`}
            className="w-7 h-7 ml-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-bold text-[10px] flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
          >
            {userInitials}
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={onLogout}
            title="Lock / Logout"
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors cursor-pointer ml-0.5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Workspace Heading */}
      <div className="space-y-0.5 pt-1">
        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500 block">
          Workspace
        </span>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Messages
        </h1>
      </div>

      {/* 3. Primary Action Button: + Connect Contact (High Contrast with ⌘K Badge) */}
      <button
        type="button"
        onClick={onOpenConnectContact}
        className="w-full py-2.5 px-3.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-semibold flex items-center justify-between transition-all shadow-xs cursor-pointer group"
      >
        <span className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          <span>New message</span>
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700 font-mono font-medium">
          ⌘K
        </span>
      </button>

      {/* Dedicated Business Letterbox & Portfolio Share Card (if Business) */}
      {accountType === 'business' && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
              <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">Public Letterbox</span>
            </div>
            <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold px-2 py-0.5 rounded-full">
              Storefront
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-white dark:bg-[#121214] p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px]">
            <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-0.5" />
            <span className="font-mono text-zinc-500 dark:text-zinc-400 truncate flex-1 select-all">
              {shopPortfolioUrl ? shopPortfolioUrl.replace(/^https?:\/\//, '') : '/shop'}
            </span>
            <button
              type="button"
              onClick={handleCopyShopUrl}
              className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded text-[10px] font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
            >
              {copiedShopLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-zinc-400" />}
              <span>{copiedShopLink ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
              title="Open storefront"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* 4. Filter Pills */}
      <div className="flex items-center gap-1.5 text-xs">
        <button
          type="button"
          onClick={() => setInboxFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            inboxFilter === 'all'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          <span>All</span>
          {totalChatsCount > 0 && (
            <span className="text-[10px] opacity-80">{totalChatsCount}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setInboxFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            inboxFilter === 'unread'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          Unread
        </button>

        <button
          type="button"
          onClick={() => setInboxFilter('friends')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            inboxFilter === 'friends'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          Friends
        </button>

        <button
          type="button"
          onClick={() => setInboxFilter('letterbox')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
            inboxFilter === 'inquiries' || inboxFilter === 'letterbox'
              ? 'bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
          }`}
        >
          <span>Letterbox</span>
          {pendingInquiryCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-purple-500 text-white font-bold text-[9px] flex items-center justify-center">
              {pendingInquiryCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. Minimalist Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
        />
      </div>
    </div>
  )
}
