import React, { useState, useEffect } from 'react'
import {
  CheckCircle2,
  Database,
  ShieldCheck,
  Layers,
  RefreshCw,
  HardDrive,
  Image as ImageIcon,
  ChevronDown,
} from 'lucide-react'

interface ShardInfo {
  shardId: number
  databaseName: string
  bindingKey: string
  sizeMB: number
  hardcapMB: number
  percentUsed: number
  status: 'active_write' | 'sealed_full' | 'standby' | 'unbound'
  isMediaVault: boolean
}

interface SystemShardsResponse {
  isMultiSharded: boolean
  activeShardId: number
  hardcapPerShardMB: number
  maxVaultShards: number
  coreDatabase: {
    name: string
    sizeMB: number
    hardcapMB: number
  }
  shards: ShardInfo[]
  mediaStorageEngine: string
  r2Connected?: boolean
  totalPotentialCapacityMB: number
}

export const EdgeStorageTab: React.FC = () => {
  const [data, setData] = useState<SystemShardsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showR2Guide, setShowR2Guide] = useState(false)

  const fetchShards = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await fetch('/api/system/shards')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e) {
      console.warn('[Shards Fetch Failed]', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchShards()
  }, [])

  return (
    <div className="space-y-4 text-xs select-none">
      {/* Overview Card */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs tracking-wide">
              9-Database Edge Sharding Pool
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchShards(true)}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            title="Refresh shard storage metrics"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">Active Write Shard</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Shard #{data?.activeShardId || 1}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">Hardcap Per Shard</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
              {data?.hardcapPerShardMB || 450} MB (Safe)
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-zinc-500 dark:text-zinc-400 block text-[10px]">Total Sharded Capacity</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5 block">
              ~4,050 MB (9 DBs)
            </span>
          </div>
        </div>

        {/* 10th Slot Reserved Safety Guardrail */}
        <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-start gap-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-zinc-900 dark:text-zinc-100">Account Quota Protected:</strong> 9 of Cloudflare&apos;s 10 free D1 databases are allocated. The 10th database slot is intentionally kept free as a safety margin so your account quota can never be exceeded.
          </div>
        </div>
      </div>

      {/* Shard Matrix */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Real-Time Shard Allocations
          </span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
            Automatic Zero-Touch Rollover
          </span>
        </div>

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
            <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[11px]">Reading SQLite PRAGMA metrics...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Core Database */}
            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2.5">
                <HardDrive className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100">chatze_db (Core Database)</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Users, Sessions, Hub Config &amp; Shard Directory</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {data?.coreDatabase?.sizeMB || 0} / 450 MB
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded font-semibold uppercase">
                  Primary Core
                </span>
              </div>
            </div>

            {/* Shards 1 through 8 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(data?.shards || []).map((s) => {
                const isActive = s.status === 'active_write'
                const isMedia = s.isMediaVault

                return (
                  <div
                    key={s.shardId}
                    className={`p-3 rounded-xl border text-[11px] transition-colors ${
                      isActive
                        ? 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>}
                        {s.databaseName}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase ${
                          isActive
                            ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                            : isMedia
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        {isActive ? 'Active Write' : isMedia ? 'Media Vault' : 'Standby'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          s.percentUsed > 85
                            ? 'bg-rose-500'
                            : s.percentUsed > 60
                            ? 'bg-amber-400'
                            : 'bg-zinc-950 dark:bg-white'
                        }`}
                        style={{ width: `${Math.max(s.percentUsed, 2)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>{s.sizeMB} MB / {s.hardcapMB} MB</span>
                      <span>{s.percentUsed}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Media Engine & Optional 10 GB R2 Upgrade Card */}
      <div className="p-4 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs tracking-wide">
              Media Engine &amp; Storage
            </span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
            {data?.r2Connected ? 'Cloudflare R2 (10 GB Pool)' : 'D1 Shard 8 (Free Mode - 450 MB)'}
          </span>
        </div>

        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {data?.r2Connected
            ? 'Your Chatze instance is connected to Cloudflare R2 object storage with 10 GB of free capacity for images, audio, and documents.'
            : 'Images and voice notes are compressed to lightweight ~25 KB WebP files and stored inside D1 SQLite Shard 8 (~18,000 photos for $0/mo).'}
        </p>

        {/* Collapsible / expandable R2 guide for serious merchants */}
        {!data?.r2Connected && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowR2Guide(!showR2Guide)}
              className="w-full flex items-center justify-between text-[11px] text-zinc-900 dark:text-zinc-100 hover:opacity-80 font-semibold cursor-pointer"
            >
              <span>Optional: Upgrade to 10 GB Cloudflare R2 (Step-by-Step)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showR2Guide ? 'rotate-180' : ''}`} />
            </button>

            {showR2Guide && (
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2 text-[11px] text-zinc-600 dark:text-zinc-400">
                <div className="text-zinc-900 dark:text-zinc-100 font-bold text-[11px]">
                  How to unlock 10 GB free object storage in Cloudflare Dashboard (No CLI):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-0.5 text-[11px]">
                  <li>
                    In Cloudflare Dashboard, go to <strong className="text-zinc-900 dark:text-zinc-100">R2 Object Storage</strong> and click <strong className="text-zinc-900 dark:text-zinc-100">Create bucket</strong> (Name it <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-900 dark:text-zinc-100">chatze-media</code>).
                  </li>
                  <li>
                    Go to <strong className="text-zinc-900 dark:text-zinc-100">Workers &amp; Pages</strong> &rarr; Click your <strong className="text-zinc-900 dark:text-zinc-100">chatze</strong> worker &rarr; <strong className="text-zinc-900 dark:text-zinc-100">Settings</strong> &rarr; <strong className="text-zinc-900 dark:text-zinc-100">Bindings</strong>.
                  </li>
                  <li>
                    Click <strong className="text-zinc-900 dark:text-zinc-100">Add</strong> &rarr; Select <strong className="text-zinc-900 dark:text-zinc-100">R2 Bucket</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-zinc-800 dark:text-zinc-200">
                      <li>Variable name: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-900 dark:text-zinc-100">MEDIA_BUCKET</code></li>
                      <li>R2 Bucket: <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono text-zinc-900 dark:text-zinc-100">chatze-media</code></li>
                    </ul>
                  </li>
                  <li>
                    Click <strong className="text-zinc-900 dark:text-zinc-100">Save and Deploy</strong>.
                  </li>
                </ol>
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300">
                  Zero data loss: Any photos already saved in D1 Shard 8 will continue loading seamlessly!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-bold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 100% Zero-Touch Automation
        </span>
        <p className="leading-relaxed">
          You don&apos;t need to run any wrangler commands or manually configure shards. When Shard 1 approaches 450 MB, the system automatically rolls over to Shard 2 seamlessly without dropping any customer messages.
        </p>
      </div>
    </div>
  )
}
