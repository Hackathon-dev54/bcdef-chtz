import React from 'react'
import { X, User, Store, Shield, Globe } from 'lucide-react'
import type { ProfileTab } from './types'

interface ProfileHeaderProps {
  accountType: 'personal' | 'business'
  activeTab: ProfileTab
  setActiveTab: (tab: ProfileTab) => void
  onClose: () => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  accountType,
  activeTab,
  setActiveTab,
  onClose,
}) => {
  return (
    <>
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-white dark:bg-[#121214] border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs">
            {accountType === 'business' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Settings & Preferences
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Manage profile identity, storefront, cloud edge storage & privacy
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Switcher Pills */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0e0e10] px-4 pt-2 gap-1.5 shrink-0 text-xs overflow-x-auto no-scrollbar transition-colors">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'account'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Identity & Profile
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Privacy & Anti-Spam
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'hub'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" /> Chatze Hub & Letterbox
        </button>
        <button
          onClick={() => setActiveTab('edge')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'edge'
              ? 'border-zinc-900 text-zinc-900 dark:border-white dark:text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Edge & Storage
        </button>
      </div>
    </>
  )
}
