import React from 'react'
import { Bell } from 'lucide-react'
import type { Friendship } from './types'

interface IncomingRequestsBannerProps {
  incomingRequests: Friendship[]
  handleAcceptFriendRequest: (remoteHandle: string, remoteInstanceUrl: string) => void
  handleRejectFriendRequest: (remoteHandle: string, blockDomain?: boolean, remoteInstanceUrl?: string) => void
}

export const IncomingRequestsBanner: React.FC<IncomingRequestsBannerProps> = ({
  incomingRequests,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
}) => {
  if (incomingRequests.length === 0) return null

  return (
    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 space-y-2 select-none">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        <span className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Incoming Connection Requests ({incomingRequests.length})
        </span>
      </div>
      {incomingRequests.map((req) => (
        <div key={req.id} className="p-3 bg-white dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-zinc-900 dark:text-zinc-100">@{req.remote_handle}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[130px]">
              {req.remote_instance_url.replace(/^https?:\/\//, '')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAcceptFriendRequest(req.remote_handle, req.remote_instance_url)}
              className="flex-1 py-1.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
            >
              Accept
            </button>
            <button
              onClick={() => handleRejectFriendRequest(req.remote_handle, false)}
              className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => handleRejectFriendRequest(req.remote_handle, true, req.remote_instance_url)}
              title="Block this root domain"
              className="px-2 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Block
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
