import React from 'react'
import { Share2, X, CheckCheck, Copy } from 'lucide-react'

interface IdentityAddressModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: { handle: string }
  copiedLink: boolean
  setCopiedLink: (val: boolean) => void
}

export const IdentityAddressModal: React.FC<IdentityAddressModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  copiedLink,
  setCopiedLink,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="max-w-md w-full bg-[#111b21] border border-[#202c33] rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00a884]/10 border border-[#00a884]/20 text-[#00a884]">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-[#e9edef]">Your Chatze Address</h3>
          </div>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[#8696a0] leading-relaxed">
          Share your username and instance domain with friends so they can add you from their own deployed app!
        </p>

        <div className="p-4 bg-[#0b141a] rounded-xl border border-[#202c33] space-y-3 text-xs">
          <div>
            <span className="text-[#8696a0] text-[11px] block">Your Username</span>
            <span className="text-[#00a884] font-bold font-mono text-sm">@{currentUser.handle}</span>
          </div>
          <div>
            <span className="text-[#8696a0] text-[11px] block">Your Deployed Domain</span>
            <span className="text-[#e9edef] font-mono text-xs break-all">
              {typeof window !== 'undefined' ? window.location.origin : 'https://your-subdomain.workers.dev'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            const text = `Connect with me on Chatze WhatsApp!\nUsername: @${currentUser.handle}\nInstance: ${window.location.origin}`
            navigator.clipboard.writeText(text)
            setCopiedLink(true)
            setTimeout(() => setCopiedLink(false), 2000)
          }}
          className="w-full py-2.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedLink ? 'Copied to Clipboard!' : 'Copy Connection Details'}
        </button>
      </div>
    </div>
  )
}
