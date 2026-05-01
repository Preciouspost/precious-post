'use client'

import { forwardRef, useRef, useState } from 'react'
import { FontFamily, FontSize, PhotoItem, Address } from '@/types'
import { getLayout, SlotDef } from './layouts'
import { format } from 'date-fns'
import { PreciousPostLogo } from '@/components/Logo'

interface Props {
  layout: string
  photos: PhotoItem[]
  photoAreaHeight: number
  photoAreaWidth: number
  font: FontFamily
  fontSize: FontSize
  letterText: string
  senderName?: string
  address?: Address | null
  scale?: number
  onPanPhoto?: (index: number, x: number, y: number) => void
  onResizePhotoArea?: (heightPct: number) => void
}

const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40

export const LetterPreview = forwardRef<HTMLDivElement, Props>(function LetterPreview(
  { layout, photos, photoAreaHeight, font, fontSize, letterText, senderName, scale = 1, onPanPhoto, onResizePhotoArea },
  ref
) {
  const layoutDef = getLayout(layout)
  const photoAreaPx = (photoAreaHeight / 100) * (PAGE_H - PADDING * 2)

  const isHorizontal = layoutDef?.textPosition === 'right' || layoutDef?.textPosition === 'left'
  const isFloat = !!layoutDef?.float
  const photoWidthPct = layoutDef?.photoWidth ?? 50
  const floatWidthPct = layoutDef?.floatWidth ?? 42

  const fontFamily =
    font === 'handwritten' ? "'Caveat', cursive"
    : font === 'serif' ? "'Playfair Display', Georgia, serif"
    : "'Inter', system-ui, sans-serif"

  const fontSizePx = fontSize === 'small' ? 12 : fontSize === 'large' ? 18 : 15
  const lineHeight = fontSize === 'small' ? 1.65 : fontSize === 'large' ? 1.85 : 1.75

  const today = format(new Date(), 'MMMM d, yyyy')

  const textStyle: React.CSSProperties = {
    color: '#4A4A4A',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: fontSizePx,
    lineHeight,
    fontFamily,
  }

  // Drag handle for resizing the photo block height
  function handleResizeDragStart(e: React.MouseEvent) {
    if (!onResizePhotoArea) return
    e.preventDefault()
    const resize = onResizePhotoArea
    const startY = e.clientY
    const startPct = photoAreaHeight
    const contentHeightPx = PAGE_H - PADDING * 2

    function onMouseMove(ev: MouseEvent) {
      const dy = ev.clientY - startY
      const dyPreview = dy / scale
      const newPct = Math.max(15, Math.min(75, startPct + (dyPreview / contentHeightPx) * 100))
      resize(newPct)
    }
    function onMouseUp() {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const resizeHandle = onResizePhotoArea ? (
    <div
      onMouseDown={handleResizeDragStart}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'ns-resize',
        userSelect: 'none',
      }}
    >
      <div style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' }} />
    </div>
  ) : null

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

      {isFloat && photos.length > 0 && layoutDef ? (
        /* ── Float: photo block floats, text wraps around it ── */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              float: layoutDef.float,
              width: `${floatWidthPct}%`,
              height: photoAreaPx,
              marginRight: layoutDef.float === 'left' ? 16 : 0,
              marginLeft: layoutDef.float === 'right' ? 16 : 0,
              marginBottom: 10,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <PhotoGrid slots={layoutDef.slots} photos={photos} onPan={onPanPhoto} />
            {resizeHandle}
          </div>

          {/* Text flows naturally around the floated block */}
          <div style={textStyle}>
            {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
          </div>

          {senderName && (
            <p style={{ clear: 'both', fontSize: 14, color: '#4A4A4A', marginTop: 12, fontFamily }}>
              With love,<br />{senderName}
            </p>
          )}
          {!senderName && <div style={{ clear: 'both' }} />}
        </div>

      ) : isFloat && photos.length === 0 ? (
        /* Float mode with no photos yet — just show text */
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={textStyle}>
            {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
          </div>
          {senderName && (
            <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, fontFamily }}>
              With love,<br />{senderName}
            </p>
          )}
        </div>

      ) : isHorizontal ? (
        /* ── Side-by-side: fixed photo column beside text column ── */
        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>
          {layoutDef?.textPosition === 'left' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ ...textStyle, flex: 1 }}>
                {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
              </div>
              {senderName && (
                <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>
                  With love,<br />{senderName}
                </p>
              )}
            </div>
          )}
          <div style={{ width: `${photoWidthPct}%`, flexShrink: 0, position: 'relative' }}>
            {layoutDef && <PhotoGrid slots={layoutDef.slots} photos={photos} onPan={onPanPhoto} />}
          </div>
          {layoutDef?.textPosition === 'right' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
              <div style={{ ...textStyle, flex: 1 }}>
                {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
              </div>
              {senderName && (
                <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>
                  With love,<br />{senderName}
                </p>
              )}
            </div>
          )}
        </div>

      ) : (
        /* ── Vertical stack: photos on top, text below ── */
        <>
          {photos.length > 0 && layoutDef && (
            <div style={{ width: '100%', height: photoAreaPx, flexShrink: 0, position: 'relative' }}>
              <PhotoGrid slots={layoutDef.slots} photos={photos} onPan={onPanPhoto} />
              {resizeHandle}
            </div>
          )}
          {photos.length > 0 && <div style={{ height: 12, flexShrink: 0 }} />}

          <div style={{ ...textStyle, flex: 1, overflow: 'hidden' }}>
            {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
          </div>

          {senderName && (
            <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>
              With love,<br />{senderName}
            </p>
          )}
        </>
      )}

      {/* Footer logo — always locked at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F9EDE8', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <div style={{ transform: 'scale(0.9)', transformOrigin: 'center' }}>
          <PreciousPostLogo size="sm" />
        </div>
      </div>
    </div>
  )
})

function PhotoGrid({
  slots,
  photos,
  onPan,
}: {
  slots: SlotDef[]
  photos: PhotoItem[]
  onPan?: (index: number, x: number, y: number) => void
}) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null)

  function handleMouseDown(e: React.MouseEvent, i: number) {
    if (!onPan || !photos[i]) return
    e.preventDefault()

    const pan = onPan
    const startMouseX = e.clientX
    const startMouseY = e.clientY
    const startX = photos[i].x
    const startY = photos[i].y
    const slotEl = e.currentTarget as HTMLElement
    const rect = slotEl.getBoundingClientRect()

    setActiveSlot(i)

    function onMouseMove(ev: MouseEvent) {
      const dx = ev.clientX - startMouseX
      const dy = ev.clientY - startMouseY
      const newX = Math.max(0, Math.min(100, startX - (dx / rect.width) * 100))
      const newY = Math.max(0, Math.min(100, startY - (dy / rect.height) * 100))
      pan(i, newX, newY)
    }

    function onMouseUp() {
      setActiveSlot(null)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {slots.map((slot, i) => {
        const photo = photos[i]
        const isActive = activeSlot === i
        return (
          <div
            key={i}
            onMouseDown={e => handleMouseDown(e, i)}
            style={{
              position: 'absolute',
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              width: `${slot.width}%`,
              height: `${slot.height}%`,
              backgroundColor: '#F9EDE8',
              borderRadius: 6,
              overflow: 'hidden',
              cursor: onPan && photo ? (isActive ? 'grabbing' : 'grab') : 'default',
              outline: isActive ? '3px solid #b08090' : 'none',
              outlineOffset: '-3px',
            }}
          >
            {photo ? (
              <img
                src={photo.url}
                alt=""
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: `${photo.x}% ${photo.y}%`,
                  userSelect: 'none',
                  pointerEvents: 'none',
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
