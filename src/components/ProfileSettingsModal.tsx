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
            setPrivacyMode(data.profile.privacyMode || 'pin_only')
            setFriendPin(data.profile.friendPin || '')
            setInquiryLetterboxEnabled(data.profile.inquiryLetterboxEnabled !== false)
            setHubListed(data.profile.hubListed !== false)
            setHubNodeId(data.profile.hubNodeId || '')
            setInstanceUrl(data.profile.instanceUrl || window.location.origin)
            setFaqText(faqsToEditableText(data.profile.customFaqs || []))
          }
        }
      } catch (err: any) {
        console.warn('Profile fetch warning', err?.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isOpen, currentUser])

  const handleSyncToHub = async () => {
    setSyncingHub(true)
    setHubSyncSuccess('')
    setHubSyncError('')
    try {
      const cleanHandle = handle.replace(/^@/, '').trim().toLowerCase()
      const embedUrl = `${instanceUrl || window.location.origin}/letterbox?shop=${cleanHandle}`
      const res = await fetch('/api/hub/merchants/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle: cleanHandle,
          business_name: displayName.trim() || cleanHandle,
          category: businessCategory,
          city: businessLocation.split(',')[0].trim() || 'Kathmandu',
          address: businessLocation,
          bio: bio.trim(),
          tags: catalogTags,
          phone_whatsapp_optional: businessPhone.trim(),
          letterbox_embed_url: embedUrl,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setHubSyncSuccess('Store listed & synced successfully into the Chatze Hub Directory!')
        setHubListed(true)
        // Also persist hub_listed = true locally
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: displayName.trim(),
            accountType,
            bio: bio.trim(),
            businessCategory,
            businessPhone: businessPhone.trim(),
            businessLocation: businessLocation.trim(),
            businessHours: businessHours.trim(),
            deliveryInfo: deliveryInfo.trim(),
            catalogTags: catalogTags.trim(),
            privacyMode: accountType === 'business' ? 'pin_only' : privacyMode,
            friendPin,
            inquiryLetterboxEnabled,
            hubListed: true,
          }),
        })
      } else {
        setHubSyncError(data.error || 'Failed to register with Chatze Hub')
      }
    } catch (err: any) {
      setHubSyncError(err?.message || 'Network error syncing to Hub')
    } finally {
      setSyncingHub(false)
    }
  }

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
          displayName: displayName.trim(),
          accountType,
          bio: bio.trim(),
          businessCategory,
          businessPhone: businessPhone.trim(),
          businessLocation: businessLocation.trim(),
          businessHours: businessHours.trim(),
          deliveryInfo: deliveryInfo.trim(),
          catalogTags: catalogTags.trim(),
          privacyMode: accountType === 'business' ? 'pin_only' : privacyMode,
          friendPin,
          inquiryLetterboxEnabled,
          hubListed,
          customFaqs: parsedFaqs,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSaveSuccess(true)
        if (onProfileUpdated) {
          onProfileUpdated({
            displayName: data.profile.displayName,
            accountType: data.profile.accountType,
          })
        }
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setErrorMsg(data.error || 'Failed to save settings')
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error while saving')
    } finally {
      setSaving(false)
    }
  }

  const handleRegeneratePin = async () => {
    setRegeneratingPin(true)
    try {
      const res = await fetch('/api/profile/pin/regenerate', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.friendPin) {
        setFriendPin(data.friendPin)
      }
    } catch {}
    setRegeneratingPin(false)
  }

  const inviteLink = `${instanceUrl || window.location.origin}/?add=@${handle}&pin=${friendPin}`

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-[#111b21] border border-[#202c33] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header & Navigation */}
        <ProfileHeader
          accountType={accountType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={onClose}
        />

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-xs text-[#8696a0] gap-2">
              <div className="w-6 h-6 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
              <span>Loading your profile settings...</span>
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

              {/* TAB 2: PRIVACY & ANTI-SPAM */}
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

              {/* TAB 3: CHATZE HUB DIRECTORY INTEGRATION */}
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

              {/* TAB 4: EDGE CLOUD & NODE INFO */}
              {activeTab === 'edge' && <EdgeStorageTab />}

              {/* Status Message */}
              {errorMsg && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 bg-[#00a884]/15 border border-[#00a884]/30 rounded-xl text-[#00a884] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Settings saved successfully!</span>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#202c33]/60 border-t border-[#202c33] flex items-center justify-between shrink-0">
          <span className="text-[11px] text-[#8696a0]">
            Mode: <strong className="text-[#e9edef] capitalize">{accountType}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#8696a0] hover:text-[#e9edef] rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={saving || loading}
              className="px-4 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#00a884]/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin"></div>
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
