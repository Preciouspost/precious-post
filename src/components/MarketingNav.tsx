'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PreciousPostLogo } from './Logo'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Home' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/faq', label: 'FAQ' },
]

export function MarketingNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="w-full bg-white border-b" style={{ borderColor: 'var(--color-blush-dark)' }}>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3">
        <Link href="/" className="shrink-0">
          <PreciousPostLogo />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium transition-colors"
              style={{ color: pathname === l.href ? 'var(--color-mauve)' : 'var(--color-charcoal-light)' }}
            >
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors"
              style={{ color: pathname === '/dashboard' ? 'var(--color-mauve)' : 'var(--color-charcoal-light)' }}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium rounded-full border transition-colors"
              style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium rounded-full border transition-colors"
                style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium rounded-full text-white"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile right side: auth buttons always visible ── */}
        <div className="flex md:hidden items-center gap-2">
          {loggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-sm font-semibold rounded-full text-white"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                Dashboard
              </Link>
              {/* Hamburger for nav links */}
              <button
                onClick={() => setOpen(!open)}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--color-charcoal-light)' }}
                aria-label="Menu"
              >
                {open
                  ? <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  : <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                }
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-semibold rounded-full border"
                style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-3 py-1.5 text-sm font-semibold rounded-full text-white"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile dropdown — nav links only (auth handled above) */}
      {open && (
        <div className="md:hidden border-t px-5 py-3 space-y-1" style={{ borderColor: 'var(--color-blush-dark)', backgroundColor: 'white' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium py-2"
              style={{ color: pathname === l.href ? 'var(--color-mauve)' : 'var(--color-charcoal)' }}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-1 border-t" style={{ borderColor: 'var(--color-blush-dark)' }}>
            <button
              onClick={handleLogout}
              className="block text-sm font-medium py-2 w-full text-left"
              style={{ color: 'var(--color-charcoal-light)' }}
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
