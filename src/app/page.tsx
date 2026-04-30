import Link from 'next/link'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <MarketingNav />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 py-20 md:py-32" style={{ backgroundColor: 'var(--color-blush)' }}>
        <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--color-mauve)' }}>
          Monthly Photo Letters
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Send love in the mail,<br />every single month.
        </h1>
        <p className="text-lg mb-10 max-w-xl" style={{ color: 'var(--color-charcoal-light)' }}>
          Design a beautiful photo letter and we'll print and mail it to the people you cherish. A real letter, not a notification.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="px-8 py-4 text-base font-semibold rounded-full text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-mauve)' }}
          >
            Start sending letters →
          </Link>
          <Link
            href="/how-it-works"
            className="px-8 py-4 text-base font-semibold rounded-full border transition-colors"
            style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            Simple, honest pricing
          </h2>
          <p className="text-center mb-12 text-sm" style={{ color: 'var(--color-charcoal-light)' }}>Cancel anytime. No hidden fees.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            <PlanCard
              name="Single Post"
              price="$12.95"
              description="Perfect for staying connected with one special person."
              features={['1 letter per month', '1 recipient', 'Up to 6 photos', 'Printed & mailed for you']}
            />
            <PlanCard
              name="Triple Post"
              price="$32"
              featured
              description="Spread the love to everyone who matters most."
              features={['3 letters per month', 'Up to 3 recipients', 'Up to 6 photos each', 'Printed & mailed for you']}
            />
          </div>
        </div>
      </section>

      {/* Quote / warmth section */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--color-blush)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-3xl font-medium leading-relaxed" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            &ldquo;In a world of texts and emails, a real letter says<br />
            <em>I took the time for you.</em>&rdquo;
          </p>
          <p className="mt-6 text-sm" style={{ color: 'var(--color-charcoal-light)' }}>— Lauren, founder of Precious Post</p>
        </div>
      </section>

      {/* How it works preview */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-10 text-center">
            {[
              { step: '1', icon: '📸', title: 'Design your letter', desc: 'Upload photos, pick a layout, and write your message in minutes.' },
              { step: '2', icon: '🖨️', title: 'We print & mail it', desc: 'Lauren personally prints on 8.5×11 and mails it within 2 business days.' },
              { step: '3', icon: '💌', title: 'They receive it', desc: 'Your loved one gets a real, tangible piece of you in their mailbox.' },
            ].map(item => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--color-blush)' }}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-charcoal)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/how-it-works" className="text-sm font-medium underline" style={{ color: 'var(--color-mauve)' }}>
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--color-mauve)' }}>
        <h2 className="text-3xl font-bold mb-4 text-white" style={{ fontFamily: 'var(--font-playfair)' }}>
          Ready to brighten someone's day?
        </h2>
        <p className="text-white opacity-80 mb-8 max-w-md mx-auto">
          Join Precious Post and start sending letters that actually get kept.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-semibold rounded-full transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'white', color: 'var(--color-mauve)' }}
        >
          Get started today
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}

function PlanCard({ name, price, description, features, featured }: {
  name: string; price: string; description: string; features: string[]; featured?: boolean
}) {
  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        backgroundColor: featured ? 'var(--color-mauve)' : 'white',
        borderColor: featured ? 'var(--color-mauve)' : 'var(--color-blush-dark)',
        color: featured ? 'white' : 'var(--color-charcoal)',
      }}
    >
      <p className="text-sm font-medium mb-1 opacity-80">{name}</p>
      <p className="text-4xl font-bold mb-1">{price}<span className="text-base font-normal opacity-60">/mo</span></p>
      <p className="text-sm mb-5 opacity-70">{description}</p>
      <ul className="space-y-2 text-sm mb-6">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2">
            <span className="opacity-60">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className="block text-center px-4 py-2.5 rounded-full text-sm font-semibold transition-colors"
        style={{
          backgroundColor: featured ? 'white' : 'var(--color-mauve)',
          color: featured ? 'var(--color-mauve)' : 'white',
        }}
      >
        Get started
      </Link>
    </div>
  )
}
