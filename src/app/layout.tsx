import type { Metadata } from 'next'
import { Inter, Playfair_Display, Caveat } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat' })

export const metadata: Metadata = {
  title: 'Precious Post',
  description: 'Send handcrafted photo letters to the people you love, every month.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precious-post.vercel.app'),
  openGraph: {
    title: 'Precious Post',
    description: 'Send handcrafted photo letters to the people you love, every month.',
    siteName: 'Precious Post',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Precious Post',
    description: 'Send handcrafted photo letters to the people you love, every month.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${caveat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ fontFamily: 'var(--font-inter)' }}>
        {children}
      </body>
    </html>
  )
}
