import React, { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  User,
  Store,
  Shield,
  Database,
  Bell,
  QrCode,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  Share2,
  ExternalLink,
  LogOut,
  Smartphone,
} from 'lucide-react'
import { parseFaqText } from '../lib/clientFaqBot'
import {
  faqsToEditableText,
  AccountSettingsTab,
  PrivacySettingsTab,
  HubSettingsTab,
  EdgeStorageTab,
} from './profile'
import { NotificationToggleButton } from './NotificationToggleButton'
import { PWAInstallButton } from './PWAInstallButton'

export type SettingsTab = 'profile' | 'storefront' | 'instance' | 'notifications' | 'storage' | 'privacy'

interface SettingsPageProps {
  currentUser: { id: string; handle: string; display_name: string; role?: string }
  currentDisplayName: string
  onBack: () => void
  onProfileUpdated?: (updated: any) => void
  onOpenIdentityModal?: () => void
  onOpenPaymentQrModal?: () => void
  onLogout: () => void
  shopPortfolioUrl?: string
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  currentDisplayName,
  onBack,
  onProfileUpdated,
  onOpenIdentityModal,
  onOpenPaymentQrModal,
  onLogout,
  shopPortfolioUrl,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Profile Form State
  const [displayName, setDisplayName] = useState(currentDisplayName || currentUser.display_name || '')
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

  // Custom FAQ Bot
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
  }, [currentUser])

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
    try {
      const res = await fetch('/api/auth/regenerate-pin', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        if (data.friendPin) {
          setFriendPin(data.friendPin)
        }
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

  const userInitials = (displayName || currentUser.display_name || 'ME').slice(0, 2).toUpperCase()

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white dark:bg-[#121214] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none transition-colors">
      {/* 1. Settings Top Action Bar */}
      <header className="h-16 px-4 sm:px-8 border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] flex items-center justify-between shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-semibold hidden sm:inline">Back to chats</span>
          </button>
          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Settings
            </h1>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Manage profile, business storefront, device push alerts &amp; cloud sharding
            </p>
          </div>
        </div>

        {/* Header Right: Save Button & Mode Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {accountType === 'business' ? 'Business Mode' : 'Personal Mode'}
          </span>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving || loading}
            className="px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
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
      </header>

      {/* 2. Navigation Tabs Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-[#0e0e10] px-4 sm:px-8 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-xs transition-colors">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile &amp; Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storefront')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'storefront'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Storefront &amp; Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('instance')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'instance'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Instance &amp; Payments</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications &amp; App</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'storage'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Edge Cloud Storage</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'privacy'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-xs'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Privacy &amp; Account</span>
        </button>
      </div>

      {/* 3. Settings Content Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Status Message Toasts */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-semibold">All settings updated successfully!</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-xs text-zinc-400 gap-2">
            <div className="w-6 h-6 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Loading settings...</span>
          </div>
        ) : (
          <>
            {/* Tab 1: Profile & Identity */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Avatar Card */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-bold text-xl text-zinc-900 dark:text-zinc-100 shadow-xs shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {displayName || currentUser.display_name}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      @{handle} • Connected Cloudflare Worker Node
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Available on Edge Federation</span>
                    </div>
                  </div>
                </div>

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
              </div>
            )}

            {/* Tab 2: Storefront & Hub */}
            {activeTab === 'storefront' && (
              <div className="space-y-6">
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
              </div>
            )}

            {/* Tab 3: Instance & Payments */}
            {activeTab === 'instance' && (
              <div className="space-y-4">
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        My Instance Address &amp; QR
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Share your unique Cloudflare Edge instance URL with friends or on social media
                      </p>
                    </div>
                    {onOpenIdentityModal && (
                      <button
                        type="button"
                        onClick={onOpenIdentityModal}
                        className="px-3.5 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>View QR Code</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      readOnly
                      value={instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}
                      className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 font-mono select-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(instanceUrl || (typeof window !== 'undefined' ? window.location.origin : ''), 'link')}
                      className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Payment QR Code Card */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        Merchant Payment QR Code
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Upload or share your Fonepay / eSewa / Bank QR directly in customer chats
                      </p>
                    </div>
                    {onOpenPaymentQrModal && (
                      <button
                        type="button"
                        onClick={onOpenPaymentQrModal}
                        className="px-3.5 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Manage QR Code</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Notifications & App */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* Push Notifications Card */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        <span>WebPush Lock-Screen Notifications</span>
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Receive instant alerts and vibrations on your smartphone when new customer messages arrive
                      </p>
                    </div>
                    <NotificationToggleButton userHandle={currentUser.handle} />
                  </div>
                </div>

                {/* PWA App Install Card */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" />
                        <span>Install Desktop &amp; Mobile App</span>
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Install Chatze as a standalone native-feeling PWA for instant offline access and 0ms loading
                      </p>
                    </div>
                    <PWAInstallButton />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Edge Cloud Storage */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <EdgeStorageTab />
              </div>
            )}

            {/* Tab 6: Privacy & Account */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
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

                {/* Session & Logout Card */}
                <div className="p-5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      Lock Instance &amp; Logout
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Ends your active session on this device. Your data remains safely encrypted at the edge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
