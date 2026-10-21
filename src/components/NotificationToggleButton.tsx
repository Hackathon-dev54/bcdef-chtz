import React, { useState, useEffect } from 'react'
import { Bell, BellRing, Smartphone, X, Check, AlertCircle, Loader2, Sparkles } from 'lucide-react'
import {
  isPushSupported,
  isIosWithoutPwa,
  getExistingPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  sendTestNotification,
} from '../lib/pushNotifications'

interface NotificationToggleButtonProps {
  userHandle: string
  className?: string
}

export const NotificationToggleButton: React.FC<NotificationToggleButtonProps> = ({
  userHandle,
  className = '',
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [testSent, setTestSent] = useState(false)
  const [testDetails, setTestDetails] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')

  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    getExistingPushSubscription().then(async (sub) => {
      if (sub) {
        setIsSubscribed(true)
        // Background sync: ensure this device's token is saved in server D1 database
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
        } catch (e) {
          console.warn('[Push Auto-sync Warning]', e)
        }
      } else {
        setIsSubscribed(false)
      }
    })
  }, [userHandle])

  const handleToggle = async () => {
    setErrorMsg(null)

    if (isIosWithoutPwa()) {
      setShowModal(true)
      return
    }

    if (!isSubscribed) {
      setLoading(true)
      const res = await subscribeToPushNotifications(userHandle)
      setLoading(false)

      if (res.success) {
        setIsSubscribed(true)
        setPermission('granted')
        setShowModal(true)
      } else {
        setErrorMsg(res.error || 'Permission denied or notifications not supported.')
        setShowModal(true)
      }
    } else {
      setShowModal(true)
    }
  }

  const handleUnsubscribe = async () => {
    setLoading(true)
    await unsubscribeFromPushNotifications()
    setIsSubscribed(false)
    setLoading(false)
    setShowModal(false)
  }

  const handleTestAlert = async () => {
    setLoading(true)
    setErrorMsg(null)
    setTestSent(false)

    const res = await sendTestNotification(userHandle)

    if (!res.success && res.error?.includes('No push subscriptions found')) {
      const reSub = await subscribeToPushNotifications(userHandle)
      if (reSub.success) {
        setIsSubscribed(true)
        const reTest = await sendTestNotification(userHandle)
        setLoading(false)
        if (reTest.success) {
          setTestSent(true)
          setTestDetails(reTest.details || 'Dispatched to 1 device')
          setTimeout(() => setTestSent(false), 8000)
        } else {
          setErrorMsg(reTest.error || 'Failed after re-subscribing')
        }
        return
      } else {
        setErrorMsg('Push subscription expired. Please click Allow & Enable.')
        setIsSubscribed(false)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    if (res.success) {
      setTestSent(true)
      setTestDetails(res.details || 'Dispatched to 1 device')
      setTimeout(() => setTestSent(false), 8000)
    } else {
      setErrorMsg(res.error || 'Could not send test notification')
    }
  }

  const renderModal = () => {
    if (!showModal) return null

    const isIos = isIosWithoutPwa()

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl text-zinc-800 dark:text-zinc-200 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                <BellRing className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isIos ? 'iPhone Push Setup' : 'Push Notifications'}
              </h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {isIos ? (
              <>
                <p className="text-zinc-900 dark:text-zinc-100 font-medium">
                  Apple requires iOS apps to be launched from your Home Screen before enabling notifications:
                </p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                    <p>Tap <strong className="text-zinc-900 dark:text-zinc-100">Share</strong> in Safari (box with arrow pointing up).</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                    <p>Tap <strong className="text-zinc-900 dark:text-zinc-100">Add to Home Screen</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                    <p>Launch Chatze from your Home Screen and tap this bell to activate alerts.</p>
                  </div>
                </div>
              </>
            ) : isSubscribed ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>Notifications Active</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    This device is registered to receive lock-screen alerts for @{userHandle}.
                  </p>
                </div>

                <div className="pt-1 space-y-2">
                  <button
                    onClick={handleTestAlert}
                    disabled={loading}
                    className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{testSent ? 'Alert Dispatched to Phone!' : 'Send Test Notification to This Phone'}</span>
                  </button>

                  {testSent && (
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center animate-in fade-in space-y-1">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">🎉 Test Notification Sent!</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {testDetails || 'Delivered to gateway.'} Lock your phone screen or switch apps to see it!
                      </p>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-center animate-in fade-in space-y-1.5">
                      <p className="font-semibold flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Push Notification Issue</span>
                      </p>
                      <p className="text-[11px]">{errorMsg}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Allow push notifications to receive real-time message alerts and incoming call rings even when Chatze is minimized or your phone is locked.
                </p>
                {permission === 'denied' && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] space-y-1">
                    <p className="font-semibold">⚠️ Browser Permission Blocked</p>
                    <p>
                      Notifications are currently blocked in your browser settings. Please click the tune/lock icon in your browser address bar and change Notifications to <strong>Allow</strong>.
                    </p>
                  </div>
                )}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[11px]">
                    {errorMsg}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            {isSubscribed && (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="py-2.5 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Turn Off
              </button>
            )}
            {!isIos && !isSubscribed && (
              <button
                onClick={() => {
                  setShowModal(false)
                  handleToggle()
                }}
                className="flex-1 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Allow & Enable
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={handleToggle}
        disabled={loading}
        title={
          isSubscribed
            ? 'Background notifications active (click to test or configure)'
            : 'Enable background notifications for this device'
        }
        className={`p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer ${
          isSubscribed ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400 dark:text-zinc-500'
        } ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          <div className="relative">
            <Bell className="w-4 h-4 fill-current text-zinc-900 dark:text-zinc-100" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
        ) : (
          <Bell className="w-4 h-4" />
        )}
      </button>
      {renderModal()}
    </>
  )
}
