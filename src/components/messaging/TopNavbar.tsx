import React from 'react'
import { Sparkles, Sun, Moon, Search } from 'lucide-react'

interface TopNavbarProps {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  currentDisplayName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenSettings: () => void
  onFocusSearch?: () => void
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentUser,
  currentDisplayName,
  theme,
  onToggleTheme,
  onOpenSettings,
  onFocusSearch,
}) => {
  const brandName = (currentUser.handle || 'chatze').toLowerCase() + '.'
  const userInitials = (currentDisplayName || currentUser.display_name || 'ME')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="h-14 sm:h-16 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 transition-colors select-none">
      {/* Left: Brand Identity (✦ handle.) */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
          {brandName}
        </span>
      </div>

      {/* Right: Search, Sun/Moon Theme Toggle, and User Initials Circle (Matching Reference Exactly) */}
      <div className="flex items-center gap-2 sm:gap-3 text-zinc-500 dark:text-zinc-400">
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
