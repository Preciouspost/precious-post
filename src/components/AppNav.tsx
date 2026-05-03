'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { PreciousPostLogo } from './Logo'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/account', label: 'My Account' },
  { href: '/faq', label: 'FAQ' },
]

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setIsAdmin(data.user?.email === 'lauren@preciouspost.co')
    })
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-white border-b" style={{ borderColor: 'var(--color-blush-dark)' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard">
          <PreciousPostLogo size="sm" />
        </Link>

        {/* Desktop */}
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
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: 'var(--color-mauve)', color: 'white' }}
            >
              Admin
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="text-sm transition-colors"
            style={{ color: 'var(--color-charcoal-light)' }}
          >
            Log out
          </button>
        </div>

        {/* Mobile */}
        <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} style={{ color: 'var(--color-charcoal)' }}>
          {menuOpen ? (
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

      {menuOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-2" style={{ borderColor: 'var(--color-blush-dark)' }}>
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium py-1.5"
              style={{ color: pathname === l.href ? 'var(--color-mauve)' : 'var(--color-charcoal)' }}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="block text-sm font-semibold py-1.5" style={{ color: 'var(--color-mauve)' }}>
              Admin Dashboard
            </Link>
          )}
          <button onClick={handleLogout} className="block text-sm py-1.5 w-full text-left" style={{ color: 'var(--color-charcoal-light)' }}>
            Log out
          </button>
        </div>
      )}
    </nav>
  )
}
