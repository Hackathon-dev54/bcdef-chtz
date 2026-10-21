import React, { useState, useEffect } from 'react'
import { Bell, BellRing, Smartphone, X, Check, Loader2, Sparkles } from 'lucide-react'
import {
  isPushSupported,
  isIosWithoutPwa,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  sendTestNotification,
} from '../lib/pushNotifications'

interface NotificationPermissionBannerProps {
  userHandle: string
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({ userHandle }) => {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIosModal, setShowIosModal] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if dismissed previously in this session
    if (sessionStorage.getItem('chatze_notif_banner_dismissed') === 'true') {
      setDismissed(true)
    }

    if (!isPushSupported()) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    getExistingPushSubscription().then((sub) => {
      setIsSubscribed(!!sub)
    })
  }, [])

  const handleEnable = async () => {
    setErrorMsg(null)

    if (isIosWithoutPwa()) {
      setShowIosModal(true)
      return
    }

    setLoading(true)
    const res = await subscribeToPushNotifications(userHandle)
    setLoading(false)

    if (res.success) {
      setIsSubscribed(true)
      setPermission('granted')
    } else {
      setErrorMsg(res.error || 'Failed to activate notifications.')
    }
  }

  const handleSendTest = async () => {
    setLoading(true)
    setErrorMsg(null)
    let res = await sendTestNotification(userHandle)
    if (!res.success && (res.dispatched === 0 || res.error?.includes('No active device') || res.error?.includes('not found'))) {
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

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('chatze_notif_banner_dismissed', 'true')
  }

  // If dismissed or already granted & subscribed (and not in test mode), hide banner
  if (dismissed || (permission === 'granted' && isSubscribed && !testSent && !errorMsg)) {
    return null
  }

  // iOS Safari in browser tab (needs Add to Home Screen first)
  const isIosBrowser = isIosWithoutPwa()

  return (
    <>
      <div className="relative bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 sm:px-4 text-xs text-zinc-800 dark:text-zinc-200 animate-in fade-in slide-in-from-top-2">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0">
              {isIosBrowser ? <Smartphone className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
            </div>
            <div>
              {isIosBrowser ? (
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Add to iPhone Home Screen for Lock-Screen Alerts
                  <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                    Apple requires installing Chatze via Safari Share &gt; Add to Home Screen to unlock push notifications.
                  </span>
                </p>
              ) : isSubscribed ? (
                <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Notifications Active!
                  <span className="text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                    Lock your phone or switch apps to test incoming alerts.
                  </span>
                </p>
              ) : (
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Enable Lock-Screen Notifications
                  <span className="block text-[11px] font-normal text-zinc-500 dark:text-zinc-400">
                    Receive instant vibration and sound alerts on your phone when new messages arrive.
                  </span>
                </p>
              )}
              {errorMsg && <p className="text-[11px] text-rose-500 mt-0.5">{errorMsg}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            {isIosBrowser ? (
              <button
                onClick={() => setShowIosModal(true)}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                View iOS Setup
              </button>
            ) : isSubscribed ? (
              <button
                onClick={handleSendTest}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {testSent ? 'Alert Dispatched!' : 'Send Test Alert'}
              </button>
            ) : (
              <button
                onClick={handleEnable}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                Enable Notifications
              </button>
            )}

            <button
              onClick={handleDismiss}
              title="Dismiss"
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl text-zinc-800 dark:text-zinc-200 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">iPhone Notifications Setup</h3>
              </div>
              <button
                onClick={() => setShowIosModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                Apple restricts Web Push to installed Home Screen apps on iOS 16.4+:
              </p>
              <div className="space-y-2.5 pt-1">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                  <p>In Safari, tap the <strong className="text-zinc-900 dark:text-zinc-100">Share</strong> button (box with upward arrow).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                  <p>Scroll down the menu and tap <strong className="text-zinc-900 dark:text-zinc-100">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                  <p>Open the new <strong className="text-zinc-900 dark:text-zinc-100">Chatze</strong> icon from your Home Screen.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">4</span>
                  <p>Tap <strong className="text-zinc-900 dark:text-zinc-100">Enable Notifications</strong> when prompted to allow lock-screen alerts.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="mt-5 w-full rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}
