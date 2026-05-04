import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Precious Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F9EDE8',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precious-post.vercel.app'}/logo.png`}
          width={420}
          height={420}
          alt="Precious Post"
          style={{ objectFit: 'contain' }}
        />
      </div>
    ),
    { ...size }
  )
}
