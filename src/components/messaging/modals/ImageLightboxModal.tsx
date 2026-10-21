import React from 'react'
import { Download, X } from 'lucide-react'
import { getOptimizedImageUrl } from '../mediaUtils'

interface ImageLightboxModalProps {
  lightboxUrl: string | null
  onClose: () => void
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  lightboxUrl,
  onClose,
}) => {
  if (!lightboxUrl) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
      >
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <a
            href={getOptimizedImageUrl(lightboxUrl, 1600)}
            target="_blank"
            rel="noopener noreferrer"
            download="photo.webp"
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
            title="Download original"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <img
          src={getOptimizedImageUrl(lightboxUrl, 1600)}
          onError={(e) => {
            const target = e.currentTarget
            if (lightboxUrl && target.src !== lightboxUrl) {
              target.src = lightboxUrl
            }
          }}
          alt="Full view"
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      </div>
    </div>
  )
}
