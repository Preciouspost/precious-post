'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  name: string
  planKey: 'single' | 'triple'
  price: string
  description: string
  features: string[]
  featured?: boolean
  userPlan: string | null
}

const SINGLE_PRICE = 12.95
const TRIPLE_PRICE = 32.00
const UPGRADE_DIFF = (TRIPLE_PRICE - SINGLE_PRICE).toFixed(2)

export function PlanCardClient({ name, planKey, price, description, features, featured, userPlan }: Props) {
  const [loading, setLoading] = useState(false)
  const [upgraded, setUpgraded] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isCurrentPlan = userPlan === planKey
  const canUpgrade = userPlan === 'single' && planKey === 'triple'

  async function handleUpgrade() {
    setLoading(true)
    const res = await fetch('/api/upgrade', { method: 'POST' })
    const { success, error } = await res.json()
    if (success) {
      setUpgraded(true)
      setLoading(false)
    } else {
      alert(error || 'Could not complete upgrade.')
      setLoading(false)
    }
  }

  const btnBg = featured ? 'white' : 'var(--color-mauve)'
  const btnColor = featured ? 'var(--color-mauve)' : 'white'

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        backgroundColor: featured ? 'var(--color-mauve)' : 'white',
        borderColor: featured ? 'var(--color-mauve)' : 'var(--color-blush-dark)',
        color: featured ? 'white' : 'var(--color-charcoal)',
      }}
    >
      <p className="text-sm font-medium mb-1 opacity-80">{name}</p>
      <p className="text-4xl font-bold mb-1">{price}<span className="text-base font-normal opacity-60">/mo</span></p>
      <p className="text-sm mb-5 opacity-70">{description}</p>
      <ul className="space-y-2 text-sm mb-6">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2">
            <span className="opacity-60">✓</span> {f}
          </li>
        ))}
      </ul>

      {/* Upgrade pricing note for single post users */}
      {canUpgrade && !upgraded && (
        <div className="rounded-xl px-3 py-2.5 mb-4 text-xs leading-relaxed" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <p className="font-semibold mb-0.5">First month: only ${UPGRADE_DIFF}</p>
          <p style={{ opacity: 0.8 }}>You'll be charged the difference for your current billing period. Starting next month: $32/mo.</p>
        </div>
      )}

      {upgraded ? (
        <div className="text-center py-2.5 text-sm font-semibold" style={{ color: btnColor }}>
          ✓ Upgraded! <Link href="/dashboard" style={{ color: btnColor, textDecoration: 'underline' }}>Go to dashboard →</Link>
        </div>
      ) : isCurrentPlan ? (
        <div
          className="block text-center px-4 py-2.5 rounded-full text-sm font-semibold"
          style={{ backgroundColor: btnBg, color: btnColor, opacity: 0.5 }}
        >
          Your current plan
        </div>
      ) : canUpgrade ? (
        <>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={loading}
            className="w-full text-center px-4 py-2.5 rounded-full text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: btnBg, color: btnColor }}
          >
            Upgrade to Triple Post →
          </button>

          {showConfirm && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24,
            }}>
              <div style={{
                backgroundColor: 'white', borderRadius: 20, padding: 36,
                maxWidth: 420, width: '100%', textAlign: 'center',
              }}>
                <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: 22, fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 12 }}>
                  Upgrade to Triple Post?
                </h2>
                <p style={{ fontSize: 14, color: 'var(--color-charcoal-light)', marginBottom: 8 }}>
                  You'll be charged <strong>${UPGRADE_DIFF}</strong> today — the difference for the rest of your current billing period.
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-charcoal-light)', marginBottom: 28 }}>
                  Starting next month you'll be billed at the normal <strong>$32/mo</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => { setShowConfirm(false); handleUpgrade() }}
                    disabled={loading}
                    style={{
                      padding: '13px 0', borderRadius: 50, fontSize: 14, fontWeight: 600,
                      color: 'white', backgroundColor: 'var(--color-mauve)',
                      border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Upgrading…' : 'Yes, upgrade to Triple Post'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    style={{
                      padding: '13px 0', borderRadius: 50, fontSize: 14,
                      color: 'var(--color-charcoal)', backgroundColor: 'white',
                      border: '1px solid #e5e7eb', cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Link
          href="/signup"
          className="block text-center px-4 py-2.5 rounded-full text-sm font-semibold transition-colors"
          style={{ backgroundColor: btnBg, color: btnColor }}
        >
          Get started
        </Link>
      )}
    </div>
  )
}
