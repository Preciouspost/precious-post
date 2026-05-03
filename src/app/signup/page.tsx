'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PreciousPostLogo } from '@/components/Logo'

function toTitleCase(str: string) {
  return str.replace(/\b(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase())
}

export default function SignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [heardFrom, setHeardFrom] = useState('')
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
        data: { full_name: `${firstName} ${lastName}`.trim(), phone, heard_from: heardFrom },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Upsert profile with heard_from (best-effort — works when email confirm is off)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          user_id: user.id,
          name: `${firstName} ${lastName}`.trim(),
          email,
          phone,
          heard_from: heardFrom || null,
        }, { onConflict: 'user_id' })
      }
      router.push('/select-plan')
      router.refresh()
    }
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

          <form onSubmit={handleSignup} className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>First name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(toTitleCase(e.target.value))}
                  placeholder="Jane"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: '#e5e7eb' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>Last name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(toTitleCase(e.target.value))}
                  placeholder="Smith"
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                  style={{ borderColor: '#e5e7eb' }}
                />
              </div>
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
                Phone number
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555 555 5555"
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all"
                style={{ borderColor: '#e5e7eb' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>
                We'll send you a monthly reminder text so you never miss a letter.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>
                How did you hear about us?
              </label>
              <select
                required
                value={heardFrom}
                onChange={e => setHeardFrom(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all bg-white"
                style={{ borderColor: '#e5e7eb', color: heardFrom ? 'var(--color-charcoal)' : '#9ca3af' }}
              >
                <option value="" disabled>Select one…</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="tiktok">TikTok</option>
                <option value="friend_family">Friend / Family</option>
              </select>
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

