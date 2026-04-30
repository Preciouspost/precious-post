import Link from 'next/link'
import { PreciousPostLogo } from '@/components/Logo'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-blush)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <PreciousPostLogo />
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-full border transition-colors"
            style={{ borderColor: 'var(--color-mauve)', color: 'var(--color-mauve)' }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium rounded-full text-white transition-colors"
            style={{ backgroundColor: 'var(--color-mauve)' }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight max-w-3xl" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Send love in the mail,<br />every single month.
        </h1>
        <p className="text-lg sm:text-xl mb-10 max-w-xl" style={{ color: 'var(--color-charcoal-light)' }}>
          Design a beautiful photo letter and we&apos;ll print and mail it to the people you cherish. A real letter, not a notification.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-lg font-semibold rounded-full text-white shadow-md transition-transform hover:scale-105"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          Start sending letters →
        </Link>

        {/* Plans */}
        <div className="mt-20 grid sm:grid-cols-2 gap-6 max-w-2xl w-full">
          <PlanCard
            name="Single Post"
            price="$12.95"
            features={['1 letter per month', '1 recipient', 'Up to 6 photos', 'Print &amp; mail included']}
          />
          <PlanCard
            name="Triple Post"
            price="$32"
            featured
            features={['3 letters per month', 'Up to 3 recipients', 'Up to 6 photos each', 'Print &amp; mail included']}
          />
        </div>
      </main>

      {/* How it works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-10 text-center">
            {[
              { step: '1', title: 'Design your letter', desc: 'Upload photos, pick a layout, and write your message.' },
              { step: '2', title: 'We print & mail it', desc: 'Lauren personally prints on 8.5×11 and mails it for you.' },
              { step: '3', title: 'They receive it', desc: 'Your loved one gets a real, tangible piece of you.' },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: 'var(--color-mauve)' }}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: 'var(--color-charcoal)' }}>{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-6 text-center text-sm" style={{ color: 'var(--color-charcoal-light)', backgroundColor: 'var(--color-blush)' }}>
        © {new Date().getFullYear()} Precious Post · preciouspost.co
      </footer>
    </div>
  )
}

function PlanCard({ name, price, features, featured }: { name: string; price: string; features: string[]; featured?: boolean }) {
  return (
    <div
      className="rounded-2xl p-6 text-left shadow-sm border"
      style={{
        backgroundColor: featured ? 'var(--color-mauve)' : 'white',
        borderColor: featured ? 'var(--color-mauve)' : 'var(--color-blush-dark)',
        color: featured ? 'white' : 'var(--color-charcoal)',
      }}
    >
      <p className="text-sm font-medium mb-1 opacity-80">{name}</p>
      <p className="text-3xl font-bold mb-4">{price}<span className="text-base font-normal opacity-70">/month</span></p>
      <ul className="space-y-2 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="opacity-60">✓</span>
            <span dangerouslySetInnerHTML={{ __html: f }} />
          </li>
        ))}
      </ul>
      <Link
        href="/signup"
        className="mt-6 block text-center px-4 py-2 rounded-full text-sm font-semibold transition-colors"
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
