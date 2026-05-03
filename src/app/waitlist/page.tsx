'use client'

import { useState } from 'react'
import { PreciousPostLogo } from '@/components/Logo'

function toTitleCase(str: string) {
  return str.replace(/\b(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest.toLowerCase())
}

const HEARD_FROM_OPTIONS = [
  { value: 'instagram',     label: 'Instagram' },
  { value: 'tiktok',        label: 'TikTok' },
  { value: 'google',        label: 'Google' },
  { value: 'friend_family', label: 'Friend or family' },
  { value: 'other',         label: 'Other' },
]

export default function WaitlistPage() {
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [phone,     setPhone]     = useState('')
  const [heardFrom, setHeardFrom] = useState('')
  const [story,     setStory]     = useState('')
  const [shareOk,   setShareOk]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res  = await fetch('/api/waitlist', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, phone, heard_from: heardFrom || null, story: story.trim() || null, share_ok: shareOk }),
    })
    const data = await res.json()
    setLoading(false)

    if (data.error) { setError(data.error); return }
    setDone(true)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-blush)' }}>

      {/* Nav */}
      <header className="w-full flex justify-center pt-8 pb-2 px-4">
        <PreciousPostLogo />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          <p className="text-center text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: 'var(--color-mauve)' }}>
            Coming Soon
          </p>

          <h1
            className="text-center text-4xl sm:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}
          >
            Real letters.<br />Real connection.
          </h1>

          <p className="text-center text-base leading-relaxed" style={{ color: 'var(--color-charcoal-light)', maxWidth: 400, margin: '0 auto 2.5rem' }}>
            Precious Post is a monthly subscription that prints and mails beautiful photo letters to the people you love — so staying in touch feels just as special as it should.
          </p>

          {/* Card */}
          <div
            className="rounded-3xl p-8 shadow-md w-full"
            style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}
          >
            {done ? (
              <div className="text-center py-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-5"
                  style={{ backgroundColor: 'var(--color-blush)' }}
                >
                  💌
                </div>
                <h2
                  className="text-2xl font-bold mb-3"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}
                >
                  You're on the list!
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>
                  We'll reach out as soon as Precious Post is ready to launch. In the meantime, tell a friend who deserves more mail. 🤍
                </p>
              </div>
            ) : (
              <>
                <h2
                  className="text-xl font-bold mb-1 text-center"
                  style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}
                >
                  Be the first to know
                </h2>
                <p className="text-sm text-center mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
                  Join the waitlist and we'll notify you the moment we launch.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && <p className="text-sm text-center text-red-500">{error}</p>}

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-charcoal)' }}>
                      Your name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(toTitleCase(e.target.value))}
                      placeholder="Jane Smith"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal)' }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-charcoal)' }}>
                      Email address <span style={{ color: 'var(--color-mauve)' }}>*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal)' }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-charcoal)' }}>
                      Phone number{' '}
                      <span className="font-normal" style={{ color: 'var(--color-charcoal-light)' }}>(optional — for a launch-day text)</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 555 555 5555"
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal)' }}
                    />
                  </div>

                  {/* How did you hear about us */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--color-charcoal)' }}>
                      How did you hear about us?{' '}
                      <span className="font-normal" style={{ color: 'var(--color-charcoal-light)' }}>(optional)</span>
                    </label>
                    <select
                      value={heardFrom}
                      onChange={e => setHeardFrom(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white appearance-none"
                      style={{
                        border: '1px solid var(--color-blush-dark)',
                        backgroundColor: 'var(--color-blush)',
                        color: heardFrom ? 'var(--color-charcoal)' : 'var(--color-charcoal-light)',
                      }}
                    >
                      <option value="">Select one…</option>
                      {HEARD_FROM_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Divider */}
                  <div className="pt-1 pb-1">
                    <div className="border-t" style={{ borderColor: 'var(--color-blush-dark)' }} />
                  </div>

                  {/* Story + share consent */}
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-charcoal)' }}>
                      Who would you send a letter to — and why?{' '}
                      <span className="font-normal" style={{ color: 'var(--color-charcoal-light)' }}>(optional)</span>
                    </label>
                    <p className="text-xs mb-2" style={{ color: 'var(--color-charcoal-light)' }}>
                      We'd love to hear your story. Is it a grandparent, a best friend far away, a child at college?
                    </p>
                    <textarea
                      value={story}
                      onChange={e => setStory(e.target.value)}
                      placeholder="My grandma lives across the country and loves getting photos of the grandkids…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                      style={{ border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal)' }}
                    />

                    {/* Share consent — always visible below the textarea */}
                    <label className="flex items-start gap-3 cursor-pointer rounded-xl p-3 mt-2" style={{ backgroundColor: 'var(--color-blush)' }}>
                      <div className="relative mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={shareOk}
                          onChange={e => setShareOk(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: shareOk ? 'var(--color-mauve)' : 'white',
                            border: `1.5px solid ${shareOk ? 'var(--color-mauve)' : 'var(--color-blush-dark)'}`,
                          }}
                        >
                          {shareOk && (
                            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="2,6 5,9 10,3" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs leading-relaxed" style={{ color: 'var(--color-charcoal)' }}>
                        May we share your response on social media? 🤍 (first name only, no personal details)
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: 'var(--color-mauve)' }}
                  >
                    {loading ? 'Joining…' : 'Join the waitlist →'}
                  </button>

                  <p className="text-xs text-center" style={{ color: 'var(--color-charcoal-light)' }}>
                    No spam, ever. Just a note when we're ready to go.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Feature pills */}
          {!done && (
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {['📸 Real printed photos', '✉️ Mailed to your loved ones', '💌 Every single month'].map(f => (
                <span
                  key={f}
                  className="text-xs font-medium px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'white', color: 'var(--color-charcoal-light)', border: '1px solid var(--color-blush-dark)' }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}

        </div>
      </main>

      <footer className="text-center py-6 text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
        © {new Date().getFullYear()} Precious Post · Made with love
      </footer>

    </div>
  )
}
