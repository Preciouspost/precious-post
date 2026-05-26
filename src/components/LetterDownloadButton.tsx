'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Letter } from '@/types'
import { LetterPreview } from '@/components/letter-editor/LetterPreview'
import { getLayout } from '@/components/letter-editor/layouts'

interface Props {
  letter: Letter
  senderName: string
}

const PDF_SCALE = 300 / 96

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load: ${url}`))
    img.src = url
  })
}

async function preCropPhotos(letter: Letter, layoutId: string): Promise<string[]> {
  const PADDING = 40
  const CONTENT_W = 816 - PADDING * 2
  const CONTENT_H = 1056 - PADDING * 2
  const layoutDef = getLayout(layoutId)
  if (!layoutDef || letter.photos.length === 0) return []

  let containerW: number, containerH: number
  if (layoutDef.textPosition) {
    containerW = ((layoutDef.photoWidth ?? 50) / 100) * CONTENT_W
    containerH = CONTENT_H - 30 - 60
  } else if (layoutDef.float) {
    containerW = ((layoutDef.floatWidth ?? 42) / 100) * CONTENT_W
    containerH = (letter.photo_area_height / 100) * CONTENT_H
  } else {
    containerW = CONTENT_W
    containerH = (letter.photo_area_height / 100) * CONTENT_H
  }

  return Promise.all(
    letter.photos.map(async (photo, i) => {
      const slot = layoutDef.slots[i]
      if (!slot) return photo.url
      const slotW = (slot.width / 100) * containerW
      const slotH = (slot.height / 100) * containerH
      try {
        const img = await loadImage(photo.url)
        const zoom = photo.zoom ?? 1
        const scale = Math.max(slotW / img.naturalWidth, slotH / img.naturalHeight)
        const scaledW = img.naturalWidth * scale
        const scaledH = img.naturalHeight * scale
        // object-position offset
        const offsetX = (scaledW - slotW) * (photo.x / 100)
        const offsetY = (scaledH - slotH) * (photo.y / 100)
        // zoom shifts the visible area — CSS scale() anchors at (x%, y%) of the slot
        const zoomOffsetX = slotW * (photo.x / 100) * (1 - 1 / zoom)
        const zoomOffsetY = slotH * (photo.y / 100) * (1 - 1 / zoom)
        const sx = (offsetX + zoomOffsetX) / scale
        const sy = (offsetY + zoomOffsetY) / scale
        const sw = slotW / zoom / scale
        const sh = slotH / zoom / scale
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(slotW * 2)
        canvas.height = Math.round(slotH * 2)
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', 0.95)
      } catch {
        return photo.url
      }
    })
  )
}

export function LetterDownloadButton({ letter, senderName }: Props) {
  const [loading, setLoading] = useState(false)
  const [showRender, setShowRender] = useState(false)
  const [croppedUrls, setCroppedUrls] = useState<string[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    setLoading(true)
    const cropped = await preCropPhotos(letter, letter.layout)
    setCroppedUrls(cropped)
    setShowRender(true)
    await new Promise(r => setTimeout(r, 800))
    const el = previewRef.current
    if (!el) { setLoading(false); return }
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')
      const canvas = await html2canvas(el, {
        scale: PDF_SCALE,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        width: 816,
        height: 1056,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.98)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: [8.5, 11] })
      pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11)
      pdf.save(`precious-post-letter.pdf`)
    } finally {
      setShowRender(false)
      setCroppedUrls([])
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="text-xs font-medium underline disabled:opacity-50"
        style={{ color: 'var(--color-mauve)' }}
      >
        {loading ? 'Generating…' : '⬇ Save PDF'}
      </button>

      {showRender && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, pointerEvents: 'none' }}>
          <LetterPreview
            ref={previewRef}
            layout={letter.layout}
            photos={letter.photos}
            photoAreaHeight={letter.photo_area_height}
            photoAreaWidth={100}
            font={letter.font}
            fontSize={letter.font_size}
            letterText={letter.letter_text}
            senderName={senderName}
            address={letter.address}
            scale={1}
            photoCroppedUrls={croppedUrls}
          />
        </div>,
        document.body
      )}
    </>
  )
}
