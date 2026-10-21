import { Settings, ChevronDown } from 'lucide-react'

interface SidebarFooterProps {
  currentUser: { handle: string; display_name: string }
  currentDisplayName: string
  onOpenProfile: () => void
  isOnline?: boolean
  onTogglePresence?: () => void
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  currentUser,
  currentDisplayName,
  onOpenProfile,
  isOnline = true,
  onTogglePresence,
}) => {
  const userInitials = (currentDisplayName || currentUser.display_name || 'ME')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#121214] flex items-center justify-between shrink-0 select-none transition-colors">
      {/* User Info */}
      <div
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 transition-opacity min-w-0"
        title="Open Profile & Settings"
      >
        <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-800 dark:text-zinc-200 shrink-0 shadow-xs">
          {userInitials}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
            <span className="truncate">{currentDisplayName || currentUser.display_name}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />
          </div>
          <div
            onClick={(e) => {
              if (onTogglePresence) {
                e.stopPropagation()
                onTogglePresence()
              }
            }}
            className="flex items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title={isOnline ? 'Online (Click to go Offline)' : 'Offline (Click to go Online)'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400 dark:bg-zinc-500'
              }`}
            />
            <span>{isOnline ? 'Available' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Settings Action */}
      <button
        type="button"
        onClick={onOpenProfile}
        title="Settings"
        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  )
}
