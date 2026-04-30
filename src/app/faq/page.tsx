'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MarketingNav } from '@/components/MarketingNav'
import { MarketingFooter } from '@/components/MarketingFooter'

const FAQS = [
  {
    q: 'How much does it cost?',
    a: 'Single Post is $12.95/month and includes 1 letter per month to 1 recipient. Triple Post is $32/month and includes 3 letters per month to up to 3 different recipients. Printing and mailing are included in both plans.',
  },
  {
    q: 'When does my letter get mailed?',
    a: 'Once you submit your letter, Lauren prints and mails it within 2 business days. You\'ll receive an SMS confirmation when your letter is submitted.',
  },
  {
    q: 'What does the letter look like?',
    a: 'Your letter is printed on 8.5×11 paper with your photos arranged in the layout you chose, your personal message in the font you selected, and the Precious Post logo at the bottom. It\'s a full-color, beautiful piece of mail.',
  },
  {
    q: 'Can I send to different people each month?',
    a: 'Yes! You save addresses in your address book and can choose any saved address when starting a new letter. Triple Post customers can send to up to 3 different recipients in a single month.',
  },
  {
    q: 'What if I don\'t use all my letters in a month?',
    a: 'Unused letters don\'t roll over — each month starts fresh. You\'ll receive an SMS reminder on the 1st of each month so you don\'t forget.',
  },
  {
    q: 'Can I edit my letter after submitting?',
    a: 'Once a letter is submitted for printing it can\'t be edited, so take your time in the editor and check the live preview before submitting.',
  },
  {
    q: 'How many photos can I include?',
    a: 'You can upload up to 6 photos per letter. Choose from several layout options including side-by-side, hero with smaller photos, grid, and more.',
  },
  {
    q: 'Can I cancel my subscription?',
    a: 'Yes, you can cancel anytime from your dashboard — no penalties, no questions asked. Your subscription stays active until the end of the billing period.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Right now Precious Post mails within the United States only. International shipping may be added in the future.',
  },
  {
    q: 'How do I get in touch?',
    a: 'Email lauren@preciouspost.co — Lauren personally reads and responds to every message.',
  },
]

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="py-20 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <p className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'var(--color-mauve)' }}>FAQ</p>
        <h1 className="text-4xl md:text-5xl font-bold max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Frequently asked questions
        </h1>
      </section>

      {/* Questions */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {FAQS.map((faq, i) => (
            <FAQItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="py-16 px-6 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
        <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Still have questions?
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--color-charcoal-light)' }}>
          Email <a href="mailto:lauren@preciouspost.co" className="underline" style={{ color: 'var(--color-mauve)' }}>lauren@preciouspost.co</a> — Lauren responds personally.
        </p>
        <Link
          href="/signup"
          className="inline-block px-8 py-4 text-base font-semibold rounded-full text-white"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          Get started →
        </Link>
      </section>

      <MarketingFooter />
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--color-blush-dark)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-sm transition-colors"
        style={{ backgroundColor: open ? 'var(--color-blush)' : 'white', color: 'var(--color-charcoal)' }}
      >
        {q}
        <span className="ml-4 shrink-0 text-lg" style={{ color: 'var(--color-mauve)' }}>{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 py-4 text-sm leading-relaxed border-t" style={{ borderColor: 'var(--color-blush-dark)', color: 'var(--color-charcoal-light)', backgroundColor: 'white' }}>
          {a}
        </div>
      )}
    </div>
  )
}
