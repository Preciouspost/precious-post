'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PreciousPostLogo } from '@/components/Logo'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Save phone to profile after signup
      router.push('/select-plan')
      router.refresh()
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/select-plan` },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ backgroundColor: 'var(--color-blush)' }}>
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <PreciousPostLogo />
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            Create your account
          </h1>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
            Start sending letters in minutes
          </p>

          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border rounded-xl text-sm font-medium mb-4 transition-colors hover:bg-gray-50"
            style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#e5e7eb' }} />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2" style={{ color: 'var(--color-charcoal-light)' }}>or</span>
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Full name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>
                Phone <span className="font-normal opacity-60">(for monthly reminders)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 555 5555"
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
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-4" style={{ color: 'var(--color-charcoal-light)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-medium underline" style={{ color: 'var(--color-mauve)' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 002.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 01-7.18-2.54H1.83v2.07A8 8 0 008.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 010-3.04V5.41H1.83a8 8 0 000 7.18l2.67-2.07z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 001.83 5.4L4.5 7.49a4.77 4.77 0 014.48-3.3z"/>
    </svg>
  )
}
