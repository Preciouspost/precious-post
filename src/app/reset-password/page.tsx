'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PreciousPostLogo } from '@/components/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-blush)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <PreciousPostLogo />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: 'var(--color-blush)' }}>
                ✓
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                Password updated!
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>
                Redirecting you to your dashboard…
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                Choose a new password
              </h1>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
                Pick something you'll remember.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>New password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-mauve)' }}
                >
                  {loading ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
