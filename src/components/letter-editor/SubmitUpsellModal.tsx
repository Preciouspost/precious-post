'use client'

import { useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  userPlan: string | null
  monthlyCount: number
  letterId: string
}

async function checkoutSubscription(plan: 'single' | 'triple', letterId: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan, letter_id: letterId }),
  })
  const { url, error } = await res.json()
  if (url) {
    window.location.href = url
  } else {
    alert(error || 'Could not start checkout.')
  }
}

async function checkoutOneTime(letterId: string) {
  const res = await fetch('/api/checkout-one-time', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter_id: letterId }),
  })
  const { url, error } = await res.json()
  if (url) {
    window.location.href = url
  } else {
    alert(error || 'Could not start checkout.')
  }
}

export function SubmitUpsellModal({ isOpen, onClose, userPlan, monthlyCount, letterId }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  if (!isOpen) return null

  const isNoPlan = !userPlan || userPlan === 'one_time'
  const isSingleAtLimit = userPlan === 'single' && monthlyCount >= 1
  const isTripleAtLimit = userPlan === 'triple' && monthlyCount >= 3

  async function handleSubscribe(plan: 'single' | 'triple') {
    setLoading(`subscribe-${plan}`)
    await checkoutSubscription(plan, letterId)
    setLoading(null)
  }

  async function handleOneTime() {
    setLoading('one-time')
    await checkoutOneTime(letterId)
    setLoading(null)
  }

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 60,
    backgroundColor: 'rgba(0,0,0,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  }

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    maxWidth: 460,
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%',
    padding: '13px 0',
    borderRadius: 50,
    fontSize: 14,
    fontWeight: 600,
    color: 'white',
    backgroundColor: 'var(--color-mauve)',
    border: 'none',
    cursor: 'pointer',
    marginBottom: 10,
  }

  const btnSecondary: React.CSSProperties = {
    width: '100%',
    padding: '13px 0',
    borderRadius: 50,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--color-charcoal)',
    backgroundColor: 'white',
    border: '1px solid #e8d8d0',
    cursor: 'pointer',
    marginBottom: 10,
  }

  const btnOutline: React.CSSProperties = {
    width: '100%',
    padding: '13px 0',
    borderRadius: 50,
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--color-charcoal-light)',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  }

  return (
    <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>💌</div>

        {isNoPlan && (
          <>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 8 }}>
              Ready to send?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24, lineHeight: 1.6 }}>
              Subscribe and save — or send this one for $15, no strings attached.
            </p>

            {/* Subscribe options */}
            <div style={{ backgroundColor: 'var(--color-blush)', borderRadius: 14, padding: '16px 20px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-mauve)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                Subscribe &amp; save
              </p>
              <button
                onClick={() => handleSubscribe('single')}
                disabled={!!loading}
                style={{ ...btnPrimary, marginBottom: 8, opacity: loading ? 0.6 : 1 }}
              >
                {loading === 'subscribe-single' ? 'Loading…' : 'Single Post — $12.95/mo (1 letter/month)'}
              </button>
              <button
                onClick={() => handleSubscribe('triple')}
                disabled={!!loading}
                style={{ ...btnSecondary, marginBottom: 0, opacity: loading ? 0.6 : 1 }}
              >
                {loading === 'subscribe-triple' ? 'Loading…' : 'Triple Post — $32/mo (3 letters/month)'}
              </button>
            </div>

            {/* One-time option */}
            <button
              onClick={handleOneTime}
              disabled={!!loading}
              style={{ ...btnSecondary, opacity: loading ? 0.6 : 1, borderColor: '#d1c0b8' }}
            >
              {loading === 'one-time' ? 'Loading…' : 'Just send this one — $15'}
            </button>

            <button onClick={onClose} style={btnOutline}>
              Keep editing
            </button>
          </>
        )}

        {isSingleAtLimit && (
          <>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 8 }}>
              You&apos;ve sent your letter this month!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24, lineHeight: 1.6 }}>
              Want to send this extra letter? Upgrade your plan or pay a one-time fee.
            </p>

            <div style={{ backgroundColor: 'var(--color-blush)', borderRadius: 14, padding: '16px 20px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-mauve)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Triple Post — $32/mo
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-charcoal-light)', marginBottom: 12 }}>
                Send 3 letters every month to anyone you love.
              </p>
              <button
                onClick={() => handleSubscribe('triple')}
                disabled={!!loading}
                style={{ ...btnPrimary, marginBottom: 0, opacity: loading ? 0.6 : 1 }}
              >
                {loading === 'subscribe-triple' ? 'Loading…' : 'Upgrade to Triple Post →'}
              </button>
            </div>

            <button
              onClick={handleOneTime}
              disabled={!!loading}
              style={{ ...btnSecondary, opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'one-time' ? 'Loading…' : 'Just send this extra letter — $15'}
            </button>

            <button onClick={onClose} style={btnOutline}>
              Keep editing
            </button>
          </>
        )}

        {isTripleAtLimit && (
          <>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 8 }}>
              All 3 letters sent this month!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 24, lineHeight: 1.6 }}>
              You&apos;ve used all your letters for this month. Want to send one more anyway?
            </p>

            <button
              onClick={handleOneTime}
              disabled={!!loading}
              style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
            >
              {loading === 'one-time' ? 'Loading…' : 'Send this extra letter — $15'}
            </button>

            <button onClick={onClose} style={btnOutline}>
              Keep editing
            </button>
          </>
        )}
      </div>
    </div>
  )
}
