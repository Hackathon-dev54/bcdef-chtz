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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-[#111b21] border border-[#202c33] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#e9edef]">Connect Contact Instance</h3>
          </div>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8696a0] leading-relaxed">
          Enter your contact's username and their deployed Cloudflare Workers URL or domain to send an encrypted connection request.
        </p>

        {accountType === 'business' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1.5 text-xs text-[#e9edef]">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Business Friend Request Privacy</span>
            </div>
            <p className="text-[11px] text-[#8696a0] leading-snug">
              Incoming friend requests to your business are locked to <strong>Private (PIN-Only)</strong> to stop automated bots from consuming your free Cloudflare quota.
              You can manually add any private friend here, or share your Private PIN:{' '}
              <strong className="text-[#00a884] font-mono tracking-wider">{myFriendPin || 'NP-7429'}</strong> with trusted suppliers.
            </p>
          </div>
        )}

        {addFriendError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addFriendError}</span>
          </div>
        )}

        <form onSubmit={handleSendFriendRequest} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8696a0]">Contact's Username / Handle</label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-[#8696a0] text-sm">@</span>
              <input
                type="text"
                required
                value={friendHandle}
                onChange={(e) => setFriendHandle(e.target.value)}
                placeholder="e.g. suraj or alice"
                className="w-full pl-8 pr-3.5 py-2.5 bg-[#202c33] border border-[#222e35] rounded-xl text-xs sm:text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8696a0]">Contact's Subdomain & Domain / URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-3 text-[#8696a0]" />
              <input
                type="text"
                required
                value={friendDomain}
                onChange={(e) => setFriendDomain(e.target.value)}
                placeholder="e.g. your-friend.workers.dev"
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#202c33] border border-[#222e35] rounded-xl text-xs sm:text-sm text-[#e9edef] focus:outline-none focus:border-[#00a884]"
              />
            </div>
            <p className="text-[10px] text-[#8696a0] pl-1">
              Their Cloudflare Workers domain (e.g. username.workers.dev)
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#8696a0]">Friend PIN (Optional / Handshake)</label>
              <span className="text-[10px] text-[#00a884] font-medium">Anti-Spam Shield</span>
            </div>
            <input
              type="text"
              value={friendPinInput}
              onChange={(e) => setFriendPinInput(e.target.value.toUpperCase())}
              placeholder="e.g. NP-7429 (leave blank if they have open privacy)"
              className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222e35] rounded-xl text-xs sm:text-sm text-[#e9edef] font-mono tracking-wider focus:outline-none focus:border-[#00a884]"
            />
            <p className="text-[10px] text-[#8696a0] pl-1">
              Required if the contact has enabled PIN-Protected mode to stop spam bots.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs text-[#8696a0] hover:text-[#e9edef]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendingRequest || !friendHandle.trim() || !friendDomain.trim()}
              className="px-5 py-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-[#111b21] font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00a884]/20"
            >
              {sendingRequest ? 'Dispatching...' : 'Send Friend Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
