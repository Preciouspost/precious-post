import Link from 'next/link'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'

export default function OurStoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--color-mauve)' }}>Our Story</p>
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto leading-tight" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          My Mimi is the inspiration behind Precious Post.
        </h1>
      </section>

      {/* Story */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-7 text-base leading-relaxed" style={{ color: 'var(--color-charcoal)' }}>
          <p>
            Cards are Mimi's Super Bowl. Not a single holiday passes that she doesn't mail me a letter. No birthday is shared without happy tears spilled onto a birthday card.
          </p>
          <p>
            I started thinking — when did we decide a text was enough for the people who deserve so much more? We spend so much time curating posts for strangers — why do the people who love us most get the least of us? I looked at my phone and realized my updates had turned into quick text threads. Emojis. Random photos. Things that get lost and disappear.
          </p>

          <p className="text-xl font-medium" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-mauve)' }}>
            That's why I created Precious Post.
          </p>

          <p>
            Not to reinvent anything. Just to remind you. Once a month, we prompt you to pause, share what's new, upload your favorite photos, and we send something real to the people who matter most. Because we know you are busy, we handle the printing and the mailing. The convenience of a social post, delivered as postage.
          </p>
          <p>
            We live in such a fast paced digital age — the act of sending something real and personal means more than ever.
          </p>

          <div className="py-2 pl-5" style={{ borderLeft: '3px solid var(--color-blush-dark)' }}>
            <p className="leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>
              The gardenia — Mimi's favorite flower — is our logo. Every letter she sends me begins with <em>"Precious Lauren."</em> This whole thing started with her. I wanted every letter that goes out to carry a little piece of that.
            </p>
          </div>

          <p className="text-lg font-medium" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            You know they deserve more than a text.
          </p>
          <p className="text-lg font-medium" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            Welcome to Precious Post.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Ready to send your first letter?
        </h2>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-semibold rounded-full text-white mt-2"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          Get started →
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
