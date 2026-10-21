import React from 'react'
import { Sparkles, Search, Bell, Sun, Moon } from 'lucide-react'

export const ChatSkeletonShell: React.FC = () => {
  const isDark = typeof window !== 'undefined' ? localStorage.getItem('chatze_theme') !== 'light' : true

  return (
    <div className={`${isDark ? 'dark' : ''} flex flex-col h-screen w-full bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans select-none transition-colors`}>
      {/* 1. Ultra-Slim Modern Accent Connecting Bar (Indeterminate shimmer pulse at very top) */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-zinc-900 dark:via-zinc-100 to-transparent animate-pulse z-50" />

      {/* 2. Top Header Navbar (Identical layout to live TopNavbar) */}
      <header className="h-14 sm:h-16 w-full border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] px-4 sm:px-6 flex items-center justify-between shrink-0 z-30 select-none">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 flex items-center justify-center font-bold text-sm shadow-xs animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
            chatze.
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-zinc-400 dark:text-zinc-500">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse flex items-center justify-center">
            <Search className="w-4 h-4 opacity-40" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse flex items-center justify-center">
            <Bell className="w-4 h-4 opacity-40" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse flex items-center justify-center">
            {isDark ? <Moon className="w-4 h-4 opacity-40" /> : <Sun className="w-4 h-4 opacity-40" />}
          </div>
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse ml-1" />
        </div>
      </header>

      {/* 3. Main Workspace Layout */}
      <div className="flex flex-1 w-full overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#121214] flex flex-col shrink-0 h-full">
          {/* Search Bar Skeleton */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800/50">
            <div className="h-9 w-full rounded-xl bg-zinc-100 dark:bg-zinc-850/80 animate-pulse flex items-center px-3 gap-2">
              <Search className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-600" />
              <div className="h-3 w-28 rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
            </div>
          </div>

          {/* Filter Pills Skeleton */}
          <div className="px-3 py-2 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/40">
            <div className="h-6 w-14 rounded-lg bg-zinc-900/10 dark:bg-white/10 animate-pulse" />
            <div className="h-6 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            <div className="h-6 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
          </div>

          {/* Recent Conversations Skeleton List */}
          <div className="p-2 space-y-2 flex-1 overflow-hidden">
            <div className="px-3 pt-1 text-[10px] font-bold tracking-wider uppercase text-zinc-300 dark:text-zinc-600">
              Recent
            </div>

            {[1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl flex items-center gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 border border-transparent animate-pulse"
              >
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2.5 w-8 rounded bg-zinc-100 dark:bg-zinc-850" />
                  </div>
                  <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-850" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Skeleton */}
          <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500/60 animate-ping" />
              <div className="h-3 w-28 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
          </div>
        </aside>

        {/* Right Active Chat Window Skeleton (Hidden on small mobile screens) */}
        <main className="hidden md:flex flex-1 flex-col h-full bg-white dark:bg-[#09090b] relative">
          {/* Chat Header Skeleton */}
          <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="space-y-1">
                <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="h-2.5 w-20 rounded bg-zinc-100 dark:bg-zinc-850 animate-pulse" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 animate-pulse" />
            </div>
          </div>

          {/* Chat Messages Stream Skeleton */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-hidden flex flex-col justify-end">
            {/* Date Pill Skeleton */}
            <div className="mx-auto h-5 w-20 rounded-full bg-zinc-100 dark:bg-zinc-850 animate-pulse" />

            {/* Message Left (Incoming) */}
            <div className="flex items-end gap-2 max-w-sm">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              <div className="p-3.5 rounded-2xl rounded-bl-xs bg-zinc-100 dark:bg-zinc-850 space-y-1.5 w-64 animate-pulse">
                <div className="h-3 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-3 w-32 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>

            {/* Message Right (Outgoing) */}
            <div className="flex items-end justify-end max-w-sm ml-auto">
              <div className="p-3.5 rounded-2xl rounded-br-xs bg-zinc-950 text-white dark:bg-zinc-800 space-y-1.5 w-56 animate-pulse">
                <div className="h-3 w-40 rounded bg-zinc-800 dark:bg-zinc-700" />
                <div className="h-2.5 w-16 rounded bg-zinc-800 dark:bg-zinc-700 ml-auto" />
              </div>
            </div>

            {/* Message Left (Incoming) */}
            <div className="flex items-end gap-2 max-w-sm">
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
              <div className="p-3.5 rounded-2xl rounded-bl-xs bg-zinc-100 dark:bg-zinc-850 space-y-1.5 w-52 animate-pulse">
                <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>

          {/* Bottom Chat Composer Skeleton */}
          <div className="p-3 sm:p-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
            <div className="h-10 flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-850 animate-pulse flex items-center px-4">
              <div className="h-3 w-36 rounded bg-zinc-200/60 dark:bg-zinc-800/60" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-zinc-800 animate-pulse shrink-0" />
          </div>
        </main>
      </div>
    </div>
  )
}
