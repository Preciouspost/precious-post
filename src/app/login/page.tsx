'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PreciousPostLogo } from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setResetLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-blush)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <PreciousPostLogo />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">

          {!showForgot ? (
            <>
              <h1 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                Welcome back
              </h1>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: '#e5e7eb', fontFamily: 'var(--font-inter)' }}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Password</label>
                    <button
                      type="button"
                      onClick={() => { setShowForgot(true); setError('') }}
                      className="text-xs underline"
                      style={{ color: 'var(--color-mauve)' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: 'var(--color-mauve)' }}
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>
            </>
          ) : (
            <>
              <button
                onClick={() => { setShowForgot(false); setResetSent(false); setError('') }}
                className="text-xs mb-4 flex items-center gap-1"
                style={{ color: 'var(--color-charcoal-light)' }}
              >
                ← Back to sign in
              </button>

              <h1 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                Reset password
              </h1>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-4" style={{ backgroundColor: 'var(--color-blush)' }}>
                    💌
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>
                    Check your email — we sent a link to <strong style={{ color: 'var(--color-charcoal)' }}>{email}</strong> to reset your password.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-center mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
                    Enter your email and we'll send you a reset link.
                  </p>
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {error && (
                      <p className="text-red-500 text-sm text-center">{error}</p>
                    )}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Email</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                        style={{ borderColor: '#e5e7eb' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: 'var(--color-mauve)' }}
                    >
                      {resetLoading ? 'Sending…' : 'Send reset link'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}

        </div>
        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-charcoal-light)' }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium underline" style={{ color: 'var(--color-mauve)' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
