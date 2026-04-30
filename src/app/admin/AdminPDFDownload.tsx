'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Letter } from '@/types'
import { LetterPreview } from '@/components/letter-editor/LetterPreview'

interface Props {
  letter: Letter & { profile: { name: string; email: string } }
}

// 8.5x11 at 300 DPI = 2550x3300px
const PDF_SCALE = 300 / 96  // ~3.125x

export function AdminPDFDownload({ letter }: Props) {
  const [loading, setLoading] = useState(false)
  const [showRender, setShowRender] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    setLoading(true)
    setShowRender(true)

    // Wait for render
    await new Promise(r => setTimeout(r, 600))

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

      {/* Off-screen render at full resolution */}
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
          />
        </div>,
        document.body
      )}
    </>
  )
}
