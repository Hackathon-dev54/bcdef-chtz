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
    <div className="space-y-4 text-xs">
      {/* Status Banner */}
      <div
        className={`p-3.5 rounded-xl border space-y-2 ${
          hubListed
            ? 'bg-[#00a884]/10 border-[#00a884]/30 text-[#e9edef]'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className={`w-4 h-4 ${hubListed ? 'text-[#00a884]' : 'text-amber-400'}`} />
            <span className="font-bold">
              Chatze Hub Status: {hubListed ? 'Active & Listed' : 'Unlisted (404 for Visitors)'}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              hubListed ? 'bg-[#00a884]/20 text-[#00a884]' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {hubListed ? '🟢 DIRECTORY ACTIVE' : '⚪ UNLISTED'}
          </span>
        </div>
        <p className="text-[11px] text-[#8696a0] leading-relaxed">
          {hubListed
            ? 'Your Letterbox is active in the Nepal Discovery Directory. Consumers can discover your store and send spam-protected inquiries via Google Sign-In.'
            : 'Your Letterbox is unlisted. Visitors attempting to open or embed your Letterbox will receive a 404 Access Restricted notice.'}
        </p>
      </div>

      {/* Hub Listing Toggle */}
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#e9edef]">Enable Listing on Chatze Hub</span>
          <input
            type="checkbox"
            checked={hubListed}
            onChange={(e) => setHubListed(e.target.checked)}
            className="w-4 h-4 accent-[#00a884] cursor-pointer"
          />
        </div>
        <p className="text-[11px] text-[#8696a0]">
          If disabled, all inbound customer inquiries to this node are restricted and return 404.
        </p>
      </div>

      {/* 1-Click Sync to Hub Button */}
      <div className="p-3.5 bg-[#182229] border border-[#202c33] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-[#e9edef] block">1-Click Publish to Hub</span>
            <span className="text-[11px] text-[#8696a0]">
              Publish or update your store name, tags, and embed link in the Hub directory
            </span>
          </div>
          <button
            type="button"
            onClick={handleSyncToHub}
            disabled={syncingHub}
            className="px-3.5 py-2 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 shrink-0"
          >
            {syncingHub ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#111b21] border-t-transparent rounded-full animate-spin" />
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
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{hubSyncSuccess}</span>
          </div>
        )}

        {hubSyncError && (
          <div className="p-2.5 bg-red-950/40 border border-red-800/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{hubSyncError}</span>
          </div>
        )}
      </div>

      {/* Protected Embed Link */}
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#e9edef] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00a884]" />
            <span>Sovereign Letterbox Embed URL</span>
          </span>
          <a
            href={getHubStoreUrl(handle)}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-[#00a884] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Preview in Hub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[10px] text-[#8696a0]">
          This URL is protected: it cannot be opened in naked browser tabs (automatically redirects to Hub). It only renders when embedded inside Chatze Hub.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={`${instanceUrl || window.location.origin}/letterbox?shop=${handle}`}
            className="flex-1 px-2.5 py-1.5 bg-[#111b21] border border-[#202c33] rounded-lg text-[11px] text-[#8696a0] font-mono select-all"
          />
          <button
            type="button"
            onClick={() => {
              const url = `${instanceUrl || window.location.origin}/letterbox?shop=${handle}`
              navigator.clipboard.writeText(url)
              setCopiedEmbedUrl(true)
              setTimeout(() => setCopiedEmbedUrl(false), 2000)
            }}
            className="px-3 py-1.5 bg-[#202c33] hover:bg-[#2a3942] text-[#e9edef] font-semibold rounded-lg text-xs flex items-center gap-1 shrink-0 cursor-pointer"
          >
            {copiedEmbedUrl ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEmbedUrl ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Tier 2 Cryptographic Protocol Handshake Info */}
      <div className="p-3 bg-[#111b21] border border-[#202c33] rounded-xl space-y-2 text-[11px]">
        <div className="flex items-center justify-between text-[#8696a0]">
          <span className="font-semibold text-white">Tier 2 Protocol Discovery:</span>
          <span className="text-[#00a884] font-mono font-bold">chatze-letterbox-v1</span>
        </div>
        <div className="flex items-center justify-between text-[#8696a0]">
          <span>Well-Known Endpoint:</span>
          <a
            href="/.well-known/chatze-node.json"
            target="_blank"
            rel="noreferrer"
            className="text-[#00a884] font-mono hover:underline flex items-center gap-1"
          >
            <span>/.well-known/chatze-node.json</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
        <div className="flex items-center justify-between text-[#8696a0]">
          <span>Cryptographic Key:</span>
          <span className="font-mono text-[#8696a0]">ECDSA P-256 (Ed25519 compatible)</span>
        </div>
      </div>

      {/* Standalone Chatze Hub Codebase Download */}
      <div className="p-3 bg-gradient-to-r from-[#182229] to-[#111b21] border border-[#2a3942] rounded-xl flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-white font-semibold text-xs flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-[#00a884]" />
            <span>Chatze Hub Project Codebase</span>
          </p>
          <p className="text-[#8696a0] text-[10px] mt-0.5 truncate">
            Self-contained Cloudflare D1 + Hono + Vite gateway ready for deployment
          </p>
        </div>
        <a
          href="/chatze-hub.zip"
          download="chatze-hub.zip"
          className="px-3 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
          title="Download chatze-hub.zip"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download .zip</span>
        </a>
      </div>
    </div>
  )
}
