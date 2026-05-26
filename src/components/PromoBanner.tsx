'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function PromoBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const expired = new Date() > new Date('2026-06-14T23:59:59')
    const dismissed = sessionStorage.getItem('promo-banner-dismissed')
    if (!dismissed && !expired) setVisible(true)
  }, [])

  function dismiss() {
    sessionStorage.setItem('promo-banner-dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium text-white relative"
      style={{ backgroundColor: 'var(--color-mauve)' }}
    >
      <span>🎉 Launch special — use code <strong>LAUNCH5</strong> for $5 off your first month</span>
      <Link
        href="/signup"
        className="underline font-semibold whitespace-nowrap"
        style={{ color: 'white' }}
      >
        Get started →
      </Link>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white opacity-70 hover:opacity-100 text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  )
}
