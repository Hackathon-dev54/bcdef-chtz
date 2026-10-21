import React from 'react'
import {
  Store,
  Sparkles,
  Lock,
  ExternalLink,
  Check,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react'
import { getHubStoreUrl } from '../../lib/hubConfig'

interface HubSettingsTabProps {
  hubListed: boolean
  setHubListed: (val: boolean) => void
  syncingHub: boolean
  handleSyncToHub: () => void
  hubSyncSuccess: string
  hubSyncError: string
  handle: string
  instanceUrl: string
  copiedEmbedUrl: boolean
  setCopiedEmbedUrl: (val: boolean) => void
}

export const HubSettingsTab: React.FC<HubSettingsTabProps> = ({
  hubListed,
  setHubListed,
  syncingHub,
  handleSyncToHub,
  hubSyncSuccess,
  hubSyncError,
  handle,
  instanceUrl,
  copiedEmbedUrl,
  setCopiedEmbedUrl,
}) => {
  return (
    <div className="space-y-4 text-xs select-none">
      {/* Status Banner */}
      <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              Chatze Hub Status: {hubListed ? 'Active & Listed' : 'Unlisted'}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            {hubListed ? '● DIRECTORY ACTIVE' : '○ UNLISTED'}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {hubListed
            ? 'Your Letterbox is active in the Discovery Directory. Customers can find your store and send spam-protected inquiries.'
            : 'Your Letterbox is unlisted. Visitors attempting to open your Letterbox will receive an unlisted notice.'}
        </p>
      </div>

      {/* Hub Listing Toggle */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">Enable Listing on Chatze Hub</span>
          <input
            type="checkbox"
            checked={hubListed}
            onChange={(e) => setHubListed(e.target.checked)}
            className="w-4 h-4 accent-zinc-900 dark:accent-white cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          If disabled, all inbound customer inquiries to this node are restricted.
        </p>
      </div>

      {/* 1-Click Sync to Hub Button */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 block">1-Click Publish to Hub</span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Publish or update your store name, tags, and embed link in the Hub directory
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncToHub}
            disabled={syncingHub}
            className="px-4 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            {syncingHub ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish to Hub</span>
              </>
            )}
          </button>
        </div>

        {hubSyncSuccess && (
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{hubSyncSuccess}</span>
          </div>
        )}

        {hubSyncError && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{hubSyncError}</span>
          </div>
        )}
      </div>

      {/* Protected Embed Link */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
            <span>Sovereign Letterbox Embed URL</span>
          </span>
          <a
            href={getHubStoreUrl(handle)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Preview in Hub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
          This URL is protected: it cannot be opened in naked browser tabs (automatically redirects to Hub). It only renders when embedded inside Chatze Hub.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={`${instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/letterbox?shop=${handle}`}
            className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-700 dark:text-zinc-300 font-mono select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              const url = `${instanceUrl || (typeof window !== 'undefined' ? window.location.origin : '')}/letterbox?shop=${handle}`
              navigator.clipboard.writeText(url)
              setCopiedEmbedUrl(true)
              setTimeout(() => setCopiedEmbedUrl(false), 2000)
            }}
            className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            {copiedEmbedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copiedEmbedUrl ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Tier 2 Cryptographic Protocol Handshake Info */}
      <div className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Tier 2 Protocol Discovery:</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-mono font-bold">chatze-letterbox-v1</span>
        </div>
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span>Well-Known Endpoint:</span>
          <a
            href="/.well-known/chatze-node.json"
            target="_blank"
            rel="noreferrer"
            className="text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white font-mono hover:underline flex items-center gap-1"
          >
            <span>/.well-known/chatze-node.json</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
          <span>Cryptographic Key:</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">ECDSA P-256 (Ed25519 compatible)</span>
        </div>
      </div>

      {/* Standalone Chatze Hub Codebase Download */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-zinc-900 dark:text-zinc-100 font-bold text-xs flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5" />
            <span>Chatze Hub Project Codebase</span>
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 text-[10px] mt-0.5 truncate">
            Self-contained Cloudflare D1 + Hono + Vite gateway ready for deployment
          </p>
        </div>
        <a
          href="/chatze-hub.zip"
          download="chatze-hub.zip"
          className="px-3.5 py-2 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
          title="Download chatze-hub.zip"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .zip</span>
        </a>
      </div>
    </div>
  )
}
