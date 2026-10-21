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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
      <div className="max-w-md w-full bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-zinc-700 dark:text-zinc-300" /> Send Photo
          </span>
          <button
            disabled={isUploadingImage}
            onClick={() => setSelectedImageFile(null)}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-black/50 max-h-[300px] sm:max-h-[360px] flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
          <img
            src={selectedImageFile.dataUrl}
            alt="Upload preview"
            className="w-full h-auto max-h-[300px] sm:max-h-[360px] object-contain rounded-xl"
          />
          <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-zinc-900/80 text-white text-[10px] font-mono shadow-xs backdrop-blur-xs">
            ~{selectedImageFile.sizeKb} KB (WebP)
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
            className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={() => setSelectedImageFile(null)}
            className="px-4 py-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isUploadingImage}
            onClick={handleSendImage}
            className="px-5 py-2.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 disabled:opacity-40 font-semibold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all"
          >
            {isUploadingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
