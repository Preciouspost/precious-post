'use client'

import { forwardRef, useRef } from 'react'
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
  /** Pre-cropped photo data URLs for PDF rendering */
  photoCroppedUrls?: string[]
  /** Called when user taps an empty photo slot */
  onSlotClick?: (slotIndex: number) => void
  /** Called when user taps an occupied photo slot */
  onPhotoTap?: (slotIndex: number) => void
  /** Which slot is currently selected for editing */
  selectedSlot?: number | null
  /** When true, all other occupied slots show a "tap to swap" overlay */
  swapMode?: boolean
}

const PAGE_W = 816
const PAGE_H = 1056
const PADDING = 40

export const LetterPreview = forwardRef<HTMLDivElement, Props>(function LetterPreview(
  { layout, photos, photoAreaHeight, font, fontSize, letterText, senderName, scale = 1, onPanPhoto, onResizePhotoArea, photoCroppedUrls, onSlotClick, onPhotoTap, selectedSlot, swapMode },
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
    <div onMouseDown={handleResizeDragStart}
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'ns-resize', userSelect: 'none' }}>
      <div style={{ width: 28, height: 3, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)' }} />
    </div>
  ) : null

  const gridProps = { photos, croppedUrls: photoCroppedUrls, onPan: onPanPhoto, onSlotClick, onPhotoTap, selectedSlot, swapMode }

  return (
    <div ref={ref} data-letter-preview
      style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left', backgroundColor: 'white', padding: PADDING, fontFamily, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 8, textAlign: 'right', flexShrink: 0 }}>{today}</p>

        {isFloat && photos.length > 0 && layoutDef ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ float: layoutDef.float, width: `${floatWidthPct}%`, height: photoAreaPx, marginRight: layoutDef.float === 'left' ? 16 : 0, marginLeft: layoutDef.float === 'right' ? 16 : 0, marginBottom: 10, position: 'relative', flexShrink: 0 }}>
              <PhotoGrid slots={layoutDef.slots} {...gridProps} />
              {resizeHandle}
            </div>
            <div style={textStyle}>{letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}</div>
            {senderName && <p style={{ clear: 'both', fontSize: 14, color: '#4A4A4A', marginTop: 12, fontFamily }}>With love,<br />{senderName}</p>}
            {!senderName && <div style={{ clear: 'both' }} />}
          </div>

        ) : isFloat && photos.length === 0 ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={textStyle}>{letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}</div>
            {senderName && <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, fontFamily }}>With love,<br />{senderName}</p>}
          </div>

        ) : isHorizontal ? (
          <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0, overflow: 'hidden' }}>
            {layoutDef?.textPosition === 'left' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ ...textStyle, flex: 1 }}>{letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}</div>
                {senderName && <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>With love,<br />{senderName}</p>}
              </div>
            )}
            <div style={{ width: `${photoWidthPct}%`, flexShrink: 0, position: 'relative' }}>
              {layoutDef && <PhotoGrid slots={layoutDef.slots} {...gridProps} />}
            </div>
            {layoutDef?.textPosition === 'right' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                <div style={{ ...textStyle, flex: 1 }}>{letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}</div>
                {senderName && <p style={{ fontSize: 14, color: '#4A4A4A', marginTop: 12, flexShrink: 0, fontFamily }}>With love,<br />{senderName}</p>}
              </div>
            )}
          </div>

        ) : (
          <>
            {photos.length > 0 && layoutDef && (
              <div style={{ width: '100%', height: photoAreaPx, flexShrink: 0, position: 'relative' }}>
                <PhotoGrid slots={layoutDef.slots} {...gridProps} />
                {resizeHandle}
              </div>
            )}
            {photos.length > 0 && <div style={{ height: 12, flexShrink: 0 }} />}
            <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
              <div style={{ ...textStyle, position: 'absolute', top: 0, left: 0, right: 0, bottom: senderName ? 48 : 0, overflow: 'hidden' }}>
                {letterText || <span style={{ color: '#ccc' }}>Your letter will appear here…</span>}
              </div>
              {senderName && (
                <p style={{ position: 'absolute', bottom: 0, left: 0, right: 0, margin: 0, paddingTop: 6, lineHeight: 1.2, fontSize: 14, color: '#4A4A4A', fontFamily, backgroundColor: 'white' }}>
                  With love,<br />{senderName}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div style={{ paddingTop: 1, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        {photoCroppedUrls !== undefined
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src="/logo.png" alt="Precious Post" width={100} height={100} style={{ objectFit: 'contain' }} crossOrigin="anonymous" />
          : <PreciousPostLogo size="sm" />
        }
      </div>
    </div>
  )
})

// ─── PhotoGrid ────────────────────────────────────────────────────────────────

function PhotoGrid({
  slots, photos, croppedUrls, onPan, onSlotClick, onPhotoTap, selectedSlot, swapMode,
}: {
  slots: SlotDef[]
  photos: PhotoItem[]
  croppedUrls?: string[]
  onPan?: (index: number, x: number, y: number) => void
  onSlotClick?: (slotIndex: number) => void
  onPhotoTap?: (slotIndex: number) => void
  selectedSlot?: number | null
  swapMode?: boolean
}) {
  const panRef = useRef<{
    startMouseX: number; startMouseY: number
    startPhotoX: number; startPhotoY: number
    rect: DOMRect; index: number
  } | null>(null)

  const touchRef = useRef<{
    startX: number; startY: number
    startPhotoX: number; startPhotoY: number
    rect: DOMRect; index: number; moved: boolean
  } | null>(null)

  // Track last touch/mouse so click doesn't fire after a pan
  const touchWasPanRef = useRef(false)
  // Track when mouseUp already fired a tap so onClick is suppressed
  const mouseUpHandledTapRef = useRef(false)

  function handleMouseDown(e: React.MouseEvent, i: number) {
    if (!photos[i]) return
    if (e.button !== 0) return
    e.preventDefault()
    const photo = photos[i]
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let moved = false
    panRef.current = {
      startMouseX: e.clientX, startMouseY: e.clientY,
      startPhotoX: photo.x, startPhotoY: photo.y,
      rect, index: i,
    }
    function onMouseMove(ev: MouseEvent) {
      if (!panRef.current || panRef.current.index !== i) return
      const dx = ev.clientX - panRef.current.startMouseX
      const dy = ev.clientY - panRef.current.startMouseY
      if (!moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      moved = true
      if (!onPan) return
      const zoom = photos[i].zoom ?? 1
      const newX = Math.max(0, Math.min(100, panRef.current.startPhotoX - (dx / rect.width / zoom) * 100))
      const newY = Math.max(0, Math.min(100, panRef.current.startPhotoY - (dy / rect.height / zoom) * 100))
      onPan(i, newX, newY)
    }
    function onMouseUp() {
      panRef.current = null
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (!moved && onPhotoTap) {
        mouseUpHandledTapRef.current = true
        onPhotoTap(i)
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function handleTouchStart(e: React.TouchEvent, i: number) {
    if (!photos[i]) return
    const touch = e.touches[0]
    const photo = photos[i]
    touchWasPanRef.current = false
    touchRef.current = {
      startX: touch.clientX, startY: touch.clientY,
      startPhotoX: photo.x, startPhotoY: photo.y,
      rect: (e.currentTarget as HTMLElement).getBoundingClientRect(),
      index: i, moved: false,
    }
  }

  function handleTouchMove(e: React.TouchEvent, i: number) {
    if (!touchRef.current || touchRef.current.index !== i || !onPan) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchRef.current.startX
    const dy = touch.clientY - touchRef.current.startY
    if (!touchRef.current.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return
    touchRef.current.moved = true
    touchWasPanRef.current = true
    e.preventDefault()
    const zoom = photos[i].zoom ?? 1
    const newX = Math.max(0, Math.min(100, touchRef.current.startPhotoX - (dx / touchRef.current.rect.width / zoom) * 100))
    const newY = Math.max(0, Math.min(100, touchRef.current.startPhotoY - (dy / touchRef.current.rect.height / zoom) * 100))
    onPan(i, newX, newY)
  }

  function handleTouchEnd(i: number) {
    const wasTap = touchRef.current ? !touchRef.current.moved : false
    touchRef.current = null
    if (wasTap) {
      if (onPhotoTap && photos[i]) onPhotoTap(i)
      else if (onSlotClick && !photos[i]) onSlotClick(i)
    }
  }

  function handleClick(e: React.MouseEvent, i: number) {
    if (touchWasPanRef.current) { touchWasPanRef.current = false; return }
    if (mouseUpHandledTapRef.current) { mouseUpHandledTapRef.current = false; return }
    const photo = photos[i]
    if (photo && onPhotoTap) { onPhotoTap(i); return }
    if (!photo && onSlotClick) { onSlotClick(i) }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {slots.map((slot, i) => {
        const photo = photos[i]
        const isSelected = selectedSlot === i
        const isSwappable = !!swapMode && !!photo && selectedSlot !== i
        const isEmpty = !photo
        const isClickable = isEmpty && !!onSlotClick

        return (
          <div key={i}
            onMouseDown={photo ? e => handleMouseDown(e, i) : undefined}
            onTouchStart={e => handleTouchStart(e, i)}
            onTouchMove={e => handleTouchMove(e, i)}
            onTouchEnd={() => handleTouchEnd(i)}
            onClick={e => handleClick(e, i)}
            style={{
              position: 'absolute',
              left: `${slot.left}%`, top: `${slot.top}%`,
              width: `${slot.width}%`, height: `${slot.height}%`,
              backgroundColor: '#F9EDE8',
              borderRadius: 6,
              overflow: 'hidden',
              cursor: isSwappable ? 'pointer' : isClickable ? 'pointer' : photo && onPhotoTap ? 'pointer' : photo && onPan ? 'grab' : 'default',
              outline: isSelected ? '3px solid white' : 'none',
              outlineOffset: '-3px',
              boxShadow: isSelected ? 'inset 0 0 0 1px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {photo ? (
              croppedUrls?.[i] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={croppedUrls[i]} alt="" draggable={false}
                  style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="" draggable={false} crossOrigin="anonymous"
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    objectPosition: `${photo.x}% ${photo.y}%`,
                    transform: photo.zoom && photo.zoom !== 1 ? `scale(${photo.zoom})` : undefined,
                    transformOrigin: `${photo.x}% ${photo.y}%`,
                    userSelect: 'none', pointerEvents: 'none', display: 'block',
                  }} />
              )
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, opacity: isClickable ? 1 : 0.3 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: isClickable ? 'var(--color-mauve)' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 300, lineHeight: 1 }}>+</div>
                {isClickable && <span style={{ fontSize: 9, color: '#A07872', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Add photo</span>}
              </div>
            )}

            {/* Selection handles */}
            {isSelected && (
              <>
                <div style={{ position: 'absolute', top: 4, left: 4, width: 8, height: 8, borderRadius: 2, backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                <div style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 2, backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                <div style={{ position: 'absolute', bottom: 4, left: 4, width: 8, height: 8, borderRadius: 2, backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                <div style={{ position: 'absolute', bottom: 4, right: 4, width: 8, height: 8, borderRadius: 2, backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                {/* Move cursor icon */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2l-3 4h6l-3-4zm0 20l3-4H9l3 4zm-8-10l4 3V9L4 12zm20 0l-4-3v6l4-3zm-12 0a2 2 0 114 0 2 2 0 01-4 0z"/></svg>
                  </div>
                </div>
              </>
            )}

            {/* Swap overlay */}
            {isSwappable && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(176,128,144,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>Tap to swap</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
