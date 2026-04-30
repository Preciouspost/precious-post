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
          The whole process takes about 5 minutes. We handle printing and mailing within 2 business days.
        </p>
      </section>

      {/* Steps */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">
          {[
            {
              step: '01',
              title: 'Create your account',
              desc: 'Sign up and choose your plan — Single Post ($12.95/mo) for one recipient, or Triple Post ($32/mo) for up to three. Cancel anytime.',
              icon: '👤',
            },
            {
              step: '02',
              title: 'Add your recipient',
              desc: 'Save your loved one\'s mailing address in your address book. You can save multiple addresses and reuse them each month.',
              icon: '📬',
            },
            {
              step: '03',
              title: 'Design your letter',
              desc: 'Upload up to 6 photos, choose from multiple collage layouts, pick your font style and size, and write your message (up to 2,500 characters). See a live 8.5×11 preview as you go.',
              icon: '✍️',
            },
            {
              step: '04',
              title: 'Submit for printing',
              desc: 'When you\'re happy with your letter, click submit. Your design is locked in and sent to Lauren for printing.',
              icon: '✅',
            },
            {
              step: '05',
              title: 'We print & mail it',
              desc: 'Lauren prints your letter at full 8.5×11 on quality paper and mails it within 2 business days. You\'ll get an SMS confirmation when it\'s submitted.',
              icon: '🖨️',
            },
            {
              step: '06',
              title: 'They receive a real letter',
              desc: 'Your person gets a beautiful, physical letter in the mail — something they can hold, re-read, and keep.',
              icon: '💌',
            },
          ].map((item, i) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: 'var(--color-blush)' }}>
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
