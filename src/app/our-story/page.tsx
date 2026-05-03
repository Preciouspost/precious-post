import Link from 'next/link'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'

export default function OurStoryPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-blush)' }}>
      <MarketingNav />

      <main className="flex-1 px-8 md:px-16 py-14 max-w-6xl mx-auto w-full">

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-wide mb-10" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Our Story
        </h1>

        {/* Two-column: photo left, text right */}
        <div className="flex flex-col md:flex-row gap-10 md:gap-14 items-start">

          {/* Photo */}
          <div className="w-full md:w-[45%] shrink-0 rounded-2xl overflow-hidden" style={{ height: 580 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mimi-hug.jpg"
              alt="Lauren and Mimi"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 8%', display: 'block' }}
            />
          </div>

          {/* Text */}
          <div className="flex-1 space-y-5 text-base leading-relaxed" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)', fontStyle: 'italic' }}>
            <p>My Mimi is the inspiration behind Precious Post.</p>

            <p>
              Cards are Mimi's Super Bowl. Not a single holiday passes that she doesn't mail me a letter. No birthday is shared without happy tears spilled onto a birthday card.
            </p>
            <p>
              I started thinking — when did we decide a text was enough for the people who deserve so much more? We spend so much time curating posts for strangers — why do the people who love us most get the least of us? I looked at my phone and realized my updates had turned into quick text threads. Emojis. Random photos. Things that get lost and disappear.
            </p>

            <p style={{ color: 'var(--color-mauve)' }}>That's why I created Precious Post.</p>

            <p>
              Not to reinvent anything. Just to remind you. Once a month, we prompt you to pause, share what's new, upload your favorite photos, and we send something real to the people who matter most. Because we know you are busy, we handle the printing and the mailing. The convenience of a social post, delivered as postage.
            </p>
            <p>
              We live in such a fast paced digital age — the act of sending something real and personal means more than ever.
            </p>
            <p>
              The gardenia — Mimi's favorite flower — is our logo. Every letter she sends me begins with "Precious Lauren." This whole thing started with her. I wanted every letter that goes out to carry a little piece of that.
            </p>
            <p>You know they deserve more than a text.</p>
            <p>Welcome to Precious Post.</p>

            <div className="pt-4">
              <h2 className="text-xl font-bold mb-4 not-italic" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
                Ready to send your first letter?
              </h2>
              <Link
                href="/signup"
                className="inline-block px-8 py-4 text-base font-semibold rounded-full text-white not-italic"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                Get started →
              </Link>
            </div>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
