'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Letter } from '@/types'
import { LetterPreview } from '@/components/letter-editor/LetterPreview'
import { getLayout } from '@/components/letter-editor/layouts'

interface Props {
  letter: Letter & { profile: { name: string; email: string } }
}

// 8.5×11 at 300 DPI
const PDF_SCALE = 300 / 96  // ~3.125x

// LetterPreview constants (must match the component)
const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40
const CONTENT_W = PAGE_W - PADDING * 2   // 736
const CONTENT_H = PAGE_H - PADDING * 2   // 976

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Pre-crop each photo to exactly the pixel dimensions of its slot, using the
 * same object-fit:cover + object-position algorithm that the browser uses.
 * This lets html2canvas simply stretch each image to fill its slot (no
 * object-fit needed) and the result is always sharp.
 */
async function preCropPhotos(letter: Letter, layoutId: string): Promise<string[]> {
  const layoutDef = getLayout(layoutId)
  if (!layoutDef || letter.photos.length === 0) return []

  // Compute the photo container pixel dimensions
  let containerW: number
  let containerH: number

  if (layoutDef.textPosition) {
    // Side-by-side: photo column × full content height minus date + footer
    containerW = ((layoutDef.photoWidth ?? 50) / 100) * CONTENT_W
    containerH = CONTENT_H - 30 - 60  // ~28px date + ~60px footer
  } else if (layoutDef.float) {
    // Float block
    containerW = ((layoutDef.floatWidth ?? 42) / 100) * CONTENT_W
    containerH = (letter.photo_area_height / 100) * CONTENT_H
  } else {
    // Vertical stack (most common)
    containerW = CONTENT_W
    containerH = (letter.photo_area_height / 100) * CONTENT_H
  }

  const croppedUrls = await Promise.all(
    letter.photos.map(async (photo, i) => {
      const slot = layoutDef.slots[i]
      if (!slot) return photo.url

      const slotW = (slot.width / 100) * containerW
      const slotH = (slot.height / 100) * containerH

      try {
        const img = await loadImage(photo.url)
        const natW = img.naturalWidth
        const natH = img.naturalHeight

        // object-fit: cover — scale so the image covers the slot
        const scale = Math.max(slotW / natW, slotH / natH)
        const scaledW = natW * scale
        const scaledH = natH * scale

        // object-position: x% y% — which part of the scaled image to show
        const offsetX = (scaledW - slotW) * (photo.x / 100)
        const offsetY = (scaledH - slotH) * (photo.y / 100)

        // Convert back to source (unscaled) coordinates
        const sx = offsetX / scale
        const sy = offsetY / scale
        const sw = slotW / scale
        const sh = slotH / scale

        // Render at 2× for crispness
        const OUT = 2
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(slotW * OUT)
        canvas.height = Math.round(slotH * OUT)
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg', 0.95)
      } catch {
        return photo.url  // fall back to original on any error
      }
    })
  )

  return croppedUrls
}

export function AdminPDFDownload({ letter }: Props) {
  const [loading, setLoading] = useState(false)
  const [showRender, setShowRender] = useState(false)
  const [croppedUrls, setCroppedUrls] = useState<string[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    setLoading(true)

    // Step 1: pre-crop all photos so html2canvas gets correctly-framed images
    const cropped = await preCropPhotos(letter, letter.layout)
    setCroppedUrls(cropped)
    setShowRender(true)

    // Step 2: wait for the off-screen render to paint
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [8.5, 11],
      })
      pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11)
      pdf.save(`precious-post-${letter.id.slice(0, 8)}.pdf`)
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
        className="px-3 py-1.5 rounded-full text-xs font-medium border disabled:opacity-50"
        style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
      >
        {loading ? 'Generating PDF…' : '⬇ Download PDF'}
      </button>

      {/* Off-screen render at full resolution with pre-cropped photos */}
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
            senderName={letter.profile.name}
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
