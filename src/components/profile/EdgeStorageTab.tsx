import React, { useState, useEffect } from 'react'
import { CheckCircle2, Database, ShieldCheck, Layers, RefreshCw, HardDrive, Info } from 'lucide-react'

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
  totalPotentialCapacityMB: number
}

export const EdgeStorageTab: React.FC = () => {
  const [data, setData] = useState<SystemShardsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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
    <div className="space-y-3.5 text-xs">
      {/* Overview Card */}
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00a884]" />
            <span className="font-bold text-[#e9edef] text-[12px] tracking-wide">
              9-Database Edge Sharding Pool
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchShards(true)}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] text-[#8696a0] hover:text-[#00a884] transition-colors cursor-pointer"
            title="Refresh shard storage metrics"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-[#00a884]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 bg-[#111b21] border border-[#202c33] rounded-lg">
            <span className="text-[#8696a0] block text-[10px]">Active Write Shard</span>
            <span className="font-semibold text-[#00a884] flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>
              Shard #{data?.activeShardId || 1}
            </span>
          </div>

          <div className="p-2 bg-[#111b21] border border-[#202c33] rounded-lg">
            <span className="text-[#8696a0] block text-[10px]">Hardcap Per Shard</span>
            <span className="font-semibold text-[#e9edef] mt-0.5 block">
              {data?.hardcapPerShardMB || 450} MB (Safe)
            </span>
          </div>

          <div className="p-2 bg-[#111b21] border border-[#202c33] rounded-lg col-span-2 sm:col-span-1">
            <span className="text-[#8696a0] block text-[10px]">Total Sharded Capacity</span>
            <span className="font-semibold text-[#00a884] mt-0.5 block">
              ~4,050 MB (9 DBs)
            </span>
          </div>
        </div>

        {/* 10th Slot Reserved Safety Guardrail */}
        <div className="p-2 bg-[#111b21] border border-[#00a884]/30 rounded-lg flex items-start gap-2 text-[11px] text-[#8696a0]">
          <ShieldCheck className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong className="text-[#e9edef]">Account Quota Protected:</strong> 9 of Cloudflare&apos;s 10 free D1 databases are allocated. The 10th database slot is intentionally kept free as a safety margin so your account quota can never be exceeded.
          </div>
        </div>
      </div>

      {/* Shard Matrix */}
      <div className="p-3.5 bg-[#0b141a] border border-[#202c33] rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#e9edef] text-[11px] uppercase tracking-wider text-[#8696a0] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#00a884]" />
            Real-Time Shard Allocations
          </span>
          <span className="text-[10px] text-[#8696a0]">
            Automatic Zero-Touch Rollover
          </span>
        </div>

        {loading ? (
          <div className="py-6 flex flex-col items-center justify-center gap-2 text-[#8696a0]">
            <div className="w-5 h-5 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[11px]">Reading SQLite PRAGMA metrics...</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Core Database */}
            <div className="p-2 bg-[#111b21] border border-[#202c33] rounded-lg flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-[#00a884]" />
                <div>
                  <div className="font-semibold text-[#e9edef]">chatze_db (Core Database)</div>
                  <div className="text-[10px] text-[#8696a0]">Users, Sessions, Hub Config &amp; Shard Directory</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-[#e9edef]">
                  {data?.coreDatabase?.sizeMB || 0} / 450 MB
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#00a884]/20 text-[#00a884] rounded font-semibold uppercase">
                  Primary Core
                </span>
              </div>
            </div>

            {/* Shards 1 through 8 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {(data?.shards || []).map((s) => {
                const isActive = s.status === 'active_write'
                const isMedia = s.isMediaVault

                return (
                  <div
                    key={s.shardId}
                    className={`p-2 rounded-lg border text-[11px] transition-colors ${
                      isActive
                        ? 'bg-[#111b21] border-[#00a884]/50'
                        : 'bg-[#111b21]/70 border-[#202c33]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-[#e9edef] flex items-center gap-1.5">
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse"></span>}
                        {s.databaseName}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                          isActive
                            ? 'bg-[#00a884] text-[#111b21]'
                            : isMedia
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-[#202c33] text-[#8696a0]'
                        }`}
                      >
                        {isActive ? 'Active Write' : isMedia ? 'Media Vault' : 'Standby'}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-[#202c33] h-1.5 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          s.percentUsed > 85
                            ? 'bg-rose-500'
                            : s.percentUsed > 60
                            ? 'bg-amber-400'
                            : 'bg-[#00a884]'
                        }`}
                        style={{ width: `${Math.max(s.percentUsed, 2)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#8696a0]">
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

      {/* Info Notice */}
      <div className="p-3 bg-[#00a884]/10 border border-[#00a884]/20 rounded-xl space-y-1 text-[11px] text-[#e9edef]">
        <span className="font-bold flex items-center gap-1.5 text-[#00a884]">
          <CheckCircle2 className="w-3.5 h-3.5" /> 100% Zero-Touch Automation
        </span>
        <p className="text-[#8696a0] leading-relaxed">
          You don&apos;t need to run any wrangler commands or manually configure shards. When Shard 1 approaches 450 MB, the system automatically rolls over to Shard 2 seamlessly without dropping any customer messages.
        </p>
      </div>
    </div>
  )
}
