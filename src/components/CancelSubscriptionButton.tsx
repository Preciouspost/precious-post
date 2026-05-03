'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REASONS = [
  { value: 'too_expensive',    label: 'Too expensive' },
  { value: 'not_using_enough', label: "Not sending enough letters to justify it" },
  { value: 'taking_a_break',   label: 'Taking a break' },
  { value: 'recipient_moved',  label: 'Recipient moved or no longer applies' },
  { value: 'technical_issues', label: 'Technical issues with the app' },
  { value: 'other',            label: 'Other' },
]

export function CancelSubscriptionButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [other, setOther] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleCancel() {
    if (!reason) return
    setLoading(true)
    const finalReason = reason === 'other' ? `other: ${other}` : reason
    const res = await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: finalReason }),
    })
    const data = await res.json()
    setLoading(false)
    if (data.error) { alert(data.error); return }
    setDone(true)
    setTimeout(() => {
      setOpen(false)
      router.refresh()
    }, 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs underline mt-2"
        style={{ color: '#9ca3af' }}
      >
        Cancel subscription
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {done ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">💌</p>
                <p className="font-semibold mb-1" style={{ color: 'var(--color-charcoal)' }}>
                  Subscription cancelled
                </p>
                <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>
                  You'll keep access until the end of your billing period.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                  Before you go…
                </h2>
                <p className="text-sm mb-5" style={{ color: 'var(--color-charcoal-light)' }}>
                  We're sorry to see you leave. What's the main reason you're cancelling?
                </p>

                <div className="space-y-2 mb-4">
                  {REASONS.map(r => (
                    <label
                      key={r.value}
                      className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                      style={{
                        borderColor: reason === r.value ? 'var(--color-mauve)' : '#e5e7eb',
                        backgroundColor: reason === r.value ? '#fdf4f6' : 'white',
                      }}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-pink-400"
                      />
                      <span className="text-sm" style={{ color: 'var(--color-charcoal)' }}>{r.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={other}
                    onChange={e => setOther(e.target.value)}
                    placeholder="Tell us more…"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border text-sm outline-none mb-4 resize-none"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={!reason || loading || (reason === 'other' && !other.trim())}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-opacity"
                    style={{ backgroundColor: '#ef4444' }}
                  >
                    {loading ? 'Cancelling…' : 'Confirm cancellation'}
                  </button>
                  <button
                    onClick={() => { setOpen(false); setReason(''); setOther('') }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                    style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
                  >
                    Never mind
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
