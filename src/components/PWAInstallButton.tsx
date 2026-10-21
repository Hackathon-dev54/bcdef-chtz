import React, { useState } from 'react'
import { Download, Smartphone, X } from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()
  const [showGuide, setShowGuide] = useState(false)

  // If already running as an installed standalone PWA, hide the button
  if (isInstalled) {
    return null
  }

  const renderInstallGuideModal = () => {
    if (!showGuide) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in select-none">
        <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl text-zinc-800 dark:text-zinc-200 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                <Smartphone className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {isIOS ? 'Install on iPhone / iPad' : 'Install Desktop / Mobile App'}
              </h3>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3 text-xs text-zinc-500 dark:text-zinc-400">
            {isIOS ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">1</span>
                  <p>Tap the <strong className="text-zinc-900 dark:text-zinc-100">Share</strong> button in the Safari toolbar at the bottom.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">2</span>
                  <p>Scroll down and select <strong className="text-zinc-900 dark:text-zinc-100">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">3</span>
                  <p>Launch Chatze from your home screen for 0ms offline loads and full-screen experience.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">PC</span>
                  <p>On Chrome/Edge/Brave, look for the <strong className="text-zinc-900 dark:text-zinc-100">Install App</strong> icon in the address bar (right side).</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">📱</span>
                  <p>On Android, tap the <strong className="text-zinc-900 dark:text-zinc-100">three dots menu</strong> (⋮) and tap <strong className="text-zinc-900 dark:text-zinc-100">Install app</strong> or <strong className="text-zinc-900 dark:text-zinc-100">Add to Home screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center shrink-0 font-bold text-[10px]">⚡</span>
                  <p>Opens as a standalone desktop/mobile app with instant local IndexedDB loading and zero server resource overhead.</p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowGuide(false)}
            className="mt-5 w-full rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 py-2.5 text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Got It
          </button>
        </div>
      </div>
    )
  }

  // Chromium / Android / Desktop direct prompt flow
  if (isInstallable) {
    return (
      <>
        <button
          onClick={install}
          className={`flex items-center gap-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold px-3 py-1.5 text-xs transition-colors shadow-xs cursor-pointer ${className}`}
          title="Install Chatze on your device"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
        {renderInstallGuideModal()}
      </>
    )
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-medium px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install iOS</span>
        </button>
        {renderInstallGuideModal()}
      </>
    )
  }

  // Desktop general fallback when beforeinstallprompt is pending or on supported desktop browsers
  return (
    <>
      <button
        onClick={() => {
          if (isInstallable) {
            install()
          } else {
            setShowGuide(true)
          }
        }}
        className={`flex items-center gap-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-medium px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${className}`}
        title="Install Chatze on PC, Mac, or Phone"
      >
        <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        <span>Install App</span>
      </button>
      {renderInstallGuideModal()}
    </>
  )
}
