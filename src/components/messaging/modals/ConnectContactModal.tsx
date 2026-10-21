import React from 'react'
import { UserPlus, X, Shield, AlertCircle, Globe } from 'lucide-react'

interface ConnectContactModalProps {
  isOpen: boolean
  onClose: () => void
  accountType: 'personal' | 'business'
  myFriendPin: string
  friendHandle: string
  setFriendHandle: (val: string) => void
  friendDomain: string
  setFriendDomain: (val: string) => void
  friendPinInput: string
  setFriendPinInput: (val: string) => void
  addFriendError: string
  sendingRequest: boolean
  handleSendFriendRequest: (e: React.FormEvent) => void
}

export const ConnectContactModal: React.FC<ConnectContactModalProps> = ({
  isOpen,
  onClose,
  accountType,
  myFriendPin,
  friendHandle,
  setFriendHandle,
  friendDomain,
  setFriendDomain,
  friendPinInput,
  setFriendPinInput,
  addFriendError,
  sendingRequest,
  handleSendFriendRequest,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              Connect Contact
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Enter your contact&apos;s username and their deployed Cloudflare Workers URL to send a peer-to-peer connection request.
        </p>

        {accountType === 'business' && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-semibold">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Business Friend Privacy</span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              Your business uses <strong>Private (PIN-Only)</strong> mode. You can manually connect any friend here, or share your PIN:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100 font-mono">{myFriendPin || 'NP-7429'}</strong> with trusted suppliers.
            </p>
          </div>
        )}

        {addFriendError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addFriendError}</span>
          </div>
        )}

        <form onSubmit={handleSendFriendRequest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Username / Handle</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-zinc-400 text-sm">@</span>
              <input
                type="text"
                required
                value={friendHandle}
                onChange={(e) => setFriendHandle(e.target.value)}
                placeholder="e.g. suraj or alice"
                className="w-full pl-8 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Subdomain &amp; Domain / URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
              <input
                type="text"
                required
                value={friendDomain}
                onChange={(e) => setFriendDomain(e.target.value)}
                placeholder="e.g. your-friend.workers.dev"
                className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Friend PIN (Optional)</label>
              <span className="text-[10px] text-zinc-400">Anti-Spam</span>
            </div>
            <input
              type="text"
              value={friendPinInput}
              onChange={(e) => setFriendPinInput(e.target.value.toUpperCase())}
              placeholder="e.g. NP-7429"
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 font-mono tracking-wider placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingRequest || !friendHandle.trim() || !friendDomain.trim()}
              className="px-5 py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              {sendingRequest ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
