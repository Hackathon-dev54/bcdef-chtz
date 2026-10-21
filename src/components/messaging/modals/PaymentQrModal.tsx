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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="max-w-xs w-full bg-[#111b21] border border-[#202c33] rounded-2xl p-5 sm:p-6 text-center space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#00a884] uppercase tracking-wider">
            Fonepay & eSewa QR
          </span>
          <button onClick={onClose} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-white rounded-xl mx-auto w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          <QrCode className="w-36 h-36 sm:w-40 sm:h-40 text-slate-950" />
        </div>

        <div className="space-y-1 text-xs">
          <p className="font-semibold text-[#e9edef]">{currentUser.display_name}</p>
          <p className="text-[#8696a0]">Scan via eSewa, Khalti, or mobile banking</p>
        </div>

        <button
          onClick={() => {
            onClose()
            if (activeConv && activeConv.status !== 'pending') {
              handleSendMessage(
                undefined,
                '💳 Scannable Payment QR: Open your eSewa, Khalti, or mobile banking app and scan to pay.'
              )
            }
          }}
          className="w-full py-2.5 bg-[#00a884] text-[#111b21] font-bold rounded-xl text-xs hover:bg-[#02906f] transition-colors cursor-pointer"
        >
          Share QR in Chat
        </button>
      </div>
    </div>
  )
}
