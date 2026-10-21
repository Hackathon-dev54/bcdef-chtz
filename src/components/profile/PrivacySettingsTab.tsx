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
    <div className="space-y-4 text-xs select-none">
      {/* Business Notice if in Business mode */}
      {accountType === 'business' ? (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-bold">
            <Shield className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Business Privacy Protection Active</span>
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            To protect your Cloudflare Worker quota from bot attacks and unwanted spam,
            incoming stranger friend requests are <strong>Private Only (PIN-Protected)</strong>.
          </p>
          <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 list-disc list-inside space-y-0.5">
            <li>Customers connect with you via your public <strong>Letterbox Portfolio</strong> without friend requests.</li>
            <li>You can still manually add any friend as private directly from your dashboard.</li>
            <li>Trusted business partners can connect if you give them your Private Friend PIN.</li>
          </ul>
        </div>
      ) : null}

      {/* Personal Friend PIN Card */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              {accountType === 'business' ? 'Private Business Friend PIN' : 'Personal Friend PIN'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRegeneratePin}
            disabled={regeneratingPin}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${regeneratingPin ? 'animate-spin' : ''}`} />
            <span>Change PIN</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          {accountType === 'business'
            ? 'Share this PIN only with trusted close partners or suppliers who need a direct 1-on-1 friend channel.'
            : 'Give this PIN to friends you trust. When Privacy Mode is set to PIN Only, strangers and bots cannot add you without it.'}
        </p>

        <div className="flex items-center gap-2 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
          <span className="font-mono text-base font-extrabold tracking-widest text-zinc-900 dark:text-zinc-100 pl-2">
            {friendPin || 'NP-7429'}
          </span>
          <button
            type="button"
            onClick={() => copyToClipboard(friendPin, 'pin')}
            className="ml-auto px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold rounded-lg text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedPin ? 'Copied' : 'Copy PIN'}</span>
          </button>
        </div>
      </div>

      {/* Privacy Mode Selector (Only configurable if personal) */}
      {accountType === 'personal' && (
        <div className="space-y-2">
          <label className="font-bold text-zinc-700 dark:text-zinc-300 block text-[11px] uppercase tracking-wider">
            Who Can Send You Friend Requests?
          </label>
          <div className="space-y-2">
            <label
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'pin_only'
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="pin_only"
                checked={privacyMode === 'pin_only'}
                onChange={() => setPrivacyMode('pin_only')}
                className="mt-0.5 accent-zinc-900 dark:accent-white cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                  🔒 PIN Protected (Recommended)
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-relaxed">
                  Only people who have your PIN or scan your QR code can add you. Blocks 100% of blind bots.
                </span>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'open'
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="open"
                checked={privacyMode === 'open'}
                onChange={() => setPrivacyMode('open')}
                className="mt-0.5 accent-zinc-900 dark:accent-white cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                  🌐 Open Federation (Public Search)
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-relaxed">
                  Anyone who knows your @handle can send a friend request. (Subject to max 5 pending queue cap).
                </span>
              </div>
            </label>

            <label
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                privacyMode === 'closed'
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <input
                type="radio"
                name="privacyMode"
                value="closed"
                checked={privacyMode === 'closed'}
                onChange={() => setPrivacyMode('closed')}
                className="mt-0.5 accent-zinc-900 dark:accent-white cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                  🚫 Closed / Incognito
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block leading-relaxed">
                  Reject all incoming friend requests automatically. You can still send outbound requests.
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Business Letterbox Toggle (For business accounts) */}
      {accountType === 'business' && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">Customer Inquiries Letterbox</span>
            <input
              type="checkbox"
              checked={inquiryLetterboxEnabled}
              onChange={(e) => setInquiryLetterboxEnabled(e.target.checked)}
              className="w-4 h-4 accent-zinc-900 dark:accent-white cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Allows customers on the internet to drop 1 inquiry note into your queue without ringing your server or sending spam floods.
          </p>
        </div>
      )}

      {/* Copy Invite / Shop Portfolio Link */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
            {accountType === 'business' ? 'Public Business Portfolio & Letterbox Link' : 'Your Personal Add-Me Link'}
          </span>
          {accountType === 'business' && (
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:underline flex items-center gap-1 font-semibold"
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
            value={accountType === 'business' ? `${instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/shop` : inviteLink}
            className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-700 dark:text-zinc-300 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={() => copyToClipboard(accountType === 'business' ? `${instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/shop` : inviteLink, 'link')}
            className="px-3.5 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
