'use client'

import { forwardRef } from 'react'
import { FontFamily, FontSize, PhotoItem, Address } from '@/types'
import { getLayout, SlotDef } from './layouts'
import { format } from 'date-fns'
import { PreciousPostLogo } from '@/components/Logo'

interface Props {
  layout: string
  photos: PhotoItem[]
  photoAreaHeight: number  // percent of page height
  photoAreaWidth: number
  font: FontFamily
  fontSize: FontSize
  letterText: string
  senderName?: string
  address?: Address | null
  scale?: number
}

const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40

export const LetterPreview = forwardRef<HTMLDivElement, Props>(function LetterPreview(
  { layout, photos, photoAreaHeight, font, fontSize, letterText, senderName, scale = 1 },
  ref
) {
  const layoutDef = getLayout(layout)
  const photoAreaPx = (photoAreaHeight / 100) * (PAGE_H - PADDING * 2)

  const fontFamily =
    font === 'handwritten' ? "'Caveat', cursive"
    : font === 'serif' ? "'Playfair Display', Georgia, serif"
    : "'Inter', system-ui, sans-serif"

  const fontSizePx =
    fontSize === 'small' ? 12
    : fontSize === 'large' ? 18
    : 15

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
        fontFamily,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Date */}
      <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8, textAlign: 'right', flexShrink: 0 }}>
        {today}
      </p>

      {/* Photo area */}
      {photos.length > 0 && layoutDef && (
        <div style={{ width: '100%', height: photoAreaPx, flexShrink: 0, marginBottom: 16, position: 'relative' }}>
          <PhotoGrid slots={layoutDef.slots} photos={photos} />
        </div>
      )}

      {/* Letter text */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          color: '#4A4A4A',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: fontSizePx,
          lineHeight: fontSize === 'small' ? 1.65 : fontSize === 'large' ? 1.85 : 1.75,
          fontFamily,
        }}
      >
        {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
      </div>

      {/* Signature */}
      {senderName && (
        <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>
          With love,<br />{senderName}
        </p>
      )}

      {/* Footer logo — always locked at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F9EDE8', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
          <PreciousPostLogo size="sm" />
        </div>
      </div>
    </div>
  )
})

function PhotoGrid({ slots, photos }: { slots: SlotDef[]; photos: PhotoItem[] }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {slots.map((slot, i) => {
        const photo = photos[i]
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
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
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, opacity: 0.25 }}>📷</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
