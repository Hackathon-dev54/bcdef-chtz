import React, { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { SetupWizard } from './components/SetupWizard'
import { AuthScreens } from './components/AuthScreens'
import { MessagingApp } from './components/MessagingApp'
import { CustomerInquiryPage } from './components/CustomerInquiryPage'

export function App() {
  const [forceLogin, setForceLogin] = useState(false)

  // 1. Instant Local-First Hydration (0ms load from localStorage cache)
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window === 'undefined') return null
    try {
      const token = localStorage.getItem('chatze_auth_token')
      const cached = localStorage.getItem('chatze_user')
      if (token && cached) {
        return JSON.parse(cached)
      }
    } catch {}
    return null
  })

  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Chatze User'
    try {
      const cached = localStorage.getItem('chatze_user')
      if (cached) {
        const parsed = JSON.parse(cached)
        return parsed.display_name || parsed.displayName || 'Chatze User'
      }
    } catch {}
    return 'Chatze User'
  })

  const [setupRequired, setSetupRequired] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null
    if (localStorage.getItem('chatze_setup_completed') === 'true') return false
    if (localStorage.getItem('chatze_auth_token')) return false
    return null
  })

  // Only show loading if we have zero cached session to avoid blocking reload
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const token = localStorage.getItem('chatze_auth_token')
    const cached = localStorage.getItem('chatze_user')
    return !(token && cached)
  })

  const isShopVisitor = !forceLogin && typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/shop') ||
    new URLSearchParams(window.location.search).has('shop') ||
    window.location.pathname.startsWith('/letterbox') ||
    new URLSearchParams(window.location.search).has('letterbox')
  )

  // 2. Parallel Background Validation & Revalidation
  useEffect(() => {
    let isMounted = true

    async function checkState() {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('chatze_auth_token') : null

        // Fire setup status and auth session check concurrently in parallel
        const setupPromise = fetch('/api/setup/status').then(async (res) => {
          if (res.ok) {
            const data = await res.json()
            return data
          }
          return { setupRequired: true }
        }).catch(() => ({ setupRequired: false }))

        const sessionPromise = storedToken
          ? fetch('/api/auth/session', { headers: { Authorization: `Bearer ${storedToken}` } })
              .then(async (res) => (res.ok ? res.json() : null))
              .catch(() => null)
          : Promise.resolve(null)

        const [setupData, sessionData] = await Promise.all([setupPromise, sessionPromise])

        if (!isMounted) return

        if (setupData?.setupRequired) {
          setSetupRequired(true)
          localStorage.removeItem('chatze_setup_completed')
          setLoading(false)
          return
        }

        setSetupRequired(false)
        localStorage.setItem('chatze_setup_completed', 'true')
        if (setupData?.displayName) {
          setDisplayName(setupData.displayName)
        }

        if (sessionData && sessionData.user) {
          setCurrentUser(sessionData.user)
          localStorage.setItem('chatze_user', JSON.stringify(sessionData.user))
        } else if (storedToken && !sessionData) {
          // Token expired or invalid
          localStorage.removeItem('chatze_auth_token')
          localStorage.removeItem('chatze_user')
          setCurrentUser(null)
        }
      } catch (err) {
        console.warn('App init background validation error', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    checkState()

    return () => {
      isMounted = false
    }
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem('chatze_auth_token')
    if (token) {
      fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {})
      localStorage.removeItem('chatze_auth_token')
      localStorage.removeItem('chatze_user')
    }
    setCurrentUser(null)
  }

  // Modern Minimalist Theme-Aware Splash Loader (Only for fresh browser first-time visits)
  if (loading && !currentUser) {
    const isDark = typeof window !== 'undefined' ? localStorage.getItem('chatze_theme') !== 'light' : true
    return (
      <div className={`${isDark ? 'dark' : ''} min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4 font-sans select-none transition-colors`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-lg shadow-sm animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
              chatze.
            </span>
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-ping" />
              <span>Connecting to edge node...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Public Customer View for Shop Links
  if (isShopVisitor) {
    return (
      <CustomerInquiryPage
        currentUser={currentUser}
        onSwitchToOwnerLogin={() => setForceLogin(true)}
        onGoToApp={() => {
          const url = new URL(window.location.href)
          url.pathname = '/'
          url.searchParams.delete('shop')
          url.searchParams.delete('letterbox')
          url.searchParams.set('tab', 'letterbox')
          window.location.href = url.pathname + '?' + url.searchParams.toString()
        }}
      />
    )
  }

  if (setupRequired) {
    return (
      <SetupWizard
        onComplete={(name, handle, token) => {
          if (token) localStorage.setItem('chatze_auth_token', token)
          const newUser = {
            id: 'usr_admin',
            handle: handle || 'admin',
            display_name: name,
            role: 'admin',
          }
          localStorage.setItem('chatze_user', JSON.stringify(newUser))
          localStorage.setItem('chatze_setup_completed', 'true')
          setDisplayName(name)
          setSetupRequired(false)
          setCurrentUser(newUser)
        }}
      />
    )
  }

  if (!currentUser) {
    return (
      <AuthScreens
        onLoginSuccess={(user, token) => {
          if (token) localStorage.setItem('chatze_auth_token', token)
          if (user) localStorage.setItem('chatze_user', JSON.stringify(user))
          localStorage.setItem('chatze_setup_completed', 'true')
          setCurrentUser(user)
          setForceLogin(false)
        }}
      />
    )
  }

  return (
    <MessagingApp
      currentUser={currentUser}
      businessName={displayName}
      onLogout={handleLogout}
    />
  )
}

export default App
