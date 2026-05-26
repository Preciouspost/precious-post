'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { Address, FontFamily, FontSize, LayoutId, Letter, PhotoItem, Profile } from '@/types'
import { LetterPreview } from './LetterPreview'
import { getLayoutsForCount, getDefaultLayout, getLayout } from './layouts'
import { PreciousPostLogo } from '@/components/Logo'
import Link from 'next/link'
import { getCurrentMonthYear } from '@/lib/utils'
import { SubmitUpsellModal } from './SubmitUpsellModal'

interface Props {
  profile: Profile
  addresses: Address[]
  monthYear: string
  usedCount: number
  maxLetters: number
  initialLetter?: Letter | null
}

function parseFontSize(fs: unknown): number {
  if (typeof fs === 'number') return fs
  if (fs === 'small') return 12
  if (fs === 'large') return 18
  return 15
}

const MAX_PHOTOS = 8
const MAX_CHARS = 2500
const draftKey = (userId: string) => `precious-post-draft-${userId}`

type MobileTab = 'photos' | 'layout' | 'font' | 'letter' | 'to'

// ─── SVG icons ────────────────────────────────────────────────────────────────

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
function IconUndo({ color = 'currentColor' }: { color?: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
}
function IconSwap({ color = 'currentColor' }: { color?: string }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
}
function IconUpload({ color = 'currentColor' }: { color?: string }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function UploadSpinner() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      <circle cx="18" cy="18" r="14" stroke="var(--color-blush-dark)" strokeWidth="3" />
      <path d="M18 4 A14 14 0 0 1 32 18" stroke="var(--color-mauve)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
function IconScale({ color = 'currentColor' }: { color?: string }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LetterEditorClient({ profile, addresses, monthYear, usedCount, maxLetters, initialLetter }: Props) {
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null)

  const savedDraft = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem(draftKey(profile.user_id)) ?? 'null') } catch { return null } })()
    : null

  // initialLetter (from Supabase) takes priority over localStorage draft
  const [photos, setPhotos] = useState<PhotoItem[]>(initialLetter?.photos ?? savedDraft?.photos ?? [])
  const [layout, setLayout] = useState<LayoutId>(initialLetter?.layout ?? savedDraft?.layout ?? 'hero-2-below')
  const [photoAreaHeight, setPhotoAreaHeight] = useState(initialLetter?.photo_area_height ?? savedDraft?.photoAreaHeight ?? 45)
  const [font, setFont] = useState<FontFamily>((initialLetter?.font ?? savedDraft?.font ?? 'serif') as FontFamily)
  const [fontSize, setFontSize] = useState<FontSize>(
    initialLetter ? parseFontSize(initialLetter.font_size)
    : typeof savedDraft?.fontSize === 'number' ? savedDraft.fontSize
    : savedDraft?.fontSize === 'small' ? 12 : savedDraft?.fontSize === 'large' ? 18 : 15
  )
  const [letterText, setLetterText] = useState(initialLetter?.letter_text ?? savedDraft?.letterText ?? '')
  const [addressId, setAddressId] = useState<string>(initialLetter?.address_id ?? savedDraft?.addressId ?? addresses[0]?.id ?? '')

  // Track the Supabase letter ID for auto-save (update instead of insert)
  const dbLetterIdRef = useRef<string | null>(initialLetter?.id ?? null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showSendAnother, setShowSendAnother] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showUpsellModal, setShowUpsellModal] = useState(false)
  const [upsellLetterId, setUpsellLetterId] = useState<string>('')
  const [submittedCount, setSubmittedCount] = useState(usedCount)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragIndexRef = useRef<number | null>(null)
  const [recipientError, setRecipientError] = useState(false)

  // Undo — saved snapshot before each destructive photo mutation
  const [prevPhotos, setPrevPhotos] = useState<PhotoItem[] | null>(null)

  // Mobile state
  const [isMobile, setIsMobile] = useState(false)
  const [mobileScale, setMobileScale] = useState(0.45)
  const [desktopScale, setDesktopScale] = useState(0.55)
  const [mobileTab, setMobileTab] = useState<MobileTab>('to')

  // Pixory-style photo editing
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
  const [swapMode, setSwapMode] = useState(false)

  // Pending slot for empty-slot click → open file picker
  const [pendingSlot, setPendingSlot] = useState<number | null>(null)
  const pendingSlotRef = useRef<number | null>(null)
  function updatePendingSlot(slot: number | null) {
    setPendingSlot(slot)
    pendingSlotRef.current = slot
  }

  // Replacing slot — "Change photo" replaces in-place instead of appending
  const replacingSlotRef = useRef<number | null>(null)

  // Always-current photos ref for use inside useCallback without stale closures
  const photosRef = useRef(photos)
  useEffect(() => { photosRef.current = photos }, [photos])

  useEffect(() => {
    function update() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) {
        const scaleByWidth = (window.innerWidth - 16) / 816
        // nav=50, bottom sheet content≈160, tab bar=54, padding=16
        const scaleByHeight = (window.innerHeight - 50 - 160 - 54 - 16) / 1056
        setMobileScale(Math.min(scaleByWidth, Math.max(0.28, scaleByHeight)))
      } else {
        // sidebar=300, horizontal padding=48, buffer=16
        const scaleByWidth = (window.innerWidth - 300 - 48 - 16) / 816
        // nav≈61, photo tray≈96, vertical padding=32, label=28, buffer=16
        const scaleByHeight = (window.innerHeight - 61 - 96 - 32 - 28 - 16) / 1056
        setDesktopScale(Math.min(scaleByWidth, scaleByHeight, 0.72))
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(draftKey(profile.user_id), JSON.stringify({ photos, layout, photoAreaHeight, font, fontSize, letterText, addressId }))
      setLastSaved(new Date())
    } catch {}
  }, [photos, layout, photoAreaHeight, font, fontSize, letterText, addressId])

  // Auto-save draft to Supabase (3s debounce) so drafts survive logout/device changes
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const payload = {
        user_id: user.id,
        address_id: addressId || null,
        photos,
        layout,
        photo_area_height: photoAreaHeight,
        font,
        font_size: fontSize as number | string,
        letter_text: letterText,
        status: 'draft' as const,
        month_year: monthYear,
      }
      if (dbLetterIdRef.current) {
        await supabase.from('letters').update(payload).eq('id', dbLetterIdRef.current)
      } else {
        let { data: letter, error } = await supabase.from('letters').insert(payload).select('id').single()
        if (error?.message?.includes('letters_font_size_check')) {
          const fallback = fontSize <= 13 ? 'small' : fontSize >= 17 ? 'large' : 'medium'
          ;({ data: letter } = await supabase.from('letters').insert({ ...payload, font_size: fallback }).select('id').single())
        }
        if (letter?.id) dbLetterIdRef.current = letter.id
      }
    }, 3000)
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current) }
  }, [photos, layout, photoAreaHeight, font, fontSize, letterText, addressId])

  const selectedAddress = addresses.find(a => a.id === addressId)
  const currentLayoutDef = getLayout(layout)
  const isSideBySide = currentLayoutDef?.textPosition === 'right' || currentLayoutDef?.textPosition === 'left'

  // ─── File upload ─────────────────────────────────────────────────────────────

  // ─── Photo compression ───────────────────────────────────────────────────────
  async function compressPhoto(file: File): Promise<File | null> {
    const MAX_PX = 2400
    const QUALITY = 0.85
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const { naturalWidth: w, naturalHeight: h } = img
        // Reject photos that are too small for print quality
        if (Math.min(w, h) < 800) {
          resolve(null as unknown as File)
          return
        }
        // If already small enough, skip compression
        if (w <= MAX_PX && h <= MAX_PX) { resolve(file); return }
        const scale = MAX_PX / Math.max(w, h)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(w * scale)
        canvas.height = Math.round(h * scale)
        const ctx = canvas.getContext('2d')!
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
          'image/jpeg', QUALITY
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const replacingSlot = replacingSlotRef.current
    const targetSlot = pendingSlotRef.current
    const remaining = replacingSlot !== null ? 1 : MAX_PHOTOS - photosRef.current.length
    const files = acceptedFiles.slice(0, remaining)
    if (!files.length) return
    // Snapshot for undo
    const snapshot = [...photosRef.current]
    setUploadingPhotos(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const newPhotos: PhotoItem[] = []
    const tooSmall: string[] = []
    for (const file of files) {
      const compressed = await compressPhoto(file)
      if (!compressed) { tooSmall.push(file.name); continue }
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
      const { error } = await supabase.storage.from('letter-photos').upload(path, compressed, { contentType: 'image/jpeg' })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('letter-photos').getPublicUrl(path)
        newPhotos.push({ id: path, url: publicUrl, x: 50, y: 50, width: 100, height: 100 })
      }
    }
    if (tooSmall.length > 0) {
      alert(`${tooSmall.length === 1 ? 'That photo is' : 'Some photos are'} too low resolution for print quality and ${tooSmall.length === 1 ? 'was' : 'were'} not added. Please use a photo that is at least 800px on its shortest side.`)
    }
    if (newPhotos.length > 0) {
      setPrevPhotos(snapshot)
      setPhotos(prev => {
        if (replacingSlot !== null && newPhotos.length === 1) {
          // Replace in-place at specified slot
          const next = [...prev]
          next[replacingSlot] = { ...newPhotos[0] }
          return next
        }
        let next = [...prev, ...newPhotos]
        if (targetSlot !== null && newPhotos.length === 1) {
          const inserted = next.pop()!
          next.splice(Math.min(targetSlot, next.length), 0, inserted)
        }
        const def = getDefaultLayout(next.length)
        if (def) { setLayout(def.id); if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight) }
        return next
      })
    }
    replacingSlotRef.current = null
    updatePendingSlot(null)
    setUploadingPhotos(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: MAX_PHOTOS,
    disabled: uploadingPhotos, noClick: true,
  })

  // ─── Photo mutations ─────────────────────────────────────────────────────────

  function removePhoto(id: string) {
    setPrevPhotos([...photos])
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== id)
      const def = getDefaultLayout(next.length)
      if (def) { setLayout(def.id); if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight) }
      return next
    })
    setSelectedSlot(null)
    setSwapMode(false)
  }

  function panPhoto(index: number, x: number, y: number) {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, x, y } : p))
  }

  function zoomPhoto(index: number, zoom: number) {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, zoom } : p))
  }

  function handleDragStart(index: number) { dragIndexRef.current = index }
  function handleDragEnter(index: number) { setDragOverIndex(index) }
  function handleDragEnd() {
    const from = dragIndexRef.current; const to = dragOverIndex
    if (from !== null && to !== null && from !== to) {
      setPrevPhotos([...photos])
      setPhotos(prev => { const next = [...prev]; const [m] = next.splice(from, 1); next.splice(to, 0, m); return next })
    }
    dragIndexRef.current = null; setDragOverIndex(null)
  }

  // ─── Touch drag (mobile reorder) ─────────────────────────────────────────────
  function handleTouchDragStart(e: React.TouchEvent, index: number) {
    dragIndexRef.current = index
  }
  function handleTouchDragMove(e: React.TouchEvent) {
    if (dragIndexRef.current === null) return
    const touch = e.touches[0]
    const el = document.elementFromPoint(touch.clientX, touch.clientY)
    const photoEl = el?.closest('[data-photo-idx]') as HTMLElement | null
    if (photoEl?.dataset.photoIdx !== undefined) {
      setDragOverIndex(parseInt(photoEl.dataset.photoIdx))
    }
  }
  function handleTouchDragEnd() { handleDragEnd() }

  // ─── Slot / photo tap handlers ────────────────────────────────────────────────

  /** Tap on an empty slot — open file picker to fill that slot */
  function handleSlotClick(slotIndex: number) {
    updatePendingSlot(slotIndex)
    if (isMobile) setMobileTab('photos')
    open()
  }

  /** Tap on an occupied photo slot — Pixory-style: select or swap */
  function handlePhotoTap(slotIndex: number) {
    if (swapMode && selectedSlot !== null) {
      if (slotIndex !== selectedSlot) {
        // Execute swap
        setPrevPhotos([...photos])
        setPhotos(prev => {
          const next = [...prev]
          const temp = next[selectedSlot]
          next[selectedSlot] = next[slotIndex]
          next[slotIndex] = temp
          return next
        })
      }
      setSwapMode(false)
      setSelectedSlot(null)
    } else {
      // Select slot for editing
      setSelectedSlot(slotIndex)
      setSwapMode(false)
    }
  }

  // Handwritten (Caveat) has a smaller x-height — minimum readable size is 16px
  const HANDWRITTEN_MIN = 16
  const sliderMin = font === 'handwritten' ? HANDWRITTEN_MIN : 12

  function handleFontChange(f: FontFamily) {
    setFont(f)
    if (f === 'handwritten' && fontSize < HANDWRITTEN_MIN) setFontSize(HANDWRITTEN_MIN)
  }

  function autofill() {
    setPhotos(prev => [...prev].sort((a, b) => {
      const tsA = parseInt(a.id.split('/')[1]?.split('-')[0] ?? '0', 10)
      const tsB = parseInt(b.id.split('/')[1]?.split('-')[0] ?? '0', 10)
      return tsA - tsB
    }))
  }

  // ─── Submit / clear ───────────────────────────────────────────────────────────

  function needsUpsell(): boolean {
    const plan = profile.plan
    if (!plan || plan === 'one_time') return true
    if (plan === 'single' && submittedCount >= 1) return true
    if (plan === 'triple' && submittedCount >= 3) return true
    return false
  }

  async function saveDraftToDb(): Promise<string | null> {
    // If we already have a Supabase draft, return its ID directly
    if (dbLetterIdRef.current) return dbLetterIdRef.current
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const payload = {
      user_id: user.id, address_id: addressId || null, photos, layout,
      photo_area_height: photoAreaHeight, font, font_size: fontSize as number | string,
      letter_text: letterText, status: 'draft',
      month_year: getCurrentMonthYear(),
    }
    let { data: letter, error } = await supabase.from('letters').insert(payload).select('id').single()
    if (error?.message?.includes('letters_font_size_check')) {
      const fallbackSize = fontSize <= 13 ? 'small' : fontSize >= 17 ? 'large' : 'medium'
      ;({ data: letter, error } = await supabase.from('letters').insert({ ...payload, font_size: fallbackSize }).select('id').single())
    }
    if (error || !letter) return null
    dbLetterIdRef.current = letter.id
    return letter.id
  }

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
    if (needsUpsell()) {
      // Save as draft first, then open upsell modal
      saveDraftToDb().then((id) => {
        if (id) {
          setUpsellLetterId(id)
          setShowUpsellModal(true)
        } else {
          // If draft save failed, still show upsell but without a letter id
          setUpsellLetterId('')
          setShowUpsellModal(true)
        }
      })
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
    const submitFields = {
      address_id: addressId, photos, layout,
      photo_area_height: photoAreaHeight, font, font_size: fontSize as number | string,
      letter_text: letterText, status: 'submitted',
      month_year: getCurrentMonthYear(), submitted_at: new Date().toISOString(),
    }
    let letter, error
    if (dbLetterIdRef.current) {
      // Update existing draft to submitted
      ;({ data: letter, error } = await supabase.from('letters')
        .update(submitFields).eq('id', dbLetterIdRef.current).select().single())
    } else {
      const insertPayload = { user_id: user.id, ...submitFields }
      ;({ data: letter, error } = await supabase.from('letters').insert(insertPayload).select().single())
      // If the legacy text check constraint is still in place, retry with a mapped string.
      // Permanent fix: run the migration SQL in Supabase SQL editor:
      //   ALTER TABLE public.letters DROP CONSTRAINT IF EXISTS letters_font_size_check;
      //   ALTER TABLE public.letters ALTER COLUMN font_size TYPE smallint
      //     USING (CASE font_size WHEN 'small' THEN 12 WHEN 'large' THEN 18 ELSE 15 END)::smallint;
      if (error?.message?.includes('letters_font_size_check')) {
        const fallbackSize = fontSize <= 13 ? 'small' : fontSize >= 17 ? 'large' : 'medium'
        ;({ data: letter, error } = await supabase.from('letters')
          .insert({ ...insertPayload, font_size: fallbackSize }).select().single())
      }
    }

    if (error) { alert('Error submitting: ' + error.message); setSubmitting(false); return }
    await supabase.rpc('increment_usage', { p_user_id: user.id, p_month_year: monthYear })

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
    setPhotoAreaHeight(45); setFont('serif'); setFontSize(15)
    setPrevPhotos(null); setSelectedSlot(null); setSwapMode(false)
  }

  // ─── Photo edit panel (shared mobile + desktop) ───────────────────────────────

  const activePhoto = selectedSlot !== null ? photos[selectedSlot] : null

  const photoEditPanel = activePhoto ? (
    <div style={{ padding: '10px 14px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-charcoal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'var(--color-mauve)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'white', fontWeight: 700, flexShrink: 0 }}>
            {selectedSlot! + 1}
          </span>
          Edit Photo {selectedSlot! + 1}
        </span>
        <button
          onClick={() => { setSelectedSlot(null); setSwapMode(false) }}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-charcoal-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 8px' }}>
          Done ✓
        </button>
      </div>

      {/* Scale slider */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <IconScale color="var(--color-charcoal-light)" />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Scale</span>
          <span style={{ fontSize: 10, color: 'var(--color-charcoal-light)' }}>{Math.round((activePhoto.zoom ?? 1) * 100)}%</span>
        </div>
        <input
          type="range" min="100" max="300" step="5"
          value={Math.round((activePhoto.zoom ?? 1) * 100)}
          onChange={e => {
            if (selectedSlot === null) return
            zoomPhoto(selectedSlot, parseInt(e.target.value) / 100)
          }}
          style={{ width: '100%', accentColor: 'var(--color-mauve)', height: 20, cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
          <span style={{ fontSize: 9, color: '#c0b0b5' }}>1×</span>
          <span style={{ fontSize: 9, color: '#c0b0b5' }}>Drag to reposition in preview</span>
          <span style={{ fontSize: 9, color: '#c0b0b5' }}>3×</span>
        </div>
      </div>

      {/* Swap / Change buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setSwapMode(m => !m)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 10, border: `1.5px solid ${swapMode ? 'var(--color-mauve)' : '#e5e7eb'}`, backgroundColor: swapMode ? 'var(--color-blush)' : 'white', color: swapMode ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.12s' }}>
          <IconSwap color={swapMode ? 'var(--color-mauve)' : '#9ca3af'} />
          Swap
        </button>
        <button
          onClick={() => { if (selectedSlot !== null) { replacingSlotRef.current = selectedSlot; open() } }}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0', borderRadius: 10, border: '1.5px solid #e5e7eb', backgroundColor: 'white', color: 'var(--color-charcoal)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          <IconUpload color="#9ca3af" />
          Change
        </button>
      </div>

      {swapMode && (
        <p style={{ fontSize: 11, color: 'var(--color-mauve)', textAlign: 'center', marginTop: 8, fontWeight: 600 }}>
          Tap another photo in the preview to swap →
        </p>
      )}
    </div>
  ) : null

  // ─── Shared panel content ─────────────────────────────────────────────────────

  const photoTrayPanel = (
    <div style={{ position: 'relative' }}>
      {pendingSlot !== null && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', backgroundColor: 'var(--color-blush)', borderBottom: '1px solid var(--color-blush-dark)' }}>
          <p style={{ fontSize: 11, color: 'var(--color-mauve)', fontWeight: 600 }}>Placing photo in slot {pendingSlot + 1}</p>
          <button onClick={() => updatePendingSlot(null)} style={{ fontSize: 11, color: 'var(--color-charcoal-light)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', overflowX: 'auto' }}>
        {/* Add button */}
        <button
          onClick={() => open()}
          disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
          style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', opacity: photos.length >= MAX_PHOTOS ? 0.4 : 1 }}>
          {uploadingPhotos
            ? <span style={{ fontSize: 10, color: 'var(--color-charcoal-light)' }}>…</span>
            : <>
                <span style={{ fontSize: 24, color: 'var(--color-mauve)', lineHeight: 1, fontWeight: 300 }}>+</span>
                <span style={{ fontSize: 9, color: 'var(--color-charcoal-light)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{photos.length === 0 ? 'Add photos' : 'Add more'}</span>
                <span style={{ fontSize: 8, color: 'var(--color-charcoal-light)', opacity: 0.7 }}>up to 8</span>
              </>}
        </button>

        {photos.length > 0 && <div style={{ width: 1, height: 52, backgroundColor: 'var(--color-blush-dark)', flexShrink: 0 }} />}

        {photos.map((photo, i) => (
          <div
            key={photo.id}
            draggable
            data-photo-idx={i}
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onTouchStart={(e) => handleTouchDragStart(e, i)}
            onTouchMove={handleTouchDragMove}
            onTouchEnd={handleTouchDragEnd}
            style={{ flexShrink: 0, position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: dragOverIndex === i ? '2.5px solid var(--color-mauve)' : '2px solid var(--color-blush-dark)', opacity: dragIndexRef.current === i ? 0.4 : 1, cursor: 'grab', touchAction: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photo.x}% ${photo.y}%`, userSelect: 'none', display: 'block', transform: photo.zoom && photo.zoom !== 1 ? `scale(${photo.zoom})` : undefined, transformOrigin: `${photo.x}% ${photo.y}%` }} />
            <div style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-mauve)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', padding: '0 3px' }}>{i + 1}</div>
            <button onClick={e => { e.stopPropagation(); removePhoto(photo.id) }} style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
          </div>
        ))}

        {photos.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', paddingLeft: 4 }}>Tap the + to add photos</p>}
        {photos.length >= 2 && (
          <>
            <div style={{ flex: 1, minWidth: 8 }} />
            <button onClick={autofill} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', fontSize: 11, fontWeight: 600, color: 'var(--color-mauve)', cursor: 'pointer', whiteSpace: 'nowrap' }}>Autofill</button>
          </>
        )}
      </div>
      {isMobile && uploadingPhotos && (
        <p style={{ fontSize: 10, color: 'var(--color-mauve)', textAlign: 'center', paddingBottom: 6, fontWeight: 600 }}>Uploading… this may take a moment. Refresh if a photo doesn't appear.</p>
      )}
      {isMobile && !uploadingPhotos && photos.length > 0 && (
        <p style={{ fontSize: 10, color: 'var(--color-charcoal-light)', textAlign: 'center', paddingBottom: 6 }}>Tap photo in preview to edit · drag here to reorder</p>
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
            <button key={f} onClick={() => handleFontChange(f)}
              style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: `1px solid ${font === f ? 'var(--color-mauve)' : '#e5e7eb'}`, backgroundColor: font === f ? 'var(--color-blush)' : 'white', color: font === f ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontSize: 12, cursor: 'pointer', fontFamily: f === 'handwritten' ? "'Caveat', cursive" : f === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}>
              {f === 'handwritten' ? 'Handwritten' : f === 'serif' ? 'Serif' : 'Sans'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</p>
          <span style={{ fontSize: 11, color: 'var(--color-mauve)', fontWeight: 600 }}>{fontSize}px</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-charcoal-light)', lineHeight: 1, userSelect: 'none' }}>A</span>
          <input type="range" min={sliderMin} max="25" step="1"
            value={fontSize}
            onChange={e => setFontSize(parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--color-mauve)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 18, color: 'var(--color-charcoal-light)', lineHeight: 1, userSelect: 'none' }}>A</span>
        </div>
        <p style={{ fontSize: 9, color: 'var(--color-charcoal-light)', textAlign: 'center', marginTop: 3 }}>Drag to adjust · min readable for print</p>
      </div>
    </div>
  )

  const letterPanel = (
    <div style={{ padding: '8px 12px' }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-charcoal-light)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{letterText.length}/{MAX_CHARS}</p>
      <textarea
        value={letterText}
        onChange={e => setLetterText(e.target.value.slice(0, MAX_CHARS))}
        placeholder="Write your letter here…"
        rows={4}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 16, outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}
      />
    </div>
  )

  const recipientPanel = (
    <div style={{ padding: '10px 12px' }}>
      {recipientError && <p style={{ fontSize: 12, color: '#ef4444', marginBottom: 6 }}>Please select a recipient before submitting.</p>}
      {addresses.length === 0
        ? <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', marginBottom: 8 }}>No addresses saved yet.</p>
        : <select
            value={addressId}
            onChange={e => { setAddressId(e.target.value); setRecipientError(false) }}
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

  // ─── Mobile layout ────────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', backgroundColor: 'white', overflow: 'hidden', position: 'fixed', inset: 0 }}>

        {/* Compact nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 50, flexShrink: 0, backgroundColor: 'white', borderBottom: '1px solid var(--color-blush-dark)', zIndex: 10 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'var(--color-charcoal-light)', textDecoration: 'none' }}>← Back</Link>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PreciousPostLogo size="sm" />
            {lastSaved && <span style={{ fontSize: 9, color: '#b0b8c1', letterSpacing: '0.03em', marginTop: 1 }}>✓ Draft saved</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Undo */}
            {prevPhotos !== null && (
              <button
                onClick={() => { setPhotos(prevPhotos); setPrevPhotos(null) }}
                title="Undo"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: '50%', border: '1px solid #e5e7eb', backgroundColor: 'white', color: 'var(--color-charcoal-light)', cursor: 'pointer' }}>
                <IconUndo />
              </button>
            )}
            {/* Clear */}
            <button
              onClick={clearEditor}
              style={{ padding: '5px 10px', borderRadius: 16, border: '1px solid #e5e7eb', backgroundColor: 'white', color: 'var(--color-charcoal-light)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Clear ×
            </button>
            {/* Submit */}
            <button
              onClick={validateAndReview}
              disabled={submitting}
              style={{ padding: '7px 13px', borderRadius: 20, backgroundColor: 'var(--color-mauve)', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
              Submit →
            </button>
          </div>
        </nav>

        {/* Preview */}
        <div
          {...getRootProps()}
          onClick={() => { if (selectedSlot !== null) { setSelectedSlot(null); setSwapMode(false) } }}
          style={{ flex: 1, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', backgroundColor: 'var(--color-blush)', paddingTop: 8 }}>
          <input {...getInputProps()} />
          {isDragActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, backgroundColor: 'rgba(176,128,144,0.18)', border: '3px dashed var(--color-mauve)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-mauve)' }}>Drop photos here</p>
            </div>
          )}
          <div
            onClick={e => e.stopPropagation()}
            style={{ position: 'relative', width: 816 * mobileScale, height: 1056 * mobileScale, flexShrink: 0, boxShadow: '0 2px 16px rgba(0,0,0,0.10)', borderRadius: 3, overflow: 'hidden' }}>
            <LetterPreview
              ref={previewRef}
              layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100}
              font={font} fontSize={fontSize} letterText={letterText}
              senderName={profile.name} address={selectedAddress} scale={mobileScale}
              onPanPhoto={panPhoto}
              onResizePhotoArea={isSideBySide ? undefined : setPhotoAreaHeight}
              onSlotClick={handleSlotClick}
              onPhotoTap={handlePhotoTap}
              selectedSlot={selectedSlot}
              swapMode={swapMode}
            />
            {/* Upload loading overlay */}
            {uploadingPhotos && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(249,237,232,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 30 }}>
                <UploadSpinner />
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-mauve)', textAlign: 'center', padding: '0 16px' }}>Uploading photos…</p>
                <p style={{ fontSize: 10, color: 'var(--color-charcoal-light)', textAlign: 'center', padding: '0 20px' }}>This may take a moment. Refresh if a photo doesn't appear.</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom sheet */}
        <div style={{ flexShrink: 0, backgroundColor: 'white', borderTop: '1px solid var(--color-blush-dark)', zIndex: 10 }}>
          {/* Tab content — replaced by photo edit panel when a slot is selected */}
          <div style={{ minHeight: 110, maxHeight: 210, overflowY: 'auto', overflowX: 'hidden' }}>
            {selectedSlot !== null && photoEditPanel
              ? photoEditPanel
              : <>
                  {mobileTab === 'photos'  && photoTrayPanel}
                  {mobileTab === 'layout'  && layoutPanel}
                  {mobileTab === 'font'    && fontPanel}
                  {mobileTab === 'letter'  && letterPanel}
                  {mobileTab === 'to'      && recipientPanel}
                </>
            }
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderTop: '1px solid var(--color-blush-dark)', height: 54 }}>
            {selectedSlot !== null
              ? (
                /* While editing a photo, show a single "← All tools" pill to close */
                <button
                  onClick={() => { setSelectedSlot(null); setSwapMode(false) }}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', backgroundColor: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--color-mauve)' }}>
                  ← Back to editor
                </button>
              )
              : mobileTabs.map(tab => {
                  const active = mobileTab === tab.id
                  return (
                    <button key={tab.id} onClick={() => setMobileTab(tab.id)}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, border: 'none', backgroundColor: 'white', cursor: 'pointer', borderTop: `2px solid ${active ? 'var(--color-mauve)' : 'transparent'}` }}>
                      {tab.icon(active)}
                      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.03em', color: active ? 'var(--color-mauve)' : '#9ca3af', textTransform: 'uppercase' }}>{tab.label}</span>
                    </button>
                  )
                })
            }
          </div>
        </div>

        {renderModals()}
      </div>
    )
  }

  // ─── Desktop layout ───────────────────────────────────────────────────────────

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-blush)' }}>
      <nav className="bg-white border-b px-4 py-3 shrink-0" style={{ borderColor: 'var(--color-blush-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col items-start">
            <PreciousPostLogo size="sm" />
            {lastSaved && <span style={{ fontSize: 10, color: '#b0b8c1', letterSpacing: '0.03em', marginTop: 2 }}>✓ Draft saved</span>}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="text-sm px-3 py-2 rounded-full border transition-colors" style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)', textDecoration: 'none' }}>← Dashboard</Link>
            {prevPhotos !== null && (
              <button
                onClick={() => { setPhotos(prevPhotos); setPrevPhotos(null) }}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-full border transition-colors"
                style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)' }}>
                <IconUndo /> Undo
              </button>
            )}
            <button onClick={clearEditor} className="text-sm px-3 py-2 rounded-full border transition-colors" style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)' }}>Clear ×</button>
            <button onClick={validateAndReview} disabled={submitting} className="px-4 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-opacity" style={{ backgroundColor: 'var(--color-mauve)' }}>
              Review & Submit →
            </button>
          </div>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <div className="bg-white border-r" style={{ width: 300, flexShrink: 0, overflowY: 'auto', borderColor: 'var(--color-blush-dark)', display: 'flex', flexDirection: 'column' }}>

          {/* Photo edit panel — shown at top when a slot is selected */}
          {selectedSlot !== null && activePhoto && (
            <div style={{ borderBottom: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)' }}>
              {photoEditPanel}
            </div>
          )}

          <div className="p-5 space-y-6" style={{ flex: 1 }}>
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
                  <button key={f} onClick={() => handleFontChange(f)} className="py-2 px-1 rounded-xl border text-xs capitalize transition-colors"
                    style={{ borderColor: font === f ? 'var(--color-mauve)' : '#e5e7eb', backgroundColor: font === f ? 'var(--color-blush)' : 'white', color: font === f ? 'var(--color-mauve)' : 'var(--color-charcoal)', fontFamily: f === 'handwritten' ? "'Caveat', cursive" : f === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}>
                    {f === 'handwritten' ? 'Handwritten' : f === 'serif' ? 'Serif' : 'Sans'}
                  </button>
                ))}
              </div>
            </Section>

            <Section title={`Font size — ${fontSize}px`}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 11, color: 'var(--color-charcoal-light)', userSelect: 'none' }}>A</span>
                <input type="range" min={sliderMin} max="25" step="1"
                  value={fontSize}
                  onChange={e => setFontSize(parseInt(e.target.value))}
                  className="flex-1"
                  style={{ accentColor: 'var(--color-mauve)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 18, color: 'var(--color-charcoal-light)', userSelect: 'none' }}>A</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>Minimum kept readable for print</p>
            </Section>

            <Section title={`Your letter (${letterText.length}/${MAX_CHARS})`}>
              <textarea value={letterText} onChange={e => setLetterText(e.target.value.slice(0, MAX_CHARS))} placeholder="Write your letter here…" rows={10}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
                style={{ borderColor: '#e5e7eb', fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', serif" : 'system-ui' }} />
            </Section>
          </div>
        </div>

        {/* Preview + tray */}
        <div
          {...getRootProps()}
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}
          onClick={() => { if (selectedSlot !== null) { setSelectedSlot(null); setSwapMode(false) } }}>
          <input {...getInputProps()} />
          {isDragActive && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 40, backgroundColor: 'rgba(176,128,144,0.18)', border: '3px dashed var(--color-mauve)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-mauve)' }}>Drop photos here</p>
            </div>
          )}
          <div
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 24px 12px' }}>
            <p className="text-xs mb-3 font-medium shrink-0" style={{ color: 'var(--color-charcoal-light)' }}>
              Live preview — 8.5 × 11&quot; letter
              {selectedSlot !== null && <span style={{ color: 'var(--color-mauve)', marginLeft: 8 }}>Drag to pan · click elsewhere to deselect</span>}
            </p>
            <div style={{ position: 'relative', width: 816 * desktopScale, height: 1056 * desktopScale, boxShadow: '0 4px 32px rgba(0,0,0,0.12)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
              <LetterPreview
                ref={previewRef}
                layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100}
                font={font} fontSize={fontSize} letterText={letterText}
                senderName={profile.name} address={selectedAddress} scale={desktopScale}
                onPanPhoto={panPhoto}
                onResizePhotoArea={isSideBySide ? undefined : setPhotoAreaHeight}
                onSlotClick={handleSlotClick}
                onPhotoTap={handlePhotoTap}
                selectedSlot={selectedSlot}
                swapMode={swapMode}
              />
              {uploadingPhotos && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(249,237,232,0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 30 }}>
                  <UploadSpinner />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-mauve)' }}>Uploading photos…</p>
                  <p style={{ fontSize: 11, color: 'var(--color-charcoal-light)', textAlign: 'center', maxWidth: 220 }}>This may take a moment. Refresh if a photo doesn't appear.</p>
                </div>
              )}
            </div>
          </div>

          {/* Desktop photo tray */}
          <div style={{ flexShrink: 0, backgroundColor: 'white', borderTop: '1px solid var(--color-blush-dark)' }}>
            {pendingSlot !== null && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', backgroundColor: 'var(--color-blush)', borderBottom: '1px solid var(--color-blush-dark)' }}>
                <p style={{ fontSize: 12, color: 'var(--color-mauve)', fontWeight: 600 }}>Placing photo in slot {pendingSlot + 1} — upload new or drag to reorder</p>
                <button onClick={() => updatePendingSlot(null)} style={{ fontSize: 11, color: 'var(--color-charcoal-light)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Cancel ×</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', overflowX: 'auto' }}>
              <button onClick={() => open()} disabled={photos.length >= MAX_PHOTOS || uploadingPhotos}
                style={{ flexShrink: 0, width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', opacity: photos.length >= MAX_PHOTOS ? 0.4 : 1 }}>
                {uploadingPhotos ? <span style={{ fontSize: 10, color: 'var(--color-charcoal-light)' }}>…</span>
                  : <><span style={{ fontSize: 22, color: 'var(--color-mauve)', lineHeight: 1, fontWeight: 300 }}>+</span><span style={{ fontSize: 9, color: 'var(--color-charcoal-light)', fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{photos.length === 0 ? 'Add photos' : 'Add more'}</span><span style={{ fontSize: 8, color: 'var(--color-charcoal-light)', opacity: 0.7 }}>up to 8</span></>}
              </button>
              {photos.length > 0 && <div style={{ width: 1, height: 56, backgroundColor: 'var(--color-blush-dark)', flexShrink: 0 }} />}
              {photos.map((photo, i) => (
                <div key={photo.id} draggable data-photo-idx={i} onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()} onTouchStart={(e) => handleTouchDragStart(e, i)} onTouchMove={handleTouchDragMove} onTouchEnd={handleTouchDragEnd}
                  style={{ flexShrink: 0, position: 'relative', width: 72, height: 72, borderRadius: 10, overflow: 'hidden', border: dragOverIndex === i ? '2.5px solid var(--color-mauve)' : '2px solid var(--color-blush-dark)', opacity: dragIndexRef.current === i ? 0.4 : 1, cursor: 'grab', touchAction: 'none' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${photo.x}% ${photo.y}%`, userSelect: 'none', display: 'block', transform: photo.zoom && photo.zoom !== 1 ? `scale(${photo.zoom})` : undefined, transformOrigin: `${photo.x}% ${photo.y}%` }} />
                  <div style={{ position: 'absolute', top: 3, left: 3, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--color-mauve)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', padding: '0 3px' }}>{i + 1}</div>
                  <button onClick={e => { e.stopPropagation(); removePhoto(photo.id) }} style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>×</button>
                </div>
              ))}
              {photos.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', paddingLeft: 4 }}>Click + to add photos</p>}
              {photos.length >= 2 && (
                <><div style={{ flex: 1, minWidth: 8 }} />
                <button onClick={autofill} style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', fontSize: 11, fontWeight: 600, color: 'var(--color-mauve)', cursor: 'pointer', whiteSpace: 'nowrap' }}>↺ Autofill</button></>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderModals()}
    </div>
  )

  // ─── Modals ───────────────────────────────────────────────────────────────────

  function renderModals() {
    return (
      <>
        <SubmitUpsellModal
          isOpen={showUpsellModal}
          onClose={() => setShowUpsellModal(false)}
          userPlan={profile.plan}
          monthlyCount={submittedCount}
          letterId={upsellLetterId}
        />

        {showUpgrade && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ backgroundColor: 'white', borderRadius: 20, padding: isMobile ? 24 : 40, maxWidth: 460, width: '100%', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 10 }}>Letter submitted!</h2>
              <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24 }}>Would you like to send a letter to another recipient this month?</p>
              <div style={{ backgroundColor: 'var(--color-blush)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mauve)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triple Post</p>
                  <p style={{ fontSize: 13, color: 'var(--color-charcoal-light)', textDecoration: 'line-through' }}>$32/mo</p>
                </div>
                <p style={{ fontSize: 14, color: 'var(--color-charcoal)', marginBottom: 12 }}>Send letters to up to 3 recipients every month.</p>
                <ul style={{ fontSize: 13, color: 'var(--color-charcoal-light)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
                  <li>✓ 3 letters per month</li>
                  <li>✓ Up to 3 different recipients</li>
                  <li>✓ Up to 8 photos each</li>
                  <li>✓ Printed &amp; mailed for you</li>
                  <li>✓ Monthly reminder text</li>
                  <li>✓ No obligations, cancel anytime</li>
                </ul>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 4 }}>First month: only $19.05</p>
                  <p style={{ fontSize: 12, color: 'var(--color-charcoal-light)', lineHeight: 1.5 }}>You'll be charged the difference for your current billing period. Starting next month: $32/mo.</p>
                </div>
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
              <div style={{ width: isMobile ? 816 * 0.42 : 816 * desktopScale, height: isMobile ? 1056 * 0.42 : 1056 * desktopScale, boxShadow: '0 4px 32px rgba(0,0,0,0.15)', borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                <LetterPreview layout={layout} photos={photos} photoAreaHeight={photoAreaHeight} photoAreaWidth={100} font={font} fontSize={fontSize} letterText={letterText} senderName={profile.name} address={selectedAddress} scale={isMobile ? 0.42 : desktopScale} />
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
