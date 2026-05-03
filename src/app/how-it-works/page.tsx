import Link from 'next/link'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--color-mauve)' }}>How It Works</p>
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          From your heart to their mailbox
        </h1>
        <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: 'var(--color-charcoal-light)' }}>
          The whole process takes about 5 minutes. We handle the printing and mailing.
        </p>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {[
            {
              step: '01',
              title: 'Create Your Account',
              desc: 'Sign up and choose your plan — Single Post ($12.95/mo) for one recipient, or Triple Post ($32/mo) for up to three. Cancel anytime.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              ),
            },
            {
              step: '02',
              title: 'Design Your Letter',
              desc: 'Upload up to 8 photos, choose from multiple collage layouts, pick your font style and size, and write your message (up to 2,500 characters). See a live 8.5×11 preview as you go.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Add Your Recipient',
              desc: 'Save your loved one\'s mailing address in your address book. You can save multiple addresses and reuse them each month.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              ),
            },
            {
              step: '04',
              title: 'Submit For Printing',
              desc: 'When you\'re happy with your letter, click submit. Your design is locked in and sent to us for printing.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ),
            },
            {
              step: '05',
              title: 'We Print & Mail It',
              desc: 'We print your letter at full 8.5×11 on quality paper and mail it to your recipient. You\'ll get an SMS confirmation when it\'s submitted.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                </svg>
              ),
            },
            {
              step: '06',
              title: 'They Receive A Real Letter',
              desc: 'Your person gets a beautiful, physical letter in the mail — something they can hold, re-read, and keep.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
              ),
            },
            {
              step: '07',
              title: 'We Remind You Every Month',
              desc: 'Life gets busy — we get it. Each month we send you a text reminder so your letter never slips through the cracks.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              ),
            },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-mauve)' }}>
                {item.icon}
              </div>
              <div>
                <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'var(--color-mauve)' }}>STEP {item.step}</p>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-charcoal)' }}>{item.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: 'var(--color-charcoal-light)' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans reminder */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Ready to get started?
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-charcoal-light)' }}>Plans start at $12.95/month. No contracts.</p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-semibold rounded-full text-white"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          Start your first letter →
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}
