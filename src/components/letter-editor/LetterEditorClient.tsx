'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Address, FontFamily, FontSize, LayoutId, PhotoItem, Profile } from '@/types'
import { LetterPreview } from './LetterPreview'
import { getLayoutsForCount, getDefaultLayout, getLayout } from './layouts'
import { PreciousPostLogo } from '@/components/Logo'
import Link from 'next/link'
import { getCurrentMonthYear } from '@/lib/utils'

interface Props {
  profile: Profile
  addresses: Address[]
  monthYear: string
  usedCount: number
  maxLetters: number
}

const MAX_PHOTOS = 8
const MAX_CHARS = 2500
const PREVIEW_SCALE = 0.48
const draftKey = (userId: string) => `precious-post-draft-${userId}`

type MobileTab = 'photos' | 'layout' | 'font' | 'letter' | 'to'

// ─── SVG tab icons ────────────────────────────────────────────────────────────

function IconCamera({ active }: { active: boolean }) {
  const c = active ? 'var(--color-mauve)' : '#9ca3af'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
}
function IconGrid({ active }: { active: boolean }) {
  const c = active ? 'var(--color-mauve)' : '#9ca3af'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
}
function IconFont({ active }: { active: boolean }) {
  const c = active ? 'var(--color-mauve)' : '#9ca3af'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
}
function IconPencil({ active }: { active: boolean }) {
  const c = active ? 'var(--color-mauve)' : '#9ca3af'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
}
function IconPerson({ active }: { active: boolean }) {
  const c = active ? 'var(--color-mauve)' : '#9ca3af'
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconRefresh() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LetterEditorClient({ profile, addresses, monthYear, usedCount, maxLetters }: Props) {
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null)

  const savedDraft = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem(draftKey(profile.user_id)) ?? 'null') } catch { return null } })()
    : null

  const [photos, setPhotos] = useState<PhotoItem[]>(savedDraft?.photos ?? [])
  const [layout, setLayout] = useState<LayoutId>(savedDraft?.layout ?? 'hero-2-below')
  const [photoAreaHeight, setPhotoAreaHeight] = useState(savedDraft?.photoAreaHeight ?? 45)
  const [font, setFont] = useState<FontFamily>(savedDraft?.font ?? 'serif')
  const [fontSize, setFontSize] = useState<FontSize>(savedDraft?.fontSize ?? 'medium')
  const [letterText, setLetterText] = useState(savedDraft?.letterText ?? '')
  const [addressId, setAddressId] = useState<string>(savedDraft?.addressId ?? addresses[0]?.id ?? '')
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showSendAnother, setShowSendAnother] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(usedCount)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const [recipientError, setRecipientError] = useState(false)

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [mobileScale, setMobileScale] = useState(0.45)
  const [mobileTab, setMobileTab] = useState<MobileTab>('to')

  // Tray photo selected for reorder (mobile)
  const [selectedTrayIdx, setSelectedTrayIdx] = useState<number | null>(null)

  // Photo crop/pan editor (mobile)
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null)
  const photoPanRef = useRef<{ startX: number; startY: number; startPhotoX: number; startPhotoY: number } | null>(null)

  useEffect(() => {
    function update() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setMobileScale((window.innerWidth - 16) / 816)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Pending slot for photo assignment
  const [pendingSlot, setPendingSlot] = useState<number | null>(null)
  const pendingSlotRef = useRef<number | null>(null)
  function updatePendingSlot(slot: number | null) {
    setPendingSlot(slot)
    pendingSlotRef.current = slot
  }

  useEffect(() => {
    try {
      localStorage.setItem(draftKey(profile.user_id), JSON.stringify({ photos, layout, photoAreaHeight, font, fontSize, letterText, addressId }))
    } catch {}
  }, [photos, layout, photoAreaHeight, font, fontSize, letterText, addressId])

  const selectedAddress = addresses.find(a => a.id === addressId)
  const currentLayoutDef = getLayout(layout)
  const isSideBySide = currentLayoutDef?.textPosition === 'right' || currentLayoutDef?.textPosition === 'left'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = MAX_PHOTOS - photos.length
    const files = acceptedFiles.slice(0, remaining)
    if (!files.length) return
    const targetSlot = pendingSlotRef.current
    setUploadingPhotos(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newPhotos: PhotoItem[] = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('letter-photos').upload(path, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('letter-photos').getPublicUrl(path)
        newPhotos.push({ id: path, url: publicUrl, x: 50, y: 50, width: 100, height: 100 })
      }
    }
    setPhotos(prev => {
      let next = [...prev, ...newPhotos]
      if (targetSlot !== null && newPhotos.length === 1) {
        const inserted = next.pop()!
        next.splice(Math.min(targetSlot, next.length), 0, inserted)
      }
      const def = getDefaultLayout(next.length)
      if (def) { setLayout(def.id); if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight) }
      return next
    })
    updatePendingSlot(null)
    setUploadingPhotos(false)
  }, [photos.length])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: MAX_PHOTOS,
    disabled: photos.length >= MAX_PHOTOS || uploadingPhotos, noClick: true,
  })

  function removePhoto(id: string) {
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== id)
      const def = getDefaultLayout(next.length)
      if (def) { setLayout(def.id); if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight) }
      return next
    })
    setSelectedTrayIdx(null)
  }

  function panPhoto(index: number, x: number, y: number) {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, x, y } : p))
  }

  function handleDragStart(index: number) { dragIndexRef.current = index }
  function handleDragEnter(index: number) { setDragOverIndex(index) }
  function handleDragEnd() {
    const from = dragIndexRef.current; const to = dragOverIndex
    if (from !== null && to !== null && from !== to) {
      setPhotos(prev => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next })
    }
    dragIndexRef.current = null; setDragOverIndex(null)
  }

  function moveTrayPhoto(from: number, to: number) {
    setPhotos(prev => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next })
    setSelectedTrayIdx(to)
  }

  function handleSlotClick(slotIndex: number) {
    updatePendingSlot(slotIndex)
    if (isMobile) setMobileTab('photos')
    open()
  }

  function handlePhotoTap(slotIndex: number) {
    setEditingPhotoIndex(slotIndex)
  }

  function assignTrayPhotoToSlot(trayIndex: number) {
    if (pendingSlot === null) return
    setPhotos(prev => { const next = [...prev]; const [p] = next.splice(trayIndex, 1); next.splice(Math.min(pendingSlot, next.length), 0, p); return next })
    updatePendingSlot(null)
  }

  function autofill() {
    setPhotos(prev => [...prev].sort((a, b) => {
      const tsA = parseInt(a.id.split('/')[1]?.split('-')[0] ?? '0', 10)
      const tsB = parseInt(b.id.split('/')[1]?.split('-')[0] ?? '0', 10)
      return tsA - tsB
    }))
  }

  // Touch pan handlers for the photo edit modal
  function handlePhotoPanTouchStart(e: React.TouchEvent) {
    if (editingPhotoIndex === null) return
    const touch = e.touches[0]
    const photo = photos[editingPhotoIndex]
    photoPanRef.current = { startX: touch.clientX, startY: touch.clientY, startPhotoX: photo.x, startPhotoY: photo.y }
  }
  function handlePhotoPanTouchMove(e: React.TouchEvent) {
    if (!photoPanRef.current || editingPhotoIndex === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const dx = touch.clientX - photoPanRef.current.startX
    const dy = touch.clientY - photoPanRef.current.startY
    const newX = Math.max(0, Math.min(100, photoPanRef.current.startPhotoX - (dx / 1.8)))
    const newY = Math.max(0, Math.min(100, photoPanRef.current.startPhotoY - (dy / 1.8)))
    panPhoto(editingPhotoIndex, newX, newY)
  }
  function handlePhotoPanTouchEnd() { photoPanRef.current = null }

  function validateAndReview() {
    if (!addressId) {
      setRecipientError(true)
      if (isMobile) setMobileTab('to')
      return
    }
    if (!letterText.trim()) {
      if (isMobile) setMobileTab('letter')
      else alert('Please write your letter.')
      return
    }
    setShowReview(true)
  }

  async function handleSubmit() {
    if (!addressId) { setRecipientError(true); return }
    if (!letterText.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: letter, error } = await supabase.from('letters').insert({
      user_id: user.id, address_id: addressId, photos, layout,
      photo_area_height: photoAreaHeight, font, font_size: fontSize,
      letter_text: letterText, status: 'submitted',
      month_year: getCurrentMonthYear(), submitted_at: new Date().toISOString(),
    }).select().single()
    if (error) { alert('Error submitting: ' + error.message); setSubmitting(false); return }
    await supabase.rpc('increment_usage', { p_user_id: user.id, p_month_year: monthYear })
    await fetch('/api/sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'submitted', letterId: letter.id }) })
    try { localStorage.removeItem(draftKey(profile.user_id)) } catch {}
    const newCount = submittedCount + 1
    setSubmittedCount(newCount); setSubmitting(false)
    if (profile.plan === 'triple' && newCount < maxLetters) setShowSendAnother(true)
    else if (profile.plan === 'single') setShowUpgrade(true)
    else router.push('/dashboard?submitted=1')
  }

  function clearEditor() {
    if (!confirm('Clear everything and start fresh?')) return
    try { localStorage.removeItem(draftKey(profile.user_id)) } catch {}
    setPhotos([]); setLetterText(''); setAddressId(''); setLayout('hero-2-below')
    setPhotoAreaHeight(45); setFont('serif'); setFontSize('medium')
  }

  // ─── Shared panel content ───────────────────────────────────────────────────

  const photoTrayPanel = (
    <div style={{ position: 'relative' }}>
      {pendingSlot !== null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', backgroundColor: 'var(--color-blush)', borderBottom: '1px solid var(--color-blush-dark)' }}>
          <p style={{ fontSize: 11, color: 'var(--color-mauve)', fontWeight: 600 }}>Placing photo in slot {pendingSlot + 1} — tap a photo to move it there</p>
          <button onClick={() => updatePendingSlot(null)} style={{ fontSize: 11, color: 'var(--color-charcoal-light)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', overflowX: 'auto' }}>
        {/* Add button */}
        <button onClick={() => open()} disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
          style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', opacity: photos.length >= MAX_PHOTOS ? 0.4 : 1 }}>
          {uploadingPhotos ? <span style={{ fontSize: 10, color: 'var(--color-charcoal-light)' }}>…</span>
            : <><span style={{ fontSize: 24, color: 'var(--color-mauve)', lineHeight: 1, fontWeight: 300 }}>+</span><span style={{ fontSize: 9, color: 'var(--color-charcoal-light)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{photos.length === 0 ? 'Add photos' : 'Add more'}</span></>}
        </button>

        {photos.length > 0 && <div style={{ width: 1, height: 52, backgroundColor: 'var(--color-blush-dark)', flexShrink: 0 }} />}

        {photos.map((photo, i) => {
          const isTarget = pendingSlot !== null && i !== pendingSlot
          const isSelected = selectedTrayIdx === i && pendingSlot === null
          return (
            <div key={photo.id} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {/* Reorder arrows — only on mobile when selected */}
              {isSelected && isMobile && (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => i > 0 && moveTrayPhoto(i, i - 1)} disabled={i === 0}
                    style={{ width: 28, height: 20, borderRadius: 4, border: '1px solid var(--color-blush-dark)', backgroundColor: i === 0 ? 'transparent' : 'var(--color-blush)', fontSize: 11, color: 'var(--color-mauve)', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}>◀</button>
                  <button onClick={() => i < photos.length - 1 && moveTrayPhoto(i, i + 1)} disabled={i === photos.length - 1}
                    style={{ width: 28, height: 20, borderRadius: 4, border: '1px solid var(--color-blush-dark)', backgroundColor: i === photos.length - 1 ? 'transparent' : 'var(--color-blush)', fontSize: 11, color: 'var(--color-mauve)', cursor: i === photos.length - 1 ? 'default' : 'pointer', opacity: i === photos.length - 1 ? 0.3 : 1 }}>▶</button>
                </div>
              )}

              <div
                draggable
                onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)}
                onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                onClick={() => {
                  if (isTarget) { assignTrayPhotoToSlot(i); return }
                  setSelectedTrayIdx(selectedTrayIdx === i ? null : i)
                }}
                data-tray-index={i}
                style={{ flexShrink: 0, position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: dragOverIndex === i ? '2.5px solid var(--color-mauve)' : isSelected ? '2.5px solid var(--color-mauve)' : isTarget ? '2.5px solid #b08090' : '2px solid var(--color-blush-dark)', opacity: dragIndexRef.current === i ? 0.4 : 1, cursor: isTarget ? 'pointer' : 'grab' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photo.x}% ${photo.y}%`, userSelect: 'none', display: 'block' }} />
                <div style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-mauve)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', padding: '0 3px' }}>{i + 1}</div>
                <button onClick={e => { e.stopPropagation(); removePhoto(photo.id) }} style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                {isTarget && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(176,128,144,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18, color: 'white' }}>↩</span></div>}
              </div>
            </div>
          )
        })}

        {photos.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', paddingLeft: 4 }}>Add photos, or tap an empty slot in the preview above</p>}
        {photos.length >= 2 && <><div style={{ flex: 1, minWidth: 8 }} /><button onClick={autofill} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', fontSize: 11, fontWeight: 600, color: 'var(--color-mauve)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Autofill</button></>}
      </div>
      {isMobile && photos.length > 0 && selectedTrayIdx === null && (
        <p style={{ fontSize: 10, color: 'var(--color-charcoal-light)', textAlign: 'center', paddingBottom: 6 }}>Tap a photo to select · tap again to reorder</p>
      )}
    </div>
  )

  const layoutPanel = (
    <div style={{ padding: '10px 12px' }}>
      {photos.length === 0
        ? <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)' }}>Add photos first to see layout options.</p>
        : getLayoutsForCount(photos.length).length <= 1
          ? <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)' }}>One layout available for {photos.length} photo{photos.length !== 1 ? 's' : ''}.</p>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {getLayoutsForCount(photos.length).map(l => (
                <button key={l.id} onClick={() => { setLayout(l.id); if (l.recommendedHeight) setPhotoAreaHeight(l.recommendedHeight) }}
                  style={{ padding: '8px 4px', borderRadius: 10, border: `1px solid ${layout === l.id ? 'var(--color-mauve)' : '#e5e7eb'}`, backgroundColor: layout === l.id ? 'var(--color-blush)' : 'white', color: layout === l.id ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontSize: 11, cursor: 'pointer' }}>
                  {l.name}
                </button>
              ))}
            </div>
      }
    </div>
  )

  const fontPanel = (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Style</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['handwritten', 'serif', 'sans'] as FontFamily[]).map(f => (
            <button key={f} onClick={() => setFont(f)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${font === f ? 'var(--color-mauve)' : '#e5e7eb'}`, backgroundColor: font === f ? 'var(--color-blush)' : 'white', color: font === f ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontSize: 12, cursor: 'pointer', fontFamily: f === 'handwritten' ? "'Caveat', cursive" : f === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}>
              {f === 'handwritten' ? 'Handwritten' : f === 'serif' ? 'Serif' : 'Sans'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Size</p>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['small', 'medium', 'large'] as FontSize[]).map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${fontSize === s ? 'var(--color-mauve)' : '#e5e7eb'}`, backgroundColor: fontSize === s ? 'var(--color-blush)' : 'white', color: fontSize === s ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const letterPanel = (
    <div style={{ padding: '8px 12px' }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{letterText.length}/{MAX_CHARS}</p>
      <textarea value={letterText} onChange={e => setLetterText(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Write your letter here…" rows={4}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 16, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}
      />
    </div>
  )

  const recipientPanel = (
    <div style={{ padding: '10px 12px' }}>
      {recipientError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>Please select a recipient before submitting.</p>}
      {addresses.length === 0
        ? <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', marginBottom: 8 }}>No addresses saved yet.</p>
        : <select value={addressId} onChange={e => { setAddressId(e.target.value); setRecipientError(false) }}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${recipientError ? '#ef4444' : '#e5e7eb'}`, fontSize: 16, outline: 'none', marginBottom: 8, backgroundColor: 'white' }}>
            <option value="">Select recipient…</option>
            {addresses.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
      }
      <button onClick={() => setShowAddAddress(!showAddAddress)} style={{ fontSize: 13, color: 'var(--color-mauve)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>+ Add new address</button>
      {showAddAddress && <QuickAddAddress onSave={addr => { addresses.push(addr); setAddressId(addr.id); setShowAddAddress(false); setRecipientError(false) }} />}
    </div>
  )

  const mobileTabs: { id: MobileTab; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    { id: 'photos',  label: 'Photos',  icon: a => <IconCamera active={a} /> },
    { id: 'layout',  label: 'Layout',  icon: a => <IconGrid active={a} /> },
    { id: 'font',    label: 'Font',    icon: a => <IconFont active={a} /> },
    { id: 'letter',  label: 'Letter',  icon: a => <IconPencil active={a} /> },
    { id: 'to',      label: 'To',      icon: a => <IconPerson active={a} /> },
  ]

  // ─── Mobile layout ──────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden', position: 'fixed', inset: 0 }}>

        {/* Compact nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 50, flexShrink: 0, backgroundColor: 'white', borderBottom: '1px solid var(--color-blush-dark)', zIndex: 10 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--color-charcoal-light)', textDecoration: 'none' }}>← Back</Link>
          <PreciousPostLogo size="sm" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={clearEditor} title="Start over"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: 'white', color: 'var(--color-charcoal-light)', cursor: 'pointer' }}>
              <IconRefresh />
            </button>
            <button onClick={validateAndReview} disabled={submitting}
              style={{ padding: '7px 14px', borderRadius: 20, backgroundColor: 'var(--color-mauve)', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              Submit →
            </button>
          </div>
        </nav>

        {/* Preview */}
        <div {...getRootProps()} style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: 'var(--color-blush)', paddingTop: 8 }}>
          <input {...getInputProps()} />
          {isDragActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'rgba(176,128,144,0.18)', border: '3px dashed var(--color-mauve)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-mauve)' }}>Drop photos here</p>
            </div>
          )}
          <div style={{ width: 816 * mobileScale, height: 1056 * mobileScale, flexShrink: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', borderRadius: 3, overflow: 'hidden' }}>
            <LetterPreview ref={previewRef} layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100} font={font} fontSize={fontSize} letterText={letterText} senderName={profile.name} address={selectedAddress} scale={mobileScale} onResizePhotoArea={isSideBySide ? undefined : setPhotoAreaHeight} onSlotClick={handleSlotClick} onPhotoTap={handlePhotoTap} />
          </div>
        </div>

        {/* Bottom sheet — locked to bottom */}
        <div style={{ flexShrink: 0, backgroundColor: 'white', borderTop: '1px solid var(--color-blush-dark)', zIndex: 10 }}>
          {/* Tab content */}
          <div style={{ minHeight: 110, maxHeight: 210, overflowY: 'auto', overflowX: 'hidden' }}>
            {mobileTab === 'photos'  && photoTrayPanel}
            {mobileTab === 'layout'  && layoutPanel}
            {mobileTab === 'font'    && fontPanel}
            {mobileTab === 'letter'  && letterPanel}
            {mobileTab === 'to'      && recipientPanel}
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--color-blush-dark)', height: 54 }}>
            {mobileTabs.map(tab => {
              const active = mobileTab === tab.id
              return (
                <button key={tab.id} onClick={() => { setMobileTab(tab.id); setSelectedTrayIdx(null) }}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none', backgroundColor: 'white', cursor: 'pointer', borderTop: `2px solid ${active ? 'var(--color-mauve)' : 'transparent'}` }}>
                  {tab.icon(active)}
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.03em', color: active ? 'var(--color-mauve)' : '#9ca3af', textTransform: 'uppercase' }}>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Photo crop/pan editor modal */}
        {editingPhotoIndex !== null && photos[editingPhotoIndex] && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', flexShrink: 0 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Photo {editingPhotoIndex + 1} of {photos.length}</span>
              <button onClick={() => setEditingPhotoIndex(null)}
                style={{ padding: '8px 20px', borderRadius: 20, backgroundColor: 'var(--color-mauve)', color: 'white', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                Done
              </button>
            </div>

            <div
              onTouchStart={handlePhotoPanTouchStart}
              onTouchMove={handlePhotoPanTouchMove}
              onTouchEnd={handlePhotoPanTouchEnd}
              style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photos[editingPhotoIndex].url}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photos[editingPhotoIndex].x}% ${photos[editingPhotoIndex].y}%`, userSelect: 'none', display: 'block' }}
              />
            </div>

            <div style={{ padding: '12px 16px', flexShrink: 0, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Drag to reposition within the frame</p>
              {/* Prev / Next photo */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 }}>
                <button onClick={() => setEditingPhotoIndex(Math.max(0, editingPhotoIndex - 1))} disabled={editingPhotoIndex === 0}
                  style={{ padding: '6px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: 13, cursor: editingPhotoIndex === 0 ? 'default' : 'pointer', opacity: editingPhotoIndex === 0 ? 0.3 : 1 }}>← Prev</button>
                <button onClick={() => setEditingPhotoIndex(Math.min(photos.length - 1, editingPhotoIndex + 1))} disabled={editingPhotoIndex === photos.length - 1}
                  style={{ padding: '6px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: 'white', fontSize: 13, cursor: editingPhotoIndex === photos.length - 1 ? 'default' : 'pointer', opacity: editingPhotoIndex === photos.length - 1 ? 0.3 : 1 }}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {renderModals()}
      </div>
    )
  }

  // ─── Desktop layout ─────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-blush)' }}>
      <nav className="bg-white border-b px-4 py-3 shrink-0" style={{ borderColor: 'var(--color-blush-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PreciousPostLogo size="sm" />
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm px-3 py-2 rounded-full border transition-colors" style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)', textDecoration: 'none' }}>← Dashboard</Link>
            <button onClick={clearEditor} className="text-sm px-3 py-2 rounded-full border transition-colors" style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)' }}>Start over</button>
            <button onClick={validateAndReview} disabled={submitting} className="px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-opacity" style={{ backgroundColor: 'var(--color-mauve)' }}>
              Review & Submit →
            </button>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div className="bg-white border-r p-5 space-y-6" style={{ width: 300, flexShrink: 0, overflowY: 'auto', borderColor: 'var(--color-blush-dark)' }}>
          <Section title="Recipient">
            {recipientError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>Please select a recipient before submitting.</p>}
            {addresses.length === 0
              ? <p className="text-xs mb-2" style={{ color: 'var(--color-charcoal-light)' }}>No addresses saved yet.</p>
              : <select value={addressId} onChange={e => { setAddressId(e.target.value); setRecipientError(false) }} className="w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ borderColor: recipientError ? '#ef4444' : '#e5e7eb', fontSize: 14 }}>
                  <option value="">Select recipient…</option>
                  {addresses.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            }
            <button onClick={() => setShowAddAddress(!showAddAddress)} className="text-xs mt-1 underline" style={{ color: 'var(--color-mauve)' }}>+ Add new address</button>
            {showAddAddress && <QuickAddAddress onSave={addr => { addresses.push(addr); setAddressId(addr.id); setShowAddAddress(false); setRecipientError(false) }} />}
          </Section>

          {photos.length > 0 && (
            <Section title="Layout">
              {getLayoutsForCount(photos.length).length <= 1
                ? <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>One layout available for {photos.length} photo{photos.length !== 1 ? 's' : ''}.</p>
                : <div className="grid grid-cols-2 gap-2">
                    {getLayoutsForCount(photos.length).map(l => (
                      <button key={l.id} onClick={() => { setLayout(l.id); if (l.recommendedHeight) setPhotoAreaHeight(l.recommendedHeight) }} className="px-2 py-2 rounded-xl border text-xs transition-colors text-left"
                        style={{ borderColor: layout === l.id ? 'var(--color-mauve)' : '#e5e7eb', backgroundColor: layout === l.id ? 'var(--color-blush)' : 'white', color: layout === l.id ? 'var(--color-mauve)' : 'var(--color-charcoal)' }}>
                        {l.name}
                      </button>
                    ))}
                  </div>
              }
            </Section>
          )}

          <Section title="Font style">
            <div className="grid grid-cols-3 gap-2">
              {(['handwritten', 'serif', 'sans'] as FontFamily[]).map(f => (
                <button key={f} onClick={() => setFont(f)} className="py-2 px-1 rounded-xl border text-xs capitalize transition-colors"
                  style={{ borderColor: font === f ? 'var(--color-mauve)' : '#e5e7eb', backgroundColor: font === f ? 'var(--color-blush)' : 'white', color: font === f ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontFamily: f === 'handwritten' ? "'Caveat', cursive" : f === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}>
                  {f === 'handwritten' ? 'Handwritten' : f === 'serif' ? 'Serif' : 'Sans'}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Font size">
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as FontSize[]).map(s => (
                <button key={s} onClick={() => setFontSize(s)} className="py-2 rounded-xl border text-xs capitalize transition-colors"
                  style={{ borderColor: fontSize === s ? 'var(--color-mauve)' : '#e5e7eb', backgroundColor: fontSize === s ? 'var(--color-blush)' : 'white', color: fontSize === s ? 'var(--color-mauve)' : 'var(--color-charcoal)' }}>
                  {s}
                </button>
              ))}
            </div>
          </Section>

          <Section title={`Your letter (${letterText.length}/${MAX_CHARS})`}>
            <textarea value={letterText} onChange={e => setLetterText(e.target.value.slice(0, MAX_CHARS))} placeholder="Write your letter here…" rows={10}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e5e7eb', fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', serif" : 'system-ui' }} />
          </Section>
        </div>

        {/* Preview + tray */}
        <div {...getRootProps()} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          <input {...getInputProps()} />
          {isDragActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'rgba(176,128,144,0.18)', border: '3px dashed var(--color-mauve)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-mauve)' }}>Drop photos here</p>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 12px' }}>
            <p className="text-xs mb-3 font-medium shrink-0" style={{ color: 'var(--color-charcoal-light)' }}>Live preview — 8.5 × 11&quot; letter</p>
            <div style={{ width: 816 * PREVIEW_SCALE, height: 1056 * PREVIEW_SCALE, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <LetterPreview ref={previewRef} layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100} font={font} fontSize={fontSize} letterText={letterText} senderName={profile.name} address={selectedAddress} scale={PREVIEW_SCALE} onPanPhoto={panPhoto} onResizePhotoArea={isSideBySide ? undefined : setPhotoAreaHeight} onSlotClick={handleSlotClick} />
            </div>
          </div>

          {/* Desktop photo tray */}
          <div style={{ flexShrink: 0, backgroundColor: 'white', borderTop: '1px solid var(--color-blush-dark)' }}>
            {pendingSlot !== null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', backgroundColor: 'var(--color-blush)', borderBottom: '1px solid var(--color-blush-dark)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-mauve)', fontWeight: 600 }}>Placing photo in slot {pendingSlot + 1} — tap a photo below to move it, or upload a new one</p>
                <button onClick={() => updatePendingSlot(null)} style={{ fontSize: 11, color: 'var(--color-charcoal-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Cancel ×</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', overflowX: 'auto' }}>
              <button onClick={() => open()} disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
                style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', opacity: photos.length >= MAX_PHOTOS ? 0.4 : 1 }}>
                {uploadingPhotos ? <span style={{ fontSize: 10, color: 'var(--color-charcoal-light)' }}>…</span>
                  : <><span style={{ fontSize: 22, color: 'var(--color-mauve)', lineHeight: 1, fontWeight: 300 }}>+</span><span style={{ fontSize: 9, color: 'var(--color-charcoal-light)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{photos.length === 0 ? 'Add photos' : 'Add more'}</span></>}
              </button>
              {photos.length > 0 && <div style={{ width: 1, height: 56, backgroundColor: 'var(--color-blush-dark)', flexShrink: 0 }} />}
              {photos.map((photo, i) => {
                const isTarget = pendingSlot !== null && i !== pendingSlot
                return (
                  <div key={photo.id} draggable onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} onClick={isTarget ? () => assignTrayPhotoToSlot(i) : undefined}
                    style={{ flexShrink: 0, position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: dragOverIndex === i ? '2.5px solid var(--color-mauve)' : isTarget ? '2.5px solid #b08090' : '2px solid var(--color-blush-dark)', opacity: dragIndexRef.current === i ? 0.4 : 1, cursor: isTarget ? 'pointer' : 'grab' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photo.x}% ${photo.y}%`, userSelect: 'none', display: 'block' }} />
                    <div style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-mauve)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', padding: '0 3px' }}>{i + 1}</div>
                    <button onClick={e => { e.stopPropagation(); removePhoto(photo.id) }} style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                    {isTarget && <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(176,128,144,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18, color: 'white' }}>↩</span></div>}
                  </div>
                )
              })}
              {photos.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', paddingLeft: 4 }}>Add photos, or tap an empty slot on the preview above</p>}
              {photos.length >= 2 && <><div style={{ flex: 1, minWidth: 8 }} /><button onClick={autofill} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', fontSize: 11, fontWeight: 600, color: 'var(--color-mauve)', cursor: 'pointer', whiteSpace: 'nowrap' }}>↺ Autofill</button></>}
            </div>
          </div>
        </div>
      </div>

      {renderModals()}
    </div>
  )

  // ─── Modals ─────────────────────────────────────────────────────────────────

  function renderModals() {
    return (
      <>
        {showUpgrade && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: 40, maxWidth: 460, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 10 }}>Letter submitted!</h2>
              <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24 }}>Would you like to send a letter to another recipient this month?</p>
              <div style={{ backgroundColor: 'var(--color-blush)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mauve)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triple Post — $32/mo</p>
                <p style={{ fontSize: 14, color: 'var(--color-charcoal)', marginBottom: 12 }}>Send letters to up to 3 recipients every month.</p>
                <ul style={{ fontSize: 13, color: 'var(--color-charcoal-light)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>✓ 3 letters per month</li><li>✓ Up to 3 different recipients</li><li>✓ Monthly reminder text</li><li>✓ No obligations, cancel anytime</li>
                </ul>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={async () => { const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: 'triple' }) }); const { url, error } = await res.json(); if (url) window.location.href = url; else alert(error || 'Could not start upgrade.') }}
                  style={{ padding: '13px 0', borderRadius: 50, fontSize: 14, fontWeight: 600, color: 'white', backgroundColor: 'var(--color-mauve)', cursor: 'pointer', border: 'none' }}>Upgrade to Triple Post →</button>
                <button onClick={() => router.push('/dashboard?submitted=1')} style={{ padding: '13px 0', borderRadius: 50, fontSize: 14, color: 'var(--color-charcoal)', backgroundColor: 'white', border: '1px solid #e5e7eb', cursor: 'pointer' }}>No thanks, go to dashboard</button>
              </div>
            </div>
          </div>
        )}

        {showSendAnother && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: 40, maxWidth: 460, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 10 }}>Letter submitted!</h2>
              <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 8 }}>You have <strong>{maxLetters - submittedCount} letter{maxLetters - submittedCount !== 1 ? 's' : ''}</strong> remaining this month.</p>
              <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 28 }}>Would you like to send another letter to a different recipient?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => { setShowSendAnother(false); setAddressId('') }} style={{ padding: '13px 0', borderRadius: 50, fontSize: 14, fontWeight: 600, color: 'white', backgroundColor: 'var(--color-mauve)', cursor: 'pointer', border: 'none' }}>Yes, send another letter →</button>
                <button onClick={() => router.push('/dashboard?submitted=1')} style={{ padding: '13px 0', borderRadius: 50, fontSize: 14, color: 'var(--color-charcoal)', backgroundColor: 'white', border: '1px solid #e5e7eb', cursor: 'pointer' }}>No, go to dashboard</button>
              </div>
            </div>
          </div>
        )}

        {showReview && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: isMobile ? 20 : 32, maxWidth: 600, width: '100%', maxHeight: '95dvh', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 20, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 6 }}>Review Your Letter</h2>
                <p style={{ fontSize: 13, color: 'var(--color-charcoal-light)' }}>This is exactly what will be printed and mailed to <strong>{selectedAddress?.name}</strong>.</p>
              </div>
              <div style={{ width: isMobile ? 816 * 0.42 : 816 * 0.62, height: isMobile ? 1056 * 0.42 : 1056 * 0.62, boxShadow: '0 4px 32px rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                <LetterPreview layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100} font={font} fontSize={fontSize} letterText={letterText} senderName={profile.name} address={selectedAddress} scale={isMobile ? 0.42 : 0.62} />
              </div>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button onClick={() => setShowReview(false)} style={{ flex: 1, padding: '12px 0', borderRadius: 50, fontSize: 14, border: '1px solid #e5e7eb', color: 'var(--color-charcoal)', backgroundColor: 'white', cursor: 'pointer' }}>← Edit</button>
                <button onClick={() => { setShowReview(false); handleSubmit() }} disabled={submitting} style={{ flex: 1, padding: '12px 0', borderRadius: 50, fontSize: 14, fontWeight: 600, color: 'white', cursor: 'pointer', backgroundColor: 'var(--color-mauve)', opacity: submitting ? 0.6 : 1, border: 'none' }}>{submitting ? 'Submitting…' : '✓ Approve & Submit'}</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-charcoal-light)' }}>{title}</h3>
      {children}
    </div>
  )
}

function QuickAddAddress({ onSave }: { onSave: (addr: Address) => void }) {
  const [form, setForm] = useState({ name: '', address_line1: '', city: '', state: '', zip: '', country: 'US' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase.from('addresses').insert({ ...form, user_id: user.id }).select().single()
    if (error) { alert('Could not save: ' + error.message); setSaving(false); return }
    if (data) onSave(data as Address)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 p-3 rounded-xl" style={{ backgroundColor: 'var(--color-blush)' }}>
      {(['name', 'address_line1', 'city', 'state', 'zip'] as const).map(field => (
        <input key={field} placeholder={field.replace('_', ' ')} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} required
          style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, outline: 'none', boxSizing: 'border-box' }} />
      ))}
      <button type="submit" disabled={saving} style={{ width: '100%', padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'white', backgroundColor: 'var(--color-mauve)', border: 'none', cursor: 'pointer' }}>
        {saving ? 'Saving…' : 'Save address'}
      </button>
    </form>
  )
}
