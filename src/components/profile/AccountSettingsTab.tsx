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
    <div className="space-y-4 text-xs select-none">
      {/* Account Type Selector Card */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <label className="font-bold text-zinc-900 dark:text-zinc-100 block text-[11px] uppercase tracking-wider">
          Account Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setAccountType('personal')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
              accountType === 'personal'
                ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-white text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <User className="w-3.5 h-3.5" /> Personal Account
              </span>
              {accountType === 'personal' && <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              For direct personal chatting and federation. Protected with private Friend PIN.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setAccountType('business')}
            className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
              accountType === 'business'
                ? 'bg-white dark:bg-zinc-800 border-zinc-900 dark:border-white text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'bg-white/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                <Store className="w-3.5 h-3.5" /> Business / Shop Mode
              </span>
              {accountType === 'business' && <Check className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
              For brands, shops & freelancers. Activates public letterbox and customer storefront.
            </p>
          </button>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-1.5">
        <label className="font-semibold text-zinc-700 dark:text-zinc-300">
          {accountType === 'business' ? 'Shop / Brand Name' : 'Your Display Name'}
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={accountType === 'business' ? 'e.g. Kathmandu Threads' : 'e.g. Aarav Sharma'}
          required
          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        />
      </div>

      {/* Handle (Read-only instance handle) */}
      <div className="space-y-1.5">
        <label className="font-semibold text-zinc-700 dark:text-zinc-300">Handle (@Username)</label>
        <div className="flex items-center px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 mr-1">@</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{handle}</span>
          <span className="ml-auto text-[10px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-semibold text-zinc-700 dark:text-zinc-300">
            Primary Node Admin
          </span>
        </div>
      </div>

      {/* Business Details (Only when business) */}
      {accountType === 'business' && (
        <>
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Business Category</label>
            <select
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            >
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">City / Location</label>
              <input
                type="text"
                value={businessLocation}
                onChange={(e) => setBusinessLocation(e.target.value)}
                placeholder="e.g. Thamel, Kathmandu"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Contact Phone / WhatsApp</label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="e.g. 9841XXXXXX"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Working Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                placeholder="e.g. Sun - Fri: 10 AM - 7 PM"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">Delivery Coverage</label>
              <input
                type="text"
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                placeholder="e.g. All Nepal Courier & Valley"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">Specialties & Tags (Comma Separated)</label>
            <input
              type="text"
              value={catalogTags}
              onChange={(e) => setCatalogTags(e.target.value)}
              placeholder="e.g. Jackets, Hoodies, Wholesale, Cash on Delivery"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            />
          </div>

          {/* Custom FAQ Bot */}
          <div className="space-y-2 p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                Letterbox FAQ Bot (Instant Answers)
              </label>
              <div className="flex items-center gap-1.5">
                <a
                  href="/samples/sample-faqs.txt"
                  download
                  className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Sample .txt
                </a>
                <a
                  href="/samples/sample-faqs.json"
                  download
                  className="px-2 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                  Sample .json
                </a>
                <label
                  htmlFor="faq-file-upload"
                  className="px-2.5 py-1 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
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
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Paste or upload <strong>.json</strong>, <strong>.md</strong> or <strong>.txt</strong>. Use
              <code className="mx-1 text-zinc-900 dark:text-zinc-100 font-bold">Q:</code> /
              <code className="mx-1 text-zinc-900 dark:text-zinc-100 font-bold">A:</code> /
              <code className="mx-1 text-zinc-900 dark:text-zinc-100 font-bold">K:</code>(keywords, optional). Customers get the answer instantly with zero server calls. Max 50 FAQs.
            </p>
            <textarea
              rows={6}
              value={faqText}
              onChange={(e) => setFaqText(e.target.value)}
              placeholder={'Q: Do you accept eSewa?\nA: Yes! eSewa, Khalti, Fonepay and Cash on Delivery.\nK: esewa, khalti, payment, qr\n\nQ: Return policy?\nA: Exchange within 7 days with bill.'}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-y transition-colors"
            />
            <div className="flex items-center justify-between text-[10px]">
              <span className={parsedFaqsLength ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500 dark:text-zinc-400'}>
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
                  className="text-rose-500 hover:underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            {faqUploadError && <p className="text-[10px] text-rose-500">{faqUploadError}</p>}
          </div>
        </>
      )}

      {/* Bio / Tagline */}
      <div className="space-y-1.5">
        <label className="font-semibold text-zinc-700 dark:text-zinc-300">
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
          className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 resize-none transition-colors"
        />
      </div>
    </div>
  )
}
