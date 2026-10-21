import React from 'react'
import { User, Store, Check } from 'lucide-react'
import { BUSINESS_CATEGORIES } from './types'

interface AccountSettingsTabProps {
  accountType: 'personal' | 'business'
  setAccountType: (val: 'personal' | 'business') => void
  displayName: string
  setDisplayName: (val: string) => void
  handle: string
  businessCategory: string
  setBusinessCategory: (val: string) => void
  businessLocation: string
  setBusinessLocation: (val: string) => void
  businessPhone: string
  setBusinessPhone: (val: string) => void
  businessHours: string
  setBusinessHours: (val: string) => void
  deliveryInfo: string
  setDeliveryInfo: (val: string) => void
  catalogTags: string
  setCatalogTags: (val: string) => void
  faqText: string
  setFaqText: (val: string) => void
  parsedFaqsLength: number
  faqUploadError: string
  handleFaqFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  bio: string
  setBio: (val: string) => void
}

export const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  accountType,
  setAccountType,
  displayName,
  setDisplayName,
  handle,
  businessCategory,
  setBusinessCategory,
  businessLocation,
  setBusinessLocation,
  businessPhone,
  setBusinessPhone,
  businessHours,
  setBusinessHours,
  deliveryInfo,
  setDeliveryInfo,
  catalogTags,
  setCatalogTags,
  faqText,
  setFaqText,
  parsedFaqsLength,
  faqUploadError,
  handleFaqFileUpload,
  bio,
  setBio,
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* Account Type Selector Card */}
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-3">
        <label className="font-bold text-[#e9edef] block text-[11px] uppercase tracking-wider text-[#8696a0]">
          Account Type (Nepal First Mode)
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setAccountType('personal')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
              accountType === 'personal'
                ? 'bg-[#00a884]/15 border-[#00a884] text-[#e9edef]'
                : 'bg-[#111b21] border-[#202c33] text-[#8696a0] hover:border-[#8696a0]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-[#e9edef]">
                <User className="w-3.5 h-3.5 text-[#00a884]" /> Personal Account
              </span>
              {accountType === 'personal' && <Check className="w-3.5 h-3.5 text-[#00a884]" />}
            </div>
            <p className="text-[10px] text-[#8696a0] leading-snug">
              For individual chatting, friends & family. Protected with private Friend PIN.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAccountType('business')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
              accountType === 'business'
                ? 'bg-amber-500/15 border-amber-500 text-[#e9edef]'
                : 'bg-[#111b21] border-[#202c33] text-[#8696a0] hover:border-[#8696a0]/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-[#e9edef]">
                <Store className="w-3.5 h-3.5 text-amber-400" /> Business / Shop
              </span>
              {accountType === 'business' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <p className="text-[10px] text-[#8696a0] leading-snug">
              For pasals, brands & freelancers. Activates customer inquiry letterbox.
            </p>
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="font-semibold text-[#8696a0]">
          {accountType === 'business' ? 'Shop / Brand Name' : 'Your Display Name'}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={accountType === 'business' ? 'e.g. Kathmandu Threads' : 'e.g. Aarav Sharma'}
          required
          className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
        />
      </div>

      {/* Handle (Read-only instance handle) */}
      <div className="space-y-1.5">
        <label className="font-semibold text-[#8696a0]">Handle (@Username)</label>
        <div className="flex items-center px-3 py-2 bg-[#0b141a]/60 border border-[#202c33] rounded-xl text-xs text-[#8696a0]">
          <span className="text-[#00a884] font-bold mr-1">@</span>
          <span>{handle}</span>
          <span className="ml-auto text-[10px] bg-[#202c33] px-2 py-0.5 rounded text-[#8696a0]">
            Primary Admin
          </span>
        </div>
      </div>

      {/* Business Details (Only when business) */}
      {accountType === 'business' && (
        <>
          <div className="space-y-1.5">
            <label className="font-semibold text-amber-400">Business Category</label>
            <select
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] focus:outline-none focus:border-amber-400"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#111b21] text-[#e9edef]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#8696a0]">City / Location</label>
              <input
                type="text"
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                placeholder="e.g. Thamel, Kathmandu"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#8696a0]">Contact Phone / WhatsApp</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="e.g. 9841XXXXXX"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#8696a0]">Working Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. Sun - Fri: 10 AM - 7 PM"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#8696a0]">Delivery Coverage</label>
              <input
                type="text"
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                placeholder="e.g. All Nepal Courier & Valley"
                className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#8696a0]">Specialties & Tags (Comma Separated)</label>
            <input
              type="text"
              value={catalogTags}
              onChange={(e) => setCatalogTags(e.target.value)}
              placeholder="e.g. Jackets, Hoodies, Wholesale, Cash on Delivery"
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884]"
            />
          </div>

          {/* Custom FAQ Bot (Zero-Invocation, runs in customer's browser) */}
          <div className="space-y-2 p-3 bg-[#0b141a]/60 border border-[#00a884]/30 rounded-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="font-semibold text-[#00a884]">
                Letterbox FAQ Bot (Instant Answers)
              </label>
              <div className="flex items-center gap-1.5">
                <a
                  href="/samples/sample-faqs.txt"
                  download
                  className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] rounded-lg text-[10px] text-[#8696a0] hover:text-white"
                >
                  Sample .txt
                </a>
                <a
                  href="/samples/sample-faqs.json"
                  download
                  className="px-2 py-1 bg-[#202c33] hover:bg-[#2a3942] rounded-lg text-[10px] text-[#8696a0] hover:text-white"
                >
                  Sample .json
                </a>
                <label
                  htmlFor="faq-file-upload"
                  className="px-2 py-1 bg-[#00a884] hover:bg-[#02906f] rounded-lg text-[10px] font-bold text-[#111b21] cursor-pointer"
                >
                  Upload File
                </label>
                <input
                  id="faq-file-upload"
                  type="file"
                  accept=".json,.md,.markdown,.txt,application/json,text/plain,text/markdown"
                  onChange={handleFaqFileUpload}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#8696a0] leading-relaxed">
              Paste or upload <strong>.json</strong>, <strong>.md</strong> or <strong>.txt</strong>. Use
              <code className="mx-1 text-[#00a884]">Q:</code> /
              <code className="mx-1 text-[#00a884]">A:</code> /
              <code className="mx-1 text-[#00a884]">K:</code>(keywords, optional). Customers get the answer instantly with zero server calls. Max 50 FAQs.
            </p>
            <textarea
              rows={7}
              value={faqText}
              onChange={(e) => setFaqText(e.target.value)}
              placeholder={'Q: Do you accept eSewa?\nA: Yes! eSewa, Khalti, Fonepay and Cash on Delivery.\nK: esewa, khalti, payment, qr\n\nQ: Return policy?\nA: Exchange within 7 days with bill.'}
              className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-[11px] font-mono text-[#e9edef] placeholder-[#8696a0]/50 focus:outline-none focus:border-[#00a884] resize-y"
            />
            <div className="flex items-center justify-between text-[10px]">
              <span className={parsedFaqsLength ? 'text-[#00a884]' : 'text-[#8696a0]'}>
                {parsedFaqsLength
                  ? `✓ ${parsedFaqsLength} FAQ${parsedFaqsLength > 1 ? 's' : ''} detected — click Save to publish`
                  : faqText.trim()
                  ? '⚠ No valid Q/A pairs detected yet'
                  : 'No custom FAQs (built-in answers from your profile are used)'}
              </span>
              {faqText && (
                <button
                  type="button"
                  onClick={() => setFaqText('')}
                  className="text-red-400 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            {faqUploadError && <p className="text-[10px] text-red-400">{faqUploadError}</p>}
          </div>
        </>
      )}

      {/* Bio / Tagline */}
      <div className="space-y-1.5">
        <label className="font-semibold text-[#8696a0]">
          {accountType === 'business' ? 'Shop Description / Customer Note' : 'Bio / Status'}
        </label>
        <textarea
          rows={2}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={
            accountType === 'business'
              ? 'e.g. Premium streetwear and handicrafts. Delivery all across Nepal (eSewa / COD).'
              : 'e.g. Available for coffee in Thamel. Ping me anytime.'
          }
          className="w-full px-3 py-2 bg-[#0b141a] border border-[#202c33] rounded-xl text-xs text-[#e9edef] placeholder-[#8696a0]/60 focus:outline-none focus:border-[#00a884] resize-none"
        />
      </div>
    </div>
  )
}
