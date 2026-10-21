import React from 'react'
import { Lock, LogIn } from 'lucide-react'

interface LetterboxAuthRequiredProps {
  onTriggerHubLogin: () => void
}

export function LetterboxAuthRequired({ onTriggerHubLogin }: LetterboxAuthRequiredProps) {
  return (
    <div className="p-4 sm:p-6 flex-1 flex items-center justify-center overflow-y-auto">
      <div className="max-w-md w-full bg-[#111b21] border border-amber-500/30 rounded-3xl p-6 text-center space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-white">Google Sign-In Required on Chatze Hub</h2>
          <p className="text-xs text-[#8696a0] leading-relaxed">
            To protect merchants from spam and guarantee authentic customer inquiries, notes require a verified Google identity. Sign in with Google on Chatze Hub to unlock this Letterbox.
          </p>
        </div>
        <button
          onClick={onTriggerHubLogin}
          className="w-full py-3 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs transition-all shadow-md inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google on Chatze Hub</span>
        </button>
      </div>
    </div>
  )
}
