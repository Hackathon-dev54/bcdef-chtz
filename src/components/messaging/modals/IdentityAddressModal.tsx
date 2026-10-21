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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center font-bold">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
              Your Instance Address
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
          Share your handle and instance domain with friends so they can add you from their own deployed instance.
        </p>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block">Your Handle</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-bold font-mono text-sm">@{currentUser.handle}</span>
          </div>
          <div>
            <span className="text-zinc-400 dark:text-zinc-500 text-[11px] block">Your Instance Domain</span>
            <span className="text-zinc-700 dark:text-zinc-300 font-mono text-xs break-all">
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
          className="w-full py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
        >
          {copiedLink ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedLink ? 'Copied to Clipboard!' : 'Copy Connection Details'}
        </button>
      </div>
    </div>
  )
}
