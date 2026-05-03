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
const DRAFT_KEY = 'precious-post-draft'

export function LetterEditorClient({ profile, addresses, monthYear, usedCount, maxLetters }: Props) {
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null)

  // Load draft from localStorage on first render
  const savedDraft = typeof window !== 'undefined'
    ? (() => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null } })()
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

  // Auto-save draft to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ photos, layout, photoAreaHeight, font, fontSize, letterText, addressId }))
    } catch {}
  }, [photos, layout, photoAreaHeight, font, fontSize, letterText, addressId])

  const selectedAddress = addresses.find(a => a.id === addressId)
  const currentLayoutDef = getLayout(layout)
  const isSideBySide = currentLayoutDef?.textPosition === 'right' || currentLayoutDef?.textPosition === 'left'

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = MAX_PHOTOS - photos.length
    const files = acceptedFiles.slice(0, remaining)
    if (!files.length) return

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
      const next = [...prev, ...newPhotos]
      const def = getDefaultLayout(next.length)
      if (def) {
        setLayout(def.id)
        if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight)
      }
      return next
    })
    setUploadingPhotos(false)
  }, [photos.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: MAX_PHOTOS,
    disabled: photos.length >= MAX_PHOTOS || uploadingPhotos,
  })

  function removePhoto(id: string) {
    setPhotos(prev => {
      const next = prev.filter(p => p.id !== id)
      const def = getDefaultLayout(next.length)
      if (def) {
        setLayout(def.id)
        if (def.recommendedHeight) setPhotoAreaHeight(def.recommendedHeight)
      }
      return next
    })
  }

  function panPhoto(index: number, x: number, y: number) {
    setPhotos(prev => prev.map((p, i) => i === index ? { ...p, x, y } : p))
  }

  // Drag-to-reorder handlers
  function handleDragStart(index: number) {
    dragIndexRef.current = index
  }

  function handleDragEnter(index: number) {
    setDragOverIndex(index)
  }

  function handleDragEnd() {
    const from = dragIndexRef.current
    const to = dragOverIndex
    if (from !== null && to !== null && from !== to) {
      setPhotos(prev => {
        const next = [...prev]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    }
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  async function handleSubmit() {
    if (!addressId) { alert('Please select a recipient.'); return }
    if (!letterText.trim()) { alert('Please write your letter.'); return }
    setSubmitting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: letter, error } = await supabase.from('letters').insert({
      user_id: user.id,
      address_id: addressId,
      photos,
      layout,
      photo_area_height: photoAreaHeight,
      font,
      font_size: fontSize,
      letter_text: letterText,
      status: 'submitted',
      month_year: getCurrentMonthYear(),
      submitted_at: new Date().toISOString(),
    }).select().single()

    if (error) { alert('Error submitting letter: ' + error.message); setSubmitting(false); return }

    await supabase.rpc('increment_usage', { p_user_id: user.id, p_month_year: monthYear })

    await fetch('/api/sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'submitted', letterId: letter.id }),
    })

    // Clear the saved draft on successful submission
    try { localStorage.removeItem(DRAFT_KEY) } catch {}

    const newCount = submittedCount + 1
    setSubmittedCount(newCount)
    setSubmitting(false)

    if (profile.plan === 'triple' && newCount < maxLetters) {
      setShowSendAnother(true)
    } else if (profile.plan === 'single') {
      setShowUpgrade(true)
    } else {
      router.push('/dashboard?submitted=1')
    }
  }

  function startAnotherLetter() {
    setShowSendAnother(false)
    setAddressId('')
  }

  function clearEditor() {
    if (!confirm('Clear everything and start fresh?')) return
    try { localStorage.removeItem(DRAFT_KEY) } catch {}
    setPhotos([])
    setLetterText('')
    setAddressId('')
    setLayout('hero-2-below')
    setPhotoAreaHeight(45)
    setFont('serif')
    setFontSize('medium')
  }

  return (
    // Full viewport height — nothing outside scrolls
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-blush)' }}>

      {/* Nav — fixed height */}
      <nav className="bg-white border-b px-4 py-3 shrink-0" style={{ borderColor: 'var(--color-blush-dark)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <PreciousPostLogo size="sm" />
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>← Dashboard</Link>
            <button
              onClick={() => setAddressId('')}
              className="text-sm px-4 py-2 rounded-full border transition-colors"
              style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal-light)' }}
            >
              Edit for new recipient
            </button>
            <button
              onClick={() => {
                if (!addressId) { alert('Please select a recipient.'); return }
                if (!letterText.trim()) { alert('Please write your letter.'); return }
                setShowReview(true)
              }}
              disabled={submitting || !addressId || !letterText.trim()}
              className="px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: 'var(--color-mauve)' }}
            >
              Review & Submit →
            </button>
          </div>
        </div>
      </nav>

      {/* Two-panel layout — fills all remaining height */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: sidebar scrolls independently */}
        <div
          className="bg-white border-r p-5 space-y-6"
          style={{
            width: 320,
            flexShrink: 0,
            overflowY: 'auto',
            borderColor: 'var(--color-blush-dark)',
          }}
        >
          {/* Recipient */}
          <Section title="Recipient">
            {addresses.length === 0 ? (
              <p className="text-xs mb-2" style={{ color: 'var(--color-charcoal-light)' }}>No addresses saved yet.</p>
            ) : (
              <select
                value={addressId}
                onChange={e => setAddressId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                style={{ borderColor: '#e5e7eb' }}
              >
                <option value="">Select recipient…</option>
                {addresses.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-xs mt-1 underline"
              style={{ color: 'var(--color-mauve)' }}
            >
              + Add new address
            </button>
            {showAddAddress && (
              <QuickAddAddress onSave={(addr) => {
                addresses.push(addr)
                setAddressId(addr.id)
                setShowAddAddress(false)
              }} />
            )}
          </Section>


          {/* Photos */}
          <Section title={`Photos (${photos.length}/${MAX_PHOTOS})`}>
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-xl p-4 text-center text-sm cursor-pointer transition-colors"
              style={{
                borderColor: isDragActive ? 'var(--color-mauve)' : '#e5e7eb',
                backgroundColor: isDragActive ? 'var(--color-blush)' : 'transparent',
                color: 'var(--color-charcoal-light)',
              }}
            >
              <input {...getInputProps()} />
              {uploadingPhotos ? 'Uploading…' : isDragActive ? 'Drop here!' : 'Drop photos or click to upload'}
            </div>

            {photos.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                  Drag here to reorder · Drag in preview to reposition
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {photos.map((photo, i) => (
                    <div
                      key={photo.id}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragEnter={() => handleDragEnter(i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={e => e.preventDefault()}
                      className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all"
                      style={{
                        aspectRatio: '1',
                        border: dragOverIndex === i ? '2px solid var(--color-mauve)' : '2px solid transparent',
                        opacity: dragIndexRef.current === i ? 0.4 : 1,
                      }}
                    >
                      <div className="absolute top-0.5 left-0.5 bg-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold shadow-sm z-10" style={{ color: 'var(--color-mauve)', fontSize: 9 }}>
                        {i + 1}
                      </div>
                      <img src={photo.url} alt="" className="w-full h-full object-cover" style={{ objectPosition: `${photo.x}% ${photo.y}%` }} />
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center z-10"
                        style={{ fontSize: 10 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Layout — only shows options matching current photo count */}
          {photos.length > 0 && (
            <Section title="Layout">
              {getLayoutsForCount(photos.length).length <= 1 ? (
                <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                  One layout available for {photos.length} photo{photos.length !== 1 ? 's' : ''}.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {getLayoutsForCount(photos.length).map(l => (
                    <button
                      key={l.id}
                      onClick={() => { setLayout(l.id); if (l.recommendedHeight) setPhotoAreaHeight(l.recommendedHeight) }}
                      className="px-2 py-2 rounded-xl border text-xs transition-colors text-left"
                      style={{
                        borderColor: layout === l.id ? 'var(--color-mauve)' : '#e5e7eb',
                        backgroundColor: layout === l.id ? 'var(--color-blush)' : 'white',
                        color: layout === l.id ? 'var(--color-mauve)' : 'var(--color-charcoal)',
                      }}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Font */}
          <Section title="Font style">
            <div className="grid grid-cols-3 gap-2">
              {(['handwritten', 'serif', 'sans'] as FontFamily[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFont(f)}
                  className="py-2 px-1 rounded-xl border text-xs capitalize transition-colors"
                  style={{
                    borderColor: font === f ? 'var(--color-mauve)' : '#e5e7eb',
                    backgroundColor: font === f ? 'var(--color-blush)' : 'white',
                    color: font === f ? 'var(--color-mauve)' : 'var(--color-charcoal)',
                    fontFamily: f === 'handwritten' ? "'Caveat', cursive" : f === 'serif' ? "'Playfair Display', serif" : 'system-ui',
                  }}
                >
                  {f === 'handwritten' ? 'Handwritten' : f === 'serif' ? 'Serif' : 'Sans'}
                </button>
              ))}
            </div>
          </Section>

          {/* Font size */}
          <Section title="Font size">
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as FontSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className="py-2 rounded-xl border text-xs capitalize transition-colors"
                  style={{
                    borderColor: fontSize === s ? 'var(--color-mauve)' : '#e5e7eb',
                    backgroundColor: fontSize === s ? 'var(--color-blush)' : 'white',
                    color: fontSize === s ? 'var(--color-mauve)' : 'var(--color-charcoal)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>

          {/* Letter text */}
          <Section title={`Your letter (${letterText.length}/${MAX_CHARS})`}>
            <textarea
              value={letterText}
              onChange={e => setLetterText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Write your letter here…"
              rows={10}
              className="w-full px-3 py-2 rounded-xl border text-sm outline-none resize-none"
              style={{ borderColor: '#e5e7eb', fontFamily: font === 'handwritten' ? "'Caveat', cursive" : font === 'serif' ? "'Playfair Display', serif" : 'system-ui' }}
            />
          </Section>
        </div>

        {/* RIGHT: preview — never scrolls, always visible */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <p className="text-xs mb-4 font-medium shrink-0" style={{ color: 'var(--color-charcoal-light)' }}>
            Live preview — 8.5 × 11&quot; letter
          </p>
          <div
            style={{
              width: 816 * PREVIEW_SCALE,
              height: 1056 * PREVIEW_SCALE,
              boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
              borderRadius: 4,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <LetterPreview
              ref={previewRef}
              layout={layout}
              photos={photos}
              photoAreaHeight={photoAreaHeight}
              photoAreaWidth={100}
              font={font}
              fontSize={fontSize}
              letterText={letterText}
              senderName={profile.name}
              address={selectedAddress}
              scale={PREVIEW_SCALE}
              onPanPhoto={panPhoto}
              onResizePhotoArea={isSideBySide ? undefined : setPhotoAreaHeight}
            />
          </div>
        </div>
      </div>

      {/* Upgrade Prompt Modal — Single Post users */}
      {showUpgrade && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 20, padding: 40,
            maxWidth: 460, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 10 }}>
              Letter submitted!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24 }}>
              Would you like to send a letter to another recipient this month?
            </p>
            <div style={{
              backgroundColor: 'var(--color-blush)', borderRadius: 16,
              padding: '20px 24px', marginBottom: 24, textAlign: 'left',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-mauve)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Triple Post — $32/mo</p>
              <p style={{ fontSize: 14, color: 'var(--color-charcoal)', marginBottom: 12 }}>Send letters to up to 3 recipients every month.</p>
              <ul style={{ fontSize: 13, color: 'var(--color-charcoal-light)', lineHeight: 1.8, listStyle: 'none', padding: 0, margin: 0 }}>
                <li>✓ 3 letters per month</li>
                <li>✓ Up to 3 different recipients</li>
                <li>✓ Monthly reminder text</li>
                <li>✓ No obligations, cancel anytime</li>
              </ul>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={async () => {
                  const res = await fetch('/api/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: 'triple' }),
                  })
                  const { url, error } = await res.json()
                  if (url) window.location.href = url
                  else alert(error || 'Could not start upgrade.')
                }}
                style={{
                  padding: '13px 0', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  color: 'white', backgroundColor: 'var(--color-mauve)', cursor: 'pointer', border: 'none',
                }}
              >
                Upgrade to Triple Post →
              </button>
              <button
                onClick={() => router.push('/dashboard?submitted=1')}
                style={{
                  padding: '13px 0', borderRadius: 50, fontSize: 14,
                  color: 'var(--color-charcoal)', backgroundColor: 'white',
                  border: '1px solid #e5e7eb', cursor: 'pointer',
                }}
              >
                No thanks, go to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Another Modal */}
      {showSendAnother && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24,
        }}>
          <div style={{
            backgroundColor: 'white', borderRadius: 20, padding: 40,
            maxWidth: 460, width: '100%', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💌</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 10 }}>
              Letter submitted!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 8 }}>
              You have <strong>{maxLetters - submittedCount} letter{maxLetters - submittedCount !== 1 ? 's' : ''}</strong> remaining this month.
            </p>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 28 }}>
              Would you like to send another letter to a different recipient?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={startAnotherLetter}
                style={{
                  padding: '13px 0', borderRadius: 50, fontSize: 14, fontWeight: 600,
                  color: 'white', backgroundColor: 'var(--color-mauve)', cursor: 'pointer', border: 'none',
                }}
              >
                Yes, send another letter →
              </button>
              <button
                onClick={() => router.push('/dashboard?submitted=1')}
                style={{
                  padding: '13px 0', borderRadius: 50, fontSize: 14,
                  color: 'var(--color-charcoal)', backgroundColor: 'white',
                  border: '1px solid #e5e7eb', cursor: 'pointer',
                }}
              >
                No, go to dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Approve Modal */}
      {showReview && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 32,
              maxWidth: 600,
              width: '100%',
              maxHeight: '95vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 6 }}>
                Review Your Letter
              </h2>
              <p style={{ fontSize: 13, color: 'var(--color-charcoal-light)' }}>
                This is exactly what will be printed and mailed to <strong>{selectedAddress?.name}</strong>. Approve to submit.
              </p>
            </div>

            {/* Full preview at larger scale */}
            <div style={{
              width: 816 * 0.62,
              height: 1056 * 0.62,
              boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
              borderRadius: 4,
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <LetterPreview
                layout={layout}
                photos={photos}
                photoAreaHeight={photoAreaHeight}
                photoAreaWidth={100}
                font={font}
                fontSize={fontSize}
                letterText={letterText}
                senderName={profile.name}
                address={selectedAddress}
                scale={0.62}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                onClick={() => setShowReview(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 50, fontSize: 14,
                  border: '1px solid #e5e7eb', color: 'var(--color-charcoal)',
                  backgroundColor: 'white', cursor: 'pointer',
                }}
              >
                ← Go back & edit
              </button>
              <button
                onClick={() => { setShowReview(false); handleSubmit() }}
                disabled={submitting}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 50, fontSize: 14,
                  fontWeight: 600, color: 'white', cursor: 'pointer',
                  backgroundColor: 'var(--color-mauve)',
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? 'Submitting…' : '✓ Approve & Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
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
    <form onSubmit={handleSubmit} className="mt-2 space-y-2 bg-gray-50 p-3 rounded-xl">
      {(['name', 'address_line1', 'city', 'state', 'zip'] as const).map(field => (
        <input
          key={field}
          placeholder={field.replace('_', ' ')}
          value={form[field as keyof typeof form]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          required
          className="w-full px-2 py-1.5 rounded-lg border text-xs outline-none"
          style={{ borderColor: '#e5e7eb' }}
        />
      ))}
      <button type="submit" disabled={saving} className="w-full py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: 'var(--color-mauve)' }}>
        {saving ? 'Saving…' : 'Save address'}
      </button>
    </form>
  )
}
