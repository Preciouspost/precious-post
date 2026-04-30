'use client'

import { forwardRef } from 'react'
import { LayoutId, FontFamily, FontSize, PhotoItem, Address } from '@/types'
import { getLayout } from './layouts'
import { format } from 'date-fns'
import { PreciousPostLogo } from '@/components/Logo'

interface Props {
  layout: LayoutId
  photos: PhotoItem[]
  photoAreaHeight: number  // percent of page
  photoAreaWidth: number   // percent of page width (always 100 for now)
  font: FontFamily
  fontSize: FontSize
  letterText: string
  recipientName?: string
  senderName?: string
  address?: Address | null
  scale?: number
}

// 8.5x11 at 96dpi = 816x1056px
const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40

export const LetterPreview = forwardRef<HTMLDivElement, Props>(function LetterPreview(
  { layout, photos, photoAreaHeight, font, fontSize, letterText, senderName, scale = 1 },
  ref
) {
  const layoutDef = getLayout(layout)
  const photoAreaPx = (photoAreaHeight / 100) * (PAGE_H - PADDING * 2)
  const photoSlots = getPhotoSlots(layoutDef, photoAreaPx)

  const fontClass = `font-letter-${font}`
  const fontSizeClass = `font-size-${fontSize}`

  const today = format(new Date(), 'MMMM d, yyyy')

  return (
    <div
      ref={ref}
      data-letter-preview
      style={{
        width: PAGE_W,
        height: PAGE_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        backgroundColor: 'white',
        padding: PADDING,
        fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', Georgia, serif" : "'Inter', system-ui, sans-serif",
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Date */}
      <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8, textAlign: 'right' }}>{today}</p>

      {/* Photo area */}
      {photos.length > 0 && (
        <div
          style={{
            width: '100%',
            height: photoAreaPx,
            flexShrink: 0,
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 6,
            marginBottom: 16,
            position: 'relative',
          }}
        >
          <PhotoGrid slots={photoSlots} photos={photos} totalHeight={photoAreaPx} />
        </div>
      )}

      {/* Letter text */}
      <div
        className={`${fontClass} ${fontSizeClass}`}
        style={{
          flex: 1,
          overflow: 'hidden',
          color: '#4A4A4A',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
      </div>

      {/* Signature */}
      {senderName && (
        <p className={fontClass} style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12 }}>
          With love,<br />{senderName}
        </p>
      )}

      {/* Footer: logo locked */}
      <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #F9EDE8', display: 'flex', justifyContent: 'center' }}>
        <div style={{ transform: 'scale(0.7)', transformOrigin: 'center' }}>
          <PreciousPostLogo size="sm" />
        </div>
      </div>
    </div>
  )
})

interface SlotDef {
  col: number; row: number; colSpan: number; rowSpan: number
}

function getPhotoSlots(layoutDef: ReturnType<typeof getLayout>, totalHeight: number): SlotDef[] {
  const rows = layoutDef.areas
  const numRows = rows.length
  const rowHeight = totalHeight / numRows

  // Parse areas into unique letter positions
  const seen = new Map<string, SlotDef>()
  rows.forEach((row, rowIdx) => {
    row.forEach((letter, colIdx) => {
      if (!seen.has(letter)) {
        seen.set(letter, { col: colIdx, row: rowIdx, colSpan: 1, rowSpan: 1 })
      } else {
        const s = seen.get(letter)!
        s.colSpan = Math.max(s.colSpan, colIdx - s.col + 1)
        s.rowSpan = Math.max(s.rowSpan, rowIdx - s.row + 1)
      }
    })
  })

  return Array.from(seen.values())
}

function PhotoGrid({ slots, photos, totalHeight }: { slots: SlotDef[]; photos: PhotoItem[]; totalHeight: number }) {
  const maxCols = 12
  const numRows = Math.max(...slots.map(s => s.row + s.rowSpan))
  const rowHeight = totalHeight / numRows
  const colWidth = (816 - 80) / maxCols  // page width minus padding

  return (
    <div style={{ position: 'relative', width: '100%', height: totalHeight }}>
      {slots.map((slot, i) => {
        const photo = photos[i]
        const left = slot.col * colWidth
        const top = slot.row * rowHeight
        const width = slot.colSpan * colWidth - 4
        const height = slot.rowSpan * rowHeight - 4

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              backgroundColor: '#F9EDE8',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {photo ? (
              <img
                src={photo.url}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${photo.x}% ${photo.y}%`,
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20, opacity: 0.3 }}>📷</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
