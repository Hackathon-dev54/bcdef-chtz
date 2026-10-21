import React from 'react'
import { Sparkles, Sun, Moon, Search, Bell } from 'lucide-react'

interface TopNavbarProps {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  currentDisplayName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenSettings: () => void
  onOpenNotifications?: () => void
  hasUnread?: boolean
  onFocusSearch?: () => void
  isOnline?: boolean
  onTogglePresence?: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentUser,
  currentDisplayName,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenNotifications,
  hasUnread = false,
  onFocusSearch,
  isOnline = true,
  onTogglePresence,
}) => {
  const brandName = (currentUser.handle || 'chatze').toLowerCase() + '.'
  const userInitials = (currentDisplayName || currentUser.display_name || 'ME')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-14 sm:h-16 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors select-none">
      {/* Left: Brand Identity (✦ handle.) & Presence Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
            {brandName}
          </span>
        </div>

        {/* WhatsApp-style Presence Switcher (Online / Offline) */}
        {onTogglePresence && (
          <button
            type="button"
            onClick={onTogglePresence}
            title={
              isOnline
                ? 'Online: Live 0ms push active. Click to go Offline (pauses stream to save data and server triggers).'
                : 'Offline: Stream paused (0 background invocations). Click to go Online & live sync.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border select-none ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-transform ${
                isOnline
                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse'
                  : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
            <span className="font-semibold text-[10px] sm:text-[11px]">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </button>
        )}
      </div>

      {/* Right: Search, Notifications, Theme Toggle, and User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 text-zinc-500 dark:text-zinc-400">
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

        {/* Notification Bell Icon */}
        <button
          type="button"
          onClick={onOpenNotifications || onOpenSettings}
          title="Notifications & Alerts"
          className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white ring-2 ring-white dark:ring-[#121214]" />
          )}
        </button>

        {/* Light / Dark Mode Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Initials Avatar Circle (Opens Settings Page) */}
        <button
          type="button"
          onClick={onOpenSettings}
          title={`Settings (@${currentUser.handle})`}
          className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 font-bold text-xs flex items-center justify-center hover:opacity-85 transition-opacity cursor-pointer shadow-xs ml-1"
        >
          {userInitials}
        </button>
      </div>
    </header>
  )
}
