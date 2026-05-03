'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ManageBillingButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (url) {
      window.location.href = url
    } else {
      alert(error || 'Could not open billing portal.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm transition-colors disabled:opacity-50"
      style={{ color: 'var(--color-charcoal-light)' }}
    >
      {loading ? '…' : 'Manage subscription & billing'}
    </button>
  )
}
