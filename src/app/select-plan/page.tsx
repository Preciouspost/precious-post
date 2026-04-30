'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PreciousPostLogo } from '@/components/Logo'
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
    if (error) {
      alert(error)
      setLoading(null)
      return
    }
    router.push(url)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-blush)' }}>
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-10">
          <PreciousPostLogo />
        </div>
        <h1 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Choose your plan
        </h1>
        <p className="text-center text-sm mb-10" style={{ color: 'var(--color-charcoal-light)' }}>
          Cancel anytime. No hidden fees.
        </p>

        <div className="grid sm:grid-cols-2 gap-6">
          {(['single', 'triple'] as const).map((plan) => (
            <div
              key={plan}
              className="bg-white rounded-2xl p-6 shadow-sm border cursor-pointer"
              style={{ borderColor: 'var(--color-blush-dark)' }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal-light)' }}>
                {PLANS[plan].name}
              </p>
              <p className="text-4xl font-bold mb-1" style={{ color: 'var(--color-charcoal)' }}>
                ${PLANS[plan].price}
                <span className="text-base font-normal" style={{ color: 'var(--color-charcoal-light)' }}>/mo</span>
              </p>
              <p className="text-sm mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
                {PLANS[plan].description}
              </p>
              <ul className="space-y-2 text-sm mb-6" style={{ color: 'var(--color-charcoal)' }}>
                <li>✓ Up to 6 photos per letter</li>
                <li>✓ Choose layout &amp; font</li>
                <li>✓ Printed on 8.5×11</li>
                <li>✓ Mailed within 2 business days</li>
                {plan === 'triple' && <li>✓ Up to 3 different recipients</li>}
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
        </div>
      </div>
    </div>
  )
}
