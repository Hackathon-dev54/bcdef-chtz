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
      {/* Modal Top Header */}
      <div className="p-4 bg-[#202c33]/60 border-b border-[#202c33] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00a884]/20 border border-[#00a884]/30 flex items-center justify-center text-[#00a884]">
            {accountType === 'business' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#e9edef] leading-tight">Profile & Account Settings</h2>
            <p className="text-[11px] text-[#8696a0]">Customize your profile, account type & anti-spam privacy</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[#202c33] bg-[#0b141a]/60 px-4 pt-2 gap-2 shrink-0 text-xs">
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'account'
              ? 'border-[#00a884] text-[#00a884]'
              : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <User className="w-3.5 h-3.5" /> Identity & Profile
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'privacy'
              ? 'border-[#00a884] text-[#00a884]'
              : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" /> Privacy & Anti-Spam
        </button>
        <button
          onClick={() => setActiveTab('hub')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'hub'
              ? 'border-[#00a884] text-[#00a884]'
              : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-amber-400" /> Chatze Hub
        </button>
        <button
          onClick={() => setActiveTab('edge')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'edge'
              ? 'border-[#00a884] text-[#00a884]'
              : 'border-transparent text-[#8696a0] hover:text-[#e9edef]'
          }`}
        >
          <Globe className="w-3.5 h-3.5" /> Edge & Node Info
        </button>
      </div>
    </>
  )
}
