import React from 'react'
import { QrCode, X } from 'lucide-react'
import type { Conversation } from '../types'

interface PaymentQrModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: { display_name: string }
  activeConv: Conversation | null
  handleSendMessage: (e?: React.FormEvent, customText?: string) => void
}

export const PaymentQrModal: React.FC<PaymentQrModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activeConv,
  handleSendMessage,
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="max-w-xs w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Payment QR
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-white rounded-xl mx-auto w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-xs">
          <QrCode className="w-36 h-36 sm:w-40 sm:h-40 text-zinc-950" />
        </div>

        <div className="space-y-1 text-xs">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{currentUser.display_name}</p>
          <p className="text-zinc-500 dark:text-zinc-400">Scan via banking / digital wallet</p>
        </div>

        <button
          onClick={() => {
            onClose()
            if (activeConv && activeConv.status !== 'pending') {
              handleSendMessage(
                undefined,
                '💳 Scannable Payment QR: Open your mobile banking or wallet app and scan to pay.'
              )
            }
          }}
          className="w-full py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
        >
          Share QR in Chat
        </button>
      </div>
    </div>
  )
}
