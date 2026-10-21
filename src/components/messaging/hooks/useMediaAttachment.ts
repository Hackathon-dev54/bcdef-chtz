import React, { useState, useRef } from 'react'
import { compressImageToWebP } from '../mediaUtils'
import { getAuthHeaders } from '../authUtils'
import { Conversation } from '../types'

export function useMediaAttachment({
  activeConv,
  onSendMessage,
}: {
  activeConv: Conversation | null
  onSendMessage: (e?: React.FormEvent, customText?: string) => Promise<void>
}) {
  const [selectedImageFile, setSelectedImageFile] = useState<{
    dataUrl: string
    caption: string
    sizeKb: number
    originalKb?: number
  } | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const { dataUrl, sizeKb, originalKb } = await compressImageToWebP(file)
      setSelectedImageFile({ dataUrl, caption: '', sizeKb, originalKb })
    } catch (err) {
      console.error('Image compression error', err)
      alert('Failed to process image. Please try a different photo.')
    }
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile()
        if (file) {
          e.preventDefault()
          try {
            const { dataUrl, sizeKb, originalKb } = await compressImageToWebP(file)
            setSelectedImageFile({ dataUrl, caption: '', sizeKb, originalKb })
          } catch (err) {
            console.error('Clipboard image error', err)
          }
          break
        }
      }
    }
  }

  const handleSendImage = async () => {
    if (!selectedImageFile || !activeConv) return
    setIsUploadingImage(true)
    try {
      const uploadRes = await fetch('/api/media/upload', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          data: selectedImageFile.dataUrl,
          contentType: 'image/webp',
        }),
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok || !uploadData.url) {
        alert(uploadData.error || 'Failed to upload photo')
        return
      }

      const publicUrl = uploadData.url
      const formattedBody = selectedImageFile.caption?.trim()
        ? `[img:${publicUrl}|${selectedImageFile.caption.trim()}]`
        : `[img:${publicUrl}]`

      setSelectedImageFile(null)
      await onSendMessage(undefined, formattedBody)
    } catch (err: any) {
      console.error('Image send error', err)
      alert('Failed to send image: ' + (err?.message || 'Network error'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  return {
    selectedImageFile,
    setSelectedImageFile,
    isUploadingImage,
    lightboxUrl,
    setLightboxUrl,
    fileInputRef,
    handleFileInputChange,
    handlePaste,
    handleSendImage,
  }
}
