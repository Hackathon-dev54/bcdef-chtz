import React, { useState, useEffect, useMemo } from 'react'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { parseFaqText } from '../lib/clientFaqBot'
import {
  type ProfileData,
  type ProfileSettingsModalProps,
  type ProfileTab,
  BUSINESS_CATEGORIES,
  faqsToEditableText,
  ProfileHeader,
  AccountSettingsTab,
  PrivacySettingsTab,
  HubSettingsTab,
  EdgeStorageTab,
} from './profile'
import { getAuthHeaders } from './messaging/authUtils'

export type { ProfileData, ProfileSettingsModalProps }
export { BUSINESS_CATEGORIES, faqsToEditableText }

export function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<ProfileTab>('account')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Profile Form State
  const [displayName, setDisplayName] = useState(currentUser.display_name || '')
  const [handle, setHandle] = useState(currentUser.handle || 'admin')
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal')
  const [bio, setBio] = useState('')
  const [businessCategory, setBusinessCategory] = useState('General & Personal Shop')
  const [businessPhone, setBusinessPhone] = useState('')
  const [businessLocation, setBusinessLocation] = useState('Kathmandu, Nepal')
  const [businessHours, setBusinessHours] = useState('Sun - Fri: 10:00 AM - 7:00 PM')
  const [deliveryInfo, setDeliveryInfo] = useState('All Nepal Courier & Inside Valley Delivery')
  const [catalogTags, setCatalogTags] = useState('Retail, Wholesale, Custom Orders, Cash on Delivery')
  const [privacyMode, setPrivacyMode] = useState<'open' | 'pin_only' | 'closed'>('open')
  const [friendPin, setFriendPin] = useState('')
  const [inquiryLetterboxEnabled, setInquiryLetterboxEnabled] = useState(true)
  const [hubListed, setHubListed] = useState(true)
  const [hubNodeId, setHubNodeId] = useState('')
  const [syncingHub, setSyncingHub] = useState(false)
  const [hubSyncSuccess, setHubSyncSuccess] = useState('')
  const [hubSyncError, setHubSyncError] = useState('')
  const [instanceUrl, setInstanceUrl] = useState('')

  // Merchant Custom FAQ Bot (paste or upload JSON / MD / TXT)
  const [faqText, setFaqText] = useState('')
  const [faqUploadError, setFaqUploadError] = useState('')
  const parsedFaqs = useMemo(() => parseFaqText(faqText), [faqText])

  const handleFaqFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFaqUploadError('')
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.(json|md|markdown|txt)$/i.test(file.name)) {
      setFaqUploadError('Only .json, .md or .txt files are supported')
      return
    }
    if (file.size > 50 * 1024) {
      setFaqUploadError('File too large (max 50 KB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setFaqText(String(reader.result || ''))
    reader.onerror = () => setFaqUploadError('Could not read file')
    reader.readAsText(file)
  }

  // Copy feedbacks
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPin, setCopiedPin] = useState(false)
  const [copiedEmbedUrl, setCopiedEmbedUrl] = useState(false)
  const [regeneratingPin, setRegeneratingPin] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    async function fetchProfile() {
      setLoading(true)
      setErrorMsg('')
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setDisplayName(data.profile.displayName || currentUser.display_name)
            setHandle(data.profile.handle || currentUser.handle)
            setAccountType(data.profile.accountType || 'personal')
            setBio(data.profile.bio || '')
            setBusinessCategory(data.profile.businessCategory || 'General & Personal Shop')
            setBusinessPhone(data.profile.businessPhone || '')
            setBusinessLocation(data.profile.businessLocation || 'Kathmandu, Nepal')
            setBusinessHours(data.profile.businessHours || 'Sun - Fri: 10:00 AM - 7:00 PM')
            setDeliveryInfo(data.profile.deliveryInfo || 'All Nepal Courier & Inside Valley Delivery')
            setCatalogTags(data.profile.catalogTags || 'Retail, Wholesale, Custom Orders, Cash on Delivery')
            setPrivacyMode(data.profile.privacyMode || 'open')
            setFriendPin(data.profile.friendPin || '')
            setInquiryLetterboxEnabled(data.profile.inquiryLetterboxEnabled !== false)
            setHubListed(data.profile.hubListed !== false)
            setHubNodeId(data.profile.hubNodeId || '')
            setInstanceUrl(data.profile.instanceUrl || '')
            if (data.profile.faqs && Array.isArray(data.profile.faqs)) {
              setFaqText(faqsToEditableText(data.profile.faqs))
            }
          }
        }
      } catch {
        setErrorMsg('Could not load profile. Using local defaults.')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isOpen, currentUser])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg('')
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          handle,
          accountType,
          bio,
          businessCategory,
          businessPhone,
          businessLocation,
          businessHours,
          deliveryInfo,
          catalogTags,
          privacyMode,
          friendPin,
          inquiryLetterboxEnabled,
          hubListed,
          faqs: parsedFaqs,
        }),
      })

      if (res.ok) {
        setSaveSuccess(true)
        if (onProfileUpdated) {
          onProfileUpdated({
            displayName,
            accountType,
          })
        }
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        const err = await res.json()
        setErrorMsg(err.error || 'Failed to save settings')
      }
    } catch {
      setErrorMsg('Network error while saving settings')
    } finally {
      setSaving(false)
    }
  }

  const handleRegeneratePin = async () => {
    setRegeneratingPin(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/profile/pin/regenerate', {
        method: 'POST',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.friendPin) {
          setFriendPin(data.friendPin)
        }
      } else {
        const errData = await res.json().catch(() => null)
        setErrorMsg(errData?.error || 'Failed to change PIN')
      }
    } catch {
      setErrorMsg('Failed to change PIN')
    } finally {
      setRegeneratingPin(false)
    }
  }

  const handleSyncToHub = async () => {
    setSyncingHub(true)
    setHubSyncSuccess('')
    setHubSyncError('')
    try {
      const res = await fetch('/api/hub/node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          displayName,
          category: businessCategory,
          location: businessLocation,
          phone: businessPhone,
          tags: catalogTags,
          isListed: hubListed,
          letterboxActive: inquiryLetterboxEnabled,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setHubSyncSuccess(`Successfully published to Chatze Hub (${data.nodeId || 'Active'})`)
        if (data.nodeId) setHubNodeId(data.nodeId)
      } else {
        setHubSyncError(data.error || 'Hub sync failed')
      }
    } catch {
      setHubSyncError('Could not reach Chatze Hub')
    } finally {
      setSyncingHub(false)
    }
  }

  const inviteLink = `${instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/?add=@${handle}&pin=${friendPin}`

  const copyToClipboard = (text: string, type: 'link' | 'pin') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'link') {
        setCopiedLink(true)
        setTimeout(() => setCopiedLink(false), 2000)
      } else {
        setCopiedPin(true)
        setTimeout(() => setCopiedPin(false), 2000)
      }
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans select-none">
      <div className="w-full max-w-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Top Header & Navigation */}
        <ProfileHeader
          accountType={accountType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={onClose}
        />

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-zinc-400 gap-2">
              <div className="w-6 h-6 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Loading settings...</span>
            </div>
          ) : (
            <form id="profile-form" onSubmit={handleSave} className="space-y-4">
              {/* TAB 1: IDENTITY & PROFILE */}
              {activeTab === 'account' && (
                <AccountSettingsTab
                  accountType={accountType}
                  setAccountType={setAccountType}
                  displayName={displayName}
                  setDisplayName={setDisplayName}
                  handle={handle}
                  businessCategory={businessCategory}
                  setBusinessCategory={setBusinessCategory}
                  businessLocation={businessLocation}
                  setBusinessLocation={setBusinessLocation}
                  businessPhone={businessPhone}
                  setBusinessPhone={setBusinessPhone}
                  businessHours={businessHours}
                  setBusinessHours={setBusinessHours}
                  deliveryInfo={deliveryInfo}
                  setDeliveryInfo={setDeliveryInfo}
                  catalogTags={catalogTags}
                  setCatalogTags={setCatalogTags}
                  faqText={faqText}
                  setFaqText={setFaqText}
                  parsedFaqsLength={parsedFaqs.length}
                  faqUploadError={faqUploadError}
                  handleFaqFileUpload={handleFaqFileUpload}
                  bio={bio}
                  setBio={setBio}
                />
              )}

              {/* TAB 2: PRIVACY & FEDERATION */}
              {activeTab === 'privacy' && (
                <PrivacySettingsTab
                  accountType={accountType}
                  friendPin={friendPin}
                  regeneratingPin={regeneratingPin}
                  handleRegeneratePin={handleRegeneratePin}
                  copiedPin={copiedPin}
                  copyToClipboard={copyToClipboard}
                  privacyMode={privacyMode}
                  setPrivacyMode={setPrivacyMode}
                  inquiryLetterboxEnabled={inquiryLetterboxEnabled}
                  setInquiryLetterboxEnabled={setInquiryLetterboxEnabled}
                  inviteLink={inviteLink}
                  instanceUrl={instanceUrl}
                  copiedLink={copiedLink}
                />
              )}

              {/* TAB 3: CHATZE HUB & LETTERBOX */}
              {activeTab === 'hub' && (
                <HubSettingsTab
                  hubListed={hubListed}
                  setHubListed={setHubListed}
                  syncingHub={syncingHub}
                  handleSyncToHub={handleSyncToHub}
                  hubSyncSuccess={hubSyncSuccess}
                  hubSyncError={hubSyncError}
                  handle={handle}
                  instanceUrl={instanceUrl}
                  copiedEmbedUrl={copiedEmbedUrl}
                  setCopiedEmbedUrl={setCopiedEmbedUrl}
                />
              )}

              {/* TAB 4: EDGE CLOUD & STORAGE INFO */}
              {activeTab === 'edge' && <EdgeStorageTab />}

              {/* Status Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold">Settings saved successfully!</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Mode: <strong className="text-zinc-900 dark:text-zinc-100 capitalize">{accountType}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={saving || loading}
              className="px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
