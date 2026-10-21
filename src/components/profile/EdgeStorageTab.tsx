import React from 'react'
import { CheckCircle2 } from 'lucide-react'

export const EdgeStorageTab: React.FC = () => {
  return (
    <div className="space-y-3 text-xs">
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-2.5">
        <span className="font-bold text-[#e9edef] block text-[11px] uppercase tracking-wider text-[#8696a0]">
          Cloudflare Edge Status
        </span>
        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between py-1 border-b border-[#202c33]/40">
            <span className="text-[#8696a0]">Edge PoP Region:</span>
            <span className="font-semibold text-[#00a884] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse"></span>
              Kathmandu (KTM) / Edge Network
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#202c33]/40">
            <span className="text-[#8696a0]">D1 SQLite Database:</span>
            <span className="font-semibold text-[#e9edef]">Active (5 GB Edge Native)</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#202c33]/40">
            <span className="text-[#8696a0]">WebPush VAPID Keypair:</span>
            <span className="font-semibold text-[#00a884]">P-256 Verified in .env</span>
          </div>
          <div className="flex items-center justify-between py-1 border-b border-[#202c33]/40">
            <span className="text-[#8696a0]">Daily Worker Quota:</span>
            <span className="font-semibold text-[#e9edef]">100,000 Free Invocations/Day</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-[#8696a0]">Anti-Spam Security Shield:</span>
            <span className="font-semibold text-[#00a884]">Active (eTLD+1 Root Protection)</span>
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#00a884]/10 border border-[#00a884]/20 rounded-xl space-y-1 text-[11px] text-[#e9edef]">
        <span className="font-bold flex items-center gap-1 text-[#00a884]">
          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Data Sovereignty
        </span>
        <p className="text-[#8696a0] leading-relaxed">
          Your messages, contacts, and images stay completely inside your private Cloudflare D1 database.
          No central company can read or sell your chat history.
        </p>
      </div>
    </div>
  )
}
