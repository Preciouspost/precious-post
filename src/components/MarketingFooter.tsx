import Link from 'next/link'
import { PreciousPostLogo } from './Logo'

export function MarketingFooter() {
  return (
    <footer style={{ backgroundColor: 'var(--color-blush)', borderTop: '1px solid var(--color-blush-dark)' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <PreciousPostLogo />
          <div className="flex gap-6 text-sm" style={{ color: 'var(--color-charcoal-light)' }}>
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/our-story" className="hover:underline">Our Story</Link>
            <Link href="/how-it-works" className="hover:underline">How It Works</Link>
            <Link href="/faq" className="hover:underline">FAQ</Link>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm font-medium" style={{ color: 'var(--color-mauve)' }}>Log in</Link>
            <span style={{ color: 'var(--color-charcoal-light)' }}>·</span>
            <Link href="/signup" className="text-sm font-medium" style={{ color: 'var(--color-mauve)' }}>Get Started</Link>
          </div>
        </div>
        <p className="text-xs mt-8" style={{ color: 'var(--color-charcoal-light)' }}>
          © {new Date().getFullYear()} Precious Post · preciouspost.co
        </p>
      </div>
    </footer>
  )
}
