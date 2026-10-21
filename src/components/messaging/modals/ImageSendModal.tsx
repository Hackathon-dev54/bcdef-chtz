import React from 'react'
import { Image as ImageIcon, X, Loader2, Send } from 'lucide-react'

interface SelectedImageData {
  dataUrl: string
  caption: string
  sizeKb: number
  originalKb?: number
}

interface ImageSendModalProps {
  selectedImageFile: SelectedImageData | null
  setSelectedImageFile: React.Dispatch<React.SetStateAction<SelectedImageData | null>>
  isUploadingImage: boolean
  handleSendImage: () => void
}

export const ImageSendModal: React.FC<ImageSendModalProps> = ({
  selectedImageFile,
  setSelectedImageFile,
  isUploadingImage,
  handleSendImage,
}) => {
  if (!selectedImageFile) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50">
      <div className="max-w-md w-full bg-[#111b21] border border-[#202c33] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#e9edef] flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-[#00a884]" /> Send Photo
          </span>
          <button
            disabled={isUploadingImage}
            onClick={() => setSelectedImageFile(null)}
            className="text-[#8696a0] hover:text-[#e9edef] disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-black/50 max-h-[300px] sm:max-h-[360px] flex items-center justify-center border border-white/5">
          <img
            src={selectedImageFile.dataUrl}
            alt="Upload preview"
            className="w-full h-auto max-h-[300px] sm:max-h-[360px] object-contain rounded-xl"
          />
          <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[10px] text-[#00a884] font-mono border border-[#00a884]/30 shadow-lg">
            ~{selectedImageFile.sizeKb} KB
            {selectedImageFile.originalKb && selectedImageFile.originalKb > selectedImageFile.sizeKb ? (
              <span className="text-white/80 ml-1">
                (from {selectedImageFile.originalKb} KB,{' '}
                {Math.round((1 - selectedImageFile.sizeKb / selectedImageFile.originalKb) * 100)}% saved)
              </span>
            ) : (
              ' (Edge Optimized)'
            )}
          </span>
        </div>

        <div className="space-y-1">
          <input
            type="text"
            disabled={isUploadingImage}
            value={selectedImageFile.caption}
            onChange={(e) =>
              setSelectedImageFile((prev) => (prev ? { ...prev, caption: e.target.value } : null))
            }
            placeholder="Add a caption... (optional)"
            className="w-full px-3.5 py-2.5 bg-[#202c33] border border-[#222e35] rounded-xl text-xs sm:text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:border-[#00a884]"
          />
          <p className="text-[10px] text-[#8696a0] px-1 flex items-center justify-between">
            <span>Auto-converted to lightweight WebP for D1 database storage.</span>
            <span className="text-[#00a884] font-medium">Cached via wsrv.nl</span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={() => setSelectedImageFile(null)}
            className="px-4 py-2 text-xs text-[#8696a0] hover:text-[#e9edef] disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={handleSendImage}
            className="px-5 py-2.5 bg-[#00a884] hover:bg-[#02906f] disabled:opacity-50 text-[#111b21] font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00a884]/20"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send Photo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
