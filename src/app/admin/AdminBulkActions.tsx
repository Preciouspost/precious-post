'use client'

import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Letter } from '@/types'
import { LetterPreview } from '@/components/letter-editor/LetterPreview'
import { getLayout } from '@/components/letter-editor/layouts'

type LetterWithProfile = Letter & { profile: { name: string; email: string; phone: string } }

interface Props {
  letters: LetterWithProfile[]
  filterStatus: string
}

// ── PDF generation constants (must match LetterPreview) ──────────────────────
const PDF_SCALE = 300 / 96
const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40
const CONTENT_W = PAGE_W - PADDING * 2
const CONTENT_H = PAGE_H - PADDING * 2

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
  const layoutDef = getLayout(layoutId)
  if (!layoutDef || letter.photos.length === 0) return []

  let containerW: number
  let containerH: number
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

  return Promise.all(letter.photos.map(async (photo, i) => {
    const slot = layoutDef.slots[i]
    if (!slot) return photo.url
    const slotW = (slot.width / 100) * containerW
    const slotH = (slot.height / 100) * containerH
    try {
      const img = await loadImage(photo.url)
      const scale = Math.max(slotW / img.naturalWidth, slotH / img.naturalHeight)
      const scaledW = img.naturalWidth * scale
      const scaledH = img.naturalHeight * scale
      const offsetX = (scaledW - slotW) * (photo.x / 100)
      const offsetY = (scaledH - slotH) * (photo.y / 100)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(slotW * 2)
      canvas.height = Math.round(slotH * 2)
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, offsetX / scale, offsetY / scale, slotW / scale, slotH / scale, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/jpeg', 0.95)
    } catch {
      return photo.url
    }
  }))
}

// ── CSV helper ───────────────────────────────────────────────────────────────
function escapeCSV(val: string | null | undefined) {
  return `"${(val ?? '').replace(/"/g, '""')}"`
}

export function AdminBulkActions({ letters, filterStatus }: Props) {
  const [bulkLoading, setBulkLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [currentLetter, setCurrentLetter] = useState<LetterWithProfile | null>(null)
  const [croppedUrls, setCroppedUrls] = useState<string[]>([])
  const previewRef = useRef<HTMLDivElement>(null)

  // ── Date range filter ──────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredLetters = letters.filter(l => {
    if (!l.submitted_at) return true
    const submitted = new Date(l.submitted_at)
    if (startDate && submitted < new Date(startDate)) return false
    if (endDate && submitted > new Date(endDate + 'T23:59:59')) return false
    return true
  })

  // ── Download addresses as CSV ──────────────────────────────────────────────
  function downloadAddressCSV() {
    const header = ['Recipient Name', 'Address Line 1', 'Address Line 2', 'City', 'State', 'Zip', 'Sender Name', 'Sender Email']
    const rows = filteredLetters
      .filter(l => l.address)
      .map(l => [
        l.address!.name,
        l.address!.address_line1,
        l.address!.address_line2 ?? '',
        l.address!.city,
        l.address!.state,
        l.address!.zip,
        l.profile?.name ?? '',
        l.profile?.email ?? '',
      ])

    const csv = [header, ...rows].map(r => r.map(escapeCSV).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precious-post-addresses-${filterStatus}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Bulk PDF → ZIP ─────────────────────────────────────────────────────────
  async function downloadAllPDFs() {
    if (filteredLetters.length === 0) return
    setBulkLoading(true)
    setProgress({ current: 0, total: filteredLetters.length })

    const [{ default: JSZip }, { default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('jszip'),
      import('html2canvas'),
      import('jspdf'),
    ])

    const zip = new JSZip()

    for (let i = 0; i < filteredLetters.length; i++) {
      const letter = filteredLetters[i]
      setProgress({ current: i + 1, total: letters.length })

      // Pre-crop photos
      const cropped = await preCropPhotos(letter, letter.layout)
      setCroppedUrls(cropped)
      setCurrentLetter(letter)

      // Wait for off-screen render to paint
      await new Promise(r => setTimeout(r, 800))

      const el = previewRef.current
      if (!el) continue

      try {
        const canvas = await html2canvas(el, {
          scale: PDF_SCALE,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: PAGE_W,
          height: PAGE_H,
          logging: false,
        })

        const imgData = canvas.toDataURL('image/jpeg', 0.98)
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: [8.5, 11] })
        pdf.addImage(imgData, 'JPEG', 0, 0, 8.5, 11)

        const recipientSlug = (letter.address?.name ?? `letter-${i + 1}`)
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        zip.file(`${recipientSlug}.pdf`, pdf.output('blob'))
      } catch (err) {
        console.error(`Failed to generate PDF for letter ${letter.id}:`, err)
      }
    }

    // Clean up render state
    setCurrentLetter(null)
    setCroppedUrls([])
    setBulkLoading(false)

    // Download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `precious-post-${filterStatus}-${new Date().toISOString().slice(0, 10)}.zip`
    a.click()
    URL.revokeObjectURL(url)
    setProgress({ current: 0, total: 0 })
  }

  if (letters.length === 0) return null

  const dateLabel = startDate || endDate
    ? `${startDate || '…'} → ${endDate || '…'} (${filteredLetters.length} letter${filteredLetters.length !== 1 ? 's' : ''})`
    : `All ${letters.length} letter${letters.length !== 1 ? 's' : ''}`

  return (
    <>
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Filter by date submitted:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => { setStartDate(''); setEndDate('') }}
            className="text-xs underline"
            style={{ color: 'var(--color-charcoal-light)' }}
          >
            Clear
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--color-charcoal-light)' }}>{dateLabel}</span>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {/* Addresses CSV */}
        <button
          onClick={downloadAddressCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors"
          style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)', backgroundColor: 'white' }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" />
          </svg>
          Download Addresses (CSV)
        </button>

        {/* Bulk PDF ZIP */}
        <button
          onClick={downloadAllPDFs}
          disabled={bulkLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          {bulkLoading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generating {progress.current}/{progress.total} PDFs…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download All PDFs (ZIP)
            </>
          )}
        </button>
      </div>

      {/* Off-screen render for bulk PDF generation */}
      {currentLetter && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', top: -9999, left: -9999, zIndex: -1, pointerEvents: 'none' }}>
          <LetterPreview
            ref={previewRef}
            layout={currentLetter.layout}
            photos={currentLetter.photos}
            photoAreaHeight={currentLetter.photo_area_height}
            photoAreaWidth={100}
            font={currentLetter.font}
            fontSize={currentLetter.font_size}
            letterText={currentLetter.letter_text}
            senderName={currentLetter.profile?.name}
            address={currentLetter.address}
            scale={1}
            photoCroppedUrls={croppedUrls}
          />
        </div>,
        document.body
      )}
    </>
  )
}
