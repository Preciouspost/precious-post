'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PreciousPostLogo } from '@/components/Logo'
import { AppNav } from '@/components/AppNav'
import { PLANS } from '@/lib/utils'

export default function SelectPlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function selectPlan(plan: 'single' | 'triple') {
    setLoading(plan)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    if (error || !url) {
      alert(error || 'Something went wrong. Please try again.')
      setLoading(null)
      return
    }
    window.location.href = url
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-blush)' }}>
      <AppNav />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Choose your plan
        </h1>
        <p className="text-center text-sm mb-10" style={{ color: 'var(--color-charcoal-light)' }}>
          The gift that arrives every month.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {(['single', 'triple'] as const).map((plan) => (
            <div
              key={plan}
              className="bg-white rounded-2xl p-6 shadow-sm border"
              style={{ borderColor: 'var(--color-blush-dark)' }}
            >
              <p className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-3" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-mauve)' }}>
                Monthly subscription
              </p>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal-light)' }}>
                {PLANS[plan].name}
              </p>
              <p className="text-4xl font-bold mb-4" style={{ color: 'var(--color-charcoal)' }}>
                ${PLANS[plan].price}
                <span className="text-base font-normal" style={{ color: 'var(--color-charcoal-light)' }}>/mo</span>
              </p>
              <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--color-charcoal)' }}>
                <li>✓ Up to 8 photos per letter</li>
                <li>✓ Choose layout &amp; font</li>
                <li>✓ Printed &amp; mailed for you</li>
                {plan === 'triple' && <li>✓ Up to 3 different recipients</li>}
                <li>✓ Monthly reminder text</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <button
                onClick={() => selectPlan(plan)}
                disabled={loading !== null}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                {loading === plan ? 'Redirecting…' : `Choose ${PLANS[plan].name}`}
              </button>
            </div>
          ))}

          {/* One & Done */}
          <div
            className="bg-white rounded-2xl p-6 shadow-sm border"
            style={{ borderColor: 'var(--color-blush-dark)' }}
          >
            <p className="text-xs font-semibold px-2.5 py-1 rounded-full inline-block mb-3" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-mauve)' }}>
              One-time payment
            </p>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal-light)' }}>One &amp; Done</p>
            <p className="text-4xl font-bold mb-4" style={{ color: 'var(--color-charcoal)' }}>
              $15<span className="text-base font-normal" style={{ color: 'var(--color-charcoal-light)' }}> one time</span>
            </p>
            <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--color-charcoal)' }}>
              <li>✓ 1 letter, one time</li>
              <li>✓ No subscription</li>
              <li>✓ Up to 8 photos</li>
              <li>✓ Printed &amp; mailed for you</li>
            </ul>
            <button
              onClick={() => router.push('/letters/new')}
              disabled={loading !== null}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ backgroundColor: 'var(--color-mauve)' }}
            >
              Send a letter →
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
