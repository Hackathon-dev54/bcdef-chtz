import React from 'react'
import { Shield, KeyRound, RefreshCw, Check, Copy, ExternalLink } from 'lucide-react'

interface PrivacySettingsTabProps {
  accountType: 'personal' | 'business'
  friendPin: string
  regeneratingPin: boolean
  handleRegeneratePin: () => void
  copiedPin: boolean
  copyToClipboard: (text: string, type: 'link' | 'pin') => void
  privacyMode: 'open' | 'pin_only' | 'closed'
  setPrivacyMode: (val: 'open' | 'pin_only' | 'closed') => void
  inquiryLetterboxEnabled: boolean
  setInquiryLetterboxEnabled: (val: boolean) => void
  inviteLink: string
  instanceUrl: string
  copiedLink: boolean
}

export const PrivacySettingsTab: React.FC<PrivacySettingsTabProps> = ({
  accountType,
  friendPin,
  regeneratingPin,
  handleRegeneratePin,
  copiedPin,
  copyToClipboard,
  privacyMode,
  setPrivacyMode,
  inquiryLetterboxEnabled,
  setInquiryLetterboxEnabled,
  inviteLink,
  instanceUrl,
  copiedLink,
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* Business Notice if in Business mode */}
      {accountType === 'business' ? (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>Business Privacy Protection Active</span>
          </div>
          <p className="text-[11px] text-[#e9edef]/90 leading-relaxed">
            To protect your Cloudflare Worker quota from bot attacks and unwanted spam,
            incoming stranger friend requests are <strong>Private Only (PIN-Protected)</strong>.
          </p>
          <ul className="text-[11px] text-[#8696a0] list-disc list-inside space-y-0.5">
            <li>Customers connect with you via your public <strong>Letterbox Portfolio</strong> without friend requests.</li>
            <li>You can still manually add any friend as private directly from your dashboard.</li>
            <li>Trusted business partners can connect if you give them your Private Friend PIN.</li>
          </ul>
        </div>
      ) : null}

      {/* Personal Friend PIN Card */}
      <div className="p-4 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#00a884]" />
            <span className="font-bold text-[#e9edef]">
              {accountType === 'business' ? 'Private Business Friend PIN' : 'Personal Friend PIN'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRegeneratePin}
            disabled={regeneratingPin}
            className="flex items-center gap-1 text-[11px] text-[#8696a0] hover:text-[#00a884] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${regeneratingPin ? 'animate-spin' : ''}`} />
            <span>Change PIN</span>
          </button>
        </div>

        <p className="text-[11px] text-[#8696a0]">
          {accountType === 'business'
            ? 'Share this PIN only with trusted close partners or suppliers who need a direct 1-on-1 friend channel.'
            : 'Give this PIN to friends you trust. When Privacy Mode is set to PIN Only, strangers and bots cannot add you without it.'}
        </p>

        <div className="flex items-center gap-2 p-2.5 bg-[#111b21] border border-[#202c33] rounded-xl">
          <span className="font-mono text-base font-extrabold tracking-widest text-[#00a884] pl-2">
            {friendPin || 'NP-7429'}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard(friendPin, 'pin')}
            className="ml-auto px-3 py-1 bg-[#202c33] hover:bg-[#2a3942] text-xs font-semibold rounded-lg text-[#e9edef] flex items-center gap-1.5 transition-all"
          >
            {copiedPin ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
          </button>
        </div>
      </div>

      {/* Privacy Mode Selector (Only configurable if personal) */}
      {accountType === 'personal' && (
        <div className="space-y-2">
          <label className="font-bold text-[#8696a0] block text-[11px] uppercase tracking-wider">
            Who Can Send You Friend Requests?
          </label>
          <div className="space-y-2">
            <label
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'pin_only'
                  ? 'bg-[#00a884]/10 border-[#00a884]'
                  : 'bg-[#0b141a] border-[#202c33] hover:border-[#8696a0]/40'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="pin_only"
                checked={privacyMode === 'pin_only'}
                onChange={() => setPrivacyMode('pin_only')}
                className="mt-0.5 accent-[#00a884]"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#e9edef] block">
                  🔒 PIN Protected (Recommended for Nepal)
                </span>
                <span className="text-[11px] text-[#8696a0] block">
                  Only people who have your PIN or scan your QR code can add you. Blocks 100% of blind bots.
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'open'
                  ? 'bg-[#00a884]/10 border-[#00a884]'
                  : 'bg-[#0b141a] border-[#202c33] hover:border-[#8696a0]/40'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="open"
                checked={privacyMode === 'open'}
                onChange={() => setPrivacyMode('open')}
                className="mt-0.5 accent-[#00a884]"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#e9edef] block">
                  🌐 Open Federation (Public Search)
                </span>
                <span className="text-[11px] text-[#8696a0] block">
                  Anyone who knows your @handle can send a friend request. (Subject to max 5 pending queue cap).
                </span>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'closed'
                  ? 'bg-[#00a884]/10 border-[#00a884]'
                  : 'bg-[#0b141a] border-[#202c33] hover:border-[#8696a0]/40'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="closed"
                checked={privacyMode === 'closed'}
                onChange={() => setPrivacyMode('closed')}
                className="mt-0.5 accent-[#00a884]"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-[#e9edef] block">
                  🚫 Closed / Incognito
                </span>
                <span className="text-[11px] text-[#8696a0] block">
                  Reject all incoming friend requests automatically. You can still send outbound requests.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Business Letterbox Toggle (For business accounts) */}
      {accountType === 'business' && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-400">Customer Inquiries Letterbox</span>
            <input
              type="checkbox"
              checked={inquiryLetterboxEnabled}
              onChange={(e) => setInquiryLetterboxEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#00a884] cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-[#8696a0]">
            Allows customers on the internet to drop 1 inquiry note (e.g. asking product prices) into your
            queue without ringing your server or sending spam floods.
          </p>
        </div>
      )}

      {/* Copy Invite / Shop Portfolio Link */}
      <div className="p-3 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#e9edef] block">
            {accountType === 'business' ? 'Public Business Portfolio & Letterbox Link' : 'Your Personal Add-Me Link'}
          </span>
          {accountType === 'business' && (
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#00a884] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Preview Landing Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={accountType === 'business' ? `${instanceUrl || window.location.origin}/shop` : inviteLink}
            className="flex-1 px-2.5 py-1.5 bg-[#111b21] border border-[#202c33] rounded-lg text-[11px] text-[#8696a0] font-mono select-all"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(accountType === 'business' ? `${instanceUrl || window.location.origin}/shop` : inviteLink, 'link')}
            className="px-3 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-lg text-xs flex items-center gap-1 shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
