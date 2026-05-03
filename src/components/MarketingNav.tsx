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
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/">
          <PreciousPostLogo />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          style={{ color: 'var(--color-charcoal)' }}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t px-6 py-4 space-y-3" style={{ borderColor: 'var(--color-blush-dark)', backgroundColor: 'white' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium py-1"
              style={{ color: pathname === l.href ? 'var(--color-mauve)' : 'var(--color-charcoal)' }}
            >
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="block text-sm font-medium py-1"
              style={{ color: 'var(--color-charcoal)' }}
            >
              Dashboard
            </Link>
          )}
          <div className="flex gap-2 pt-2">
            {loggedIn ? (
              <button
                onClick={handleLogout}
                className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-full border"
                style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
              >
                Log out
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-full border" style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}>
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-2 text-sm font-medium rounded-full text-white" style={{ backgroundColor: 'var(--color-mauve)' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
