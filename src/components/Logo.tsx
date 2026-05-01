import Image from 'next/image'

type Variant = 'default' | 'white' | 'blush'

const VARIANTS: Record<Variant, string> = {
  default: '/logo.svg',
  white: '/logo-white.svg',
  blush: '/logo-blush.svg',
}

const SIZES = {
  sm: 80,
  md: 110,
  lg: 160,
}

export function PreciousPostLogo({
  size = 'md',
  variant = 'default',
}: {
  size?: 'sm' | 'md' | 'lg'
  variant?: Variant
}) {
  const px = SIZES[size]
  return (
    <Image
      src={VARIANTS[variant]}
      alt="Precious Post"
      width={px}
      height={px}
      style={{ objectFit: 'contain' }}
      priority
    />
  )
}
