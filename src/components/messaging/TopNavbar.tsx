import React from 'react'
import {
  Sparkles,
  Sun,
  Moon,
  Search,
  Store,
  Share2,
  QrCode,
  Settings,
  LogOut,
} from 'lucide-react'
import { CHATZE_HUB_URL } from '../../lib/hubConfig'
import { PWAInstallButton } from '../PWAInstallButton'
import { NotificationToggleButton } from '../NotificationToggleButton'

interface TopNavbarProps {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  currentDisplayName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenProfile: () => void
  onOpenIdentity: () => void
  onOpenQr: () => void
  onLogout: () => void
  onFocusSearch?: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentUser,
  currentDisplayName,
  theme,
  onToggleTheme,
  onOpenProfile,
  onOpenIdentity,
  onOpenQr,
  onLogout,
  onFocusSearch,
}) => {
  const brandName = (currentUser.handle || 'chatze').toLowerCase() + '.'
  const userInitials = (currentDisplayName || currentUser.display_name || 'ME')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-14 sm:h-16 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors select-none">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
          {brandName}
        </span>
      </div>

      {/* Right: Controls & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-500 dark:text-zinc-400">
        {/* Quick Search Trigger */}
        {onFocusSearch && (
          <button
            type="button"
            onClick={onFocusSearch}
            title="Search chats"
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Real App Menus & Utilities */}
        <PWAInstallButton className="hidden md:inline-flex" />
        <NotificationToggleButton userHandle={currentUser.handle} />

        {/* Hub Directory */}
        <a
          href={CHATZE_HUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Browse Hub Store Directory"
          className="hidden sm:inline-flex p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <Store className="w-4 h-4" />
        </a>

        {/* Share Instance Address */}
        <button
          type="button"
          onClick={onOpenIdentity}
          title="My Instance Address / QR"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Payment QR */}
        <button
          type="button"
          onClick={onOpenQr}
          title="Payment QR"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenProfile}
          title="Profile & Settings"
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Initials Avatar */}
        <button
          type="button"
          onClick={onOpenProfile}
          title={`Logged in as @${currentUser.handle}`}
          className="w-8 h-8 ml-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-bold text-xs flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer shadow-xs"
        >
          {userInitials}
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={onLogout}
          title="Lock / Logout"
          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
