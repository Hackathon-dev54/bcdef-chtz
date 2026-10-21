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
    <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
        <span className="flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5" /> Incoming Connection Requests ({incomingRequests.length})
        </span>
      </div>
      {incomingRequests.map((req) => (
        <div key={req.id} className="p-2.5 bg-[#111b21] border border-[#202c33] rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#e9edef]">@{req.remote_handle}</span>
            <span className="text-[10px] text-[#8696a0] truncate max-w-[130px]">
              {req.remote_instance_url.replace(/^https?:\/\//, '')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAcceptFriendRequest(req.remote_handle, req.remote_instance_url)}
              className="flex-1 py-1.5 bg-[#00a884] hover:bg-[#02906f] text-[#111b21] font-bold rounded-lg text-xs transition-all cursor-pointer"
            >
              Accept
            </button>
            <button
              onClick={() => handleRejectFriendRequest(req.remote_handle, false)}
              className="px-2.5 py-1.5 bg-[#202c33] hover:bg-[#222e35] text-[#8696a0] rounded-lg text-xs transition-all cursor-pointer"
            >
              Decline
            </button>
            <button
              onClick={() => handleRejectFriendRequest(req.remote_handle, true, req.remote_instance_url)}
              title="Block this root domain"
              className="px-2 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-all cursor-pointer"
            >
              Block
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
