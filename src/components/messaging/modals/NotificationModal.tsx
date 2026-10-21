import React, { useState, useEffect } from 'react'
import {
  Bell,
  BellRing,
  Smartphone,
  X,
  Check,
  Loader2,
  Sparkles,
  Download,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react'
import {
  isPushSupported,
  isIosWithoutPwa,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification,
} from '../../../lib/pushNotifications'
import { usePWAInstall } from '../../../hooks/usePWAInstall'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userHandle: string
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  userHandle,
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()

  useEffect(() => {
    if (!isOpen) return

    if (!isPushSupported()) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    getExistingPushSubscription().then(async (sub) => {
      if (sub) {
        setIsSubscribed(true)
        // Background sync device token
        try {
          const subJson = sub.toJSON()
          if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                endpoint: subJson.endpoint,
                keys: subJson.keys,
                userHandle: (userHandle || 'admin').replace(/^@/, '').trim().toLowerCase(),
                userAgent: navigator.userAgent.slice(0, 100),
              }),
            })
          }
        } catch {}
      } else {
        setIsSubscribed(false)
      }
    })
  }, [isOpen, userHandle])

  if (!isOpen) return null

  const isIosBrowser = isIosWithoutPwa()

  const handleEnablePush = async () => {
    setErrorMsg(null)
    setLoading(true)
    const res = await subscribeToPushNotifications(userHandle)
    setLoading(false)

    if (res.success) {
      setIsSubscribed(true)
      setPermission('granted')
    } else {
      setErrorMsg(res.error || 'Permission denied or failed to activate.')
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    await unsubscribeFromPushNotifications()
    setIsSubscribed(false)
    setLoading(false)
  }

  const handleSendTest = async () => {
    setLoading(true)
    setErrorMsg(null)
    let res = await sendTestNotification(userHandle)
    if (
      !res.success &&
      (res.dispatched === 0 ||
        res.error?.includes('No active device') ||
        res.error?.includes('not found'))
    ) {
      const regRes = await subscribeToPushNotifications(userHandle)
      if (regRes.success) {
        setIsSubscribed(true)
        res = await sendTestNotification(userHandle)
      } else {
        setErrorMsg(regRes.error || 'Failed to re-register this device with server.')
        setLoading(false)
        return
      }
    }
    setLoading(false)
    if (res.success) {
      setTestSent(true)
      setTimeout(() => setTestSent(false), 8000)
    } else {
      setErrorMsg(res.error || 'Test notification failed.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-2xl text-zinc-900 dark:text-zinc-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Notifications &amp; App
              </h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Lock-screen alerts &amp; progressive web app
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Container */}
        <div className="mt-4 space-y-4">
          {/* Card 1: WebPush Lock-Screen Notifications */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  WebPush Lock-Screen Alerts
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 ${
                  isSubscribed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                  }`}
                />
                {isSubscribed ? 'Active' : 'Not Active'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Receive instant sound and vibration alerts on your phone or desktop when new customer
              inquiries and direct messages arrive.
            </p>

            {errorMsg && (
              <p className="text-[11px] text-rose-500 font-medium">{errorMsg}</p>
            )}

            {isIosBrowser ? (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-[11px] space-y-1.5 text-zinc-600 dark:text-zinc-300">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iOS Safari Push Requirement:</span>
                </p>
                <p>1. Tap the <strong>Share</strong> button in Safari.</p>
                <p>2. Select <strong>Add to Home Screen</strong>.</p>
                <p>3. Open Chatze from your home screen to enable push notifications.</p>
              </div>
            ) : isSubscribed ? (
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={loading}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>{testSent ? 'Alert Dispatched!' : 'Send Test Notification'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="py-2 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Disable
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5" />
                )}
                <span>Enable Notifications</span>
              </button>
            )}
          </div>

          {/* Card 2: Install Desktop & Mobile App (PWA) */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                  Desktop &amp; Mobile App (PWA)
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex items-center gap-1 ${
                  isInstalled
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                }`}
              >
                {isInstalled ? 'Installed' : 'Available'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Install Chatze as a native app on your phone or PC. Operates full-screen with 0ms
              IndexedDB local storage and instant launch.
            </p>

            {isInstalled ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                <Check className="w-4 h-4" />
                <span>Running as installed standalone application</span>
              </div>
            ) : isInstallable ? (
              <button
                type="button"
                onClick={install}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App on this Device</span>
              </button>
            ) : isIOS ? (
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-[11px] space-y-1 text-zinc-600 dark:text-zinc-300">
                <p>Tap <strong>Share</strong> in Safari &gt; <strong>Add to Home Screen</strong>.</p>
              </div>
            ) : (
              <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                <span>To install, use browser menu or install icon in URL bar</span>
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Cloudflare Edge VAPID Push</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
