'use client'

export function PreciousPostLogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
  const flowerSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-4xl' : 'text-2xl'

  return (
    <div className="flex items-center gap-2 select-none">
      <span className={flowerSize}>🌸</span>
      <span
        className={`font-bold tracking-widest uppercase ${textSize}`}
        style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-mauve)' }}
      >
        Precious Post
      </span>
    </div>
  )
}
