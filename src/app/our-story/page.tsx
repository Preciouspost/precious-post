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
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Born from a desire to stay close
        </h1>
      </section>

      {/* Story */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-8 text-base leading-relaxed" style={{ color: 'var(--color-charcoal)' }}>
          <p>
            Precious Post started with a simple feeling — the ache of distance. Whether it's a grandparent in another state, a best friend across the country, or a parent who doesn't text much, there are people in our lives we love deeply but don't connect with the way we want to.
          </p>
          <p>
            Social media feels too casual. A text disappears in seconds. But a letter? A letter gets kept. It gets re-read. It gets pinned to a refrigerator or tucked into a drawer where it lives for years.
          </p>
          <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '1.25rem', color: 'var(--color-mauve)' }}>
            "I wanted to make sending a real, beautiful letter as easy as posting a photo."
          </p>
          <p>
            Precious Post is a one-woman operation, run by Lauren. Every letter that comes through is personally printed and mailed by hand. That's not a limitation — it's the point. Every letter gets real attention, real care, and real postage.
          </p>
          <p>
            You design it in minutes. We handle the rest. Your person gets something beautiful in their mailbox.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--color-blush)' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            What we believe
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: '💌', title: 'Letters matter', desc: 'Physical mail creates a connection that digital messages simply can\'t replicate.' },
              { icon: '🌸', title: 'Simplicity is a gift', desc: 'Making it easy to send love means more people actually do it.' },
              { icon: '🤍', title: 'Personal over perfect', desc: 'Your words and your photos are what make a letter precious — not perfection.' },
            ].map(v => (
              <div key={v.title} className="text-center">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center bg-white">
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
