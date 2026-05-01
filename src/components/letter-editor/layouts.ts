export interface SlotDef {
  left: number   // % of container width
  top: number    // % of container height
  width: number  // % of container width
  height: number // % of container height
}

export interface LayoutDef {
  id: string
  name: string
  photoCount: number
  slots: SlotDef[]
  // Auto-applied photo area height (%) when this layout is selected.
  // Calculated so slots land near 4:3 or square proportions on an 8.5×11 page.
  recommendedHeight?: number
  // When set, photos and text are rendered side-by-side instead of stacked
  textPosition?: 'right' | 'left'
  // Photo column width as % of content area (only used when textPosition is set)
  photoWidth?: number
}

// Build a uniform grid of n columns × m rows with a small gap
function grid(cols: number, rows: number): SlotDef[] {
  const G = 1.5 // gap %
  const w = (100 - G * (cols - 1)) / cols
  const h = (100 - G * (rows - 1)) / rows
  const slots: SlotDef[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        left: c * (w + G),
        top: r * (h + G),
        width: w,
        height: h,
      })
    }
  }
  return slots
}

export const LAYOUTS: LayoutDef[] = [
  // ── 1 photo ──────────────────────────────────────────
  {
    id: 'single-full',
    name: 'Full Width',
    photoCount: 1,
    recommendedHeight: 57,  // 736px / 1.33 ≈ 553px → 57% of content height
    slots: [{ left: 0, top: 0, width: 100, height: 100 }],
  },
  {
    id: 'single-centered',
    name: 'Centered',
    photoCount: 1,
    recommendedHeight: 47,
    slots: [{ left: 12.5, top: 5, width: 75, height: 90 }],
  },

  // ── 2 photos ─────────────────────────────────────────
  {
    id: 'two-side',
    name: 'Side by Side',
    photoCount: 2,
    recommendedHeight: 28,  // 362px / 1.33 ≈ 272px → 28%
    slots: grid(2, 1),
  },
  {
    id: 'two-stacked',
    name: 'Stacked',
    photoCount: 2,
    recommendedHeight: 65,
    slots: grid(1, 2),
  },
  {
    id: 'two-wide-tall',
    name: 'Wide + Tall',
    photoCount: 2,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 60 },
      { left: 25, top: 61.5, width: 50, height: 38.5 },
    ],
  },
  {
    id: 'two-asymmetric',
    name: 'Asymmetric',
    photoCount: 2,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 60, height: 100 },
      { left: 61.5, top: 12, width: 38.5, height: 76 },
    ],
  },

  // ── 3 photos ─────────────────────────────────────────
  {
    id: 'three-across',
    name: 'Three Across',
    photoCount: 3,
    recommendedHeight: 30,  // 238px slot width → ~square at 24%, nudge up for breathing room
    slots: grid(3, 1),
  },
  {
    id: 'hero-2-stacked',
    name: 'Hero + 2 Right',
    photoCount: 3,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 64.25, height: 100 },
      { left: 65.75, top: 0, width: 34.25, height: 49.25 },
      { left: 65.75, top: 50.75, width: 34.25, height: 49.25 },
    ],
  },
  {
    id: 'hero-2-below',
    name: 'Hero + 2 Below',
    photoCount: 3,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 64.25 },
      { left: 0, top: 65.75, width: 49.25, height: 34.25 },
      { left: 50.75, top: 65.75, width: 49.25, height: 34.25 },
    ],
  },
  {
    id: 'three-hero-bottom',
    name: '2 Top + Hero',
    photoCount: 3,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 49.25, height: 34.25 },
      { left: 50.75, top: 0, width: 49.25, height: 34.25 },
      { left: 0, top: 35.75, width: 100, height: 64.25 },
    ],
  },
  {
    id: 'mosaic-3-balanced',
    name: 'Mosaic',
    photoCount: 3,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 100 },
      { left: 58.5, top: 0, width: 41.5, height: 49.25 },
      { left: 58.5, top: 50.75, width: 41.5, height: 49.25 },
    ],
  },

  // ── 4 photos ─────────────────────────────────────────
  {
    id: 'grid-2x2',
    name: '2 × 2 Grid',
    photoCount: 4,
    recommendedHeight: 57,  // 2 rows of 4:3 slots: 362px wide → 272px tall each → 57%
    slots: grid(2, 2),
  },
  {
    id: 'four-across',
    name: 'Four Across',
    photoCount: 4,
    recommendedHeight: 25,  // 176px slot width → near-square
    slots: grid(4, 1),
  },
  {
    id: 'hero-3-below',
    name: 'Hero + 3 Below',
    photoCount: 4,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 64.25 },
      { left: 0, top: 65.75, width: 32.5, height: 34.25 },
      { left: 33.75, top: 65.75, width: 32.5, height: 34.25 },
      { left: 67.5, top: 65.75, width: 32.5, height: 34.25 },
    ],
  },
  {
    id: 'four-triptych',
    name: 'Triptych',
    photoCount: 4,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 55 },
      { left: 0, top: 56.5, width: 32.33, height: 43.5 },
      { left: 33.83, top: 56.5, width: 32.33, height: 43.5 },
      { left: 67.17, top: 56.5, width: 32.83, height: 43.5 },
    ],
  },
  {
    id: 'mosaic-4-featured',
    name: 'Featured',
    photoCount: 4,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 100 },
      { left: 58.5, top: 0, width: 41.5, height: 32 },
      { left: 58.5, top: 33.5, width: 41.5, height: 32 },
      { left: 58.5, top: 67, width: 41.5, height: 33 },
    ],
  },
  {
    id: 'mosaic-4-right-hero',
    name: 'Featured Right',
    photoCount: 4,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 41.5, height: 32 },
      { left: 0, top: 33.5, width: 41.5, height: 32 },
      { left: 0, top: 67, width: 41.5, height: 33 },
      { left: 43, top: 0, width: 57, height: 100 },
    ],
  },

  // ── 5 photos ─────────────────────────────────────────
  {
    id: 'hero-4-below',
    name: 'Hero + 4 Below',
    photoCount: 5,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 60 },
      ...grid(4, 1).map(s => ({ ...s, top: 61.5, height: 38.5 })),
    ],
  },
  {
    id: 'two-three',
    name: '2 + 3 Rows',
    photoCount: 5,
    recommendedHeight: 57,
    slots: [
      ...grid(2, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(3, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },
  {
    id: 'mosaic-5-magazine',
    name: 'Magazine',
    photoCount: 5,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 65 },
      { left: 58.5, top: 0, width: 41.5, height: 31.75 },
      { left: 58.5, top: 33.25, width: 41.5, height: 31.75 },
      { left: 0, top: 66.5, width: 49.25, height: 33.5 },
      { left: 50.75, top: 66.5, width: 49.25, height: 33.5 },
    ],
  },
  {
    id: 'mosaic-5-left-hero',
    name: 'Split + Row',
    photoCount: 5,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 49.25 },
      { left: 58.5, top: 0, width: 41.5, height: 49.25 },
      { left: 0, top: 50.75, width: 32.33, height: 49.25 },
      { left: 33.83, top: 50.75, width: 32.33, height: 49.25 },
      { left: 67.17, top: 50.75, width: 32.83, height: 49.25 },
    ],
  },

  // ── 6 photos ─────────────────────────────────────────
  {
    id: 'grid-3x2',
    name: '3 × 2 Grid',
    photoCount: 6,
    recommendedHeight: 50,  // 3 cols×2 rows → 238px slots → near-square at 50%
    slots: grid(3, 2),
  },
  {
    id: 'grid-2x3',
    name: '2 × 3 Grid',
    photoCount: 6,
    recommendedHeight: 65,
    slots: grid(2, 3),
  },
  {
    id: 'six-hero-stripe',
    name: 'Hero + Stripe',
    photoCount: 6,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 50 },
      ...grid(5, 1).map(s => ({ ...s, top: 51.5, height: 48.5 })),
    ],
  },
  {
    id: 'six-two-rows-asymmetric',
    name: 'Asymmetric Rows',
    photoCount: 6,
    recommendedHeight: 50,
    slots: [
      { left: 0, top: 0, width: 60, height: 49.25 },
      { left: 61.5, top: 0, width: 38.5, height: 49.25 },
      ...grid(4, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },
  {
    id: 'mosaic-6-magazine',
    name: 'Magazine',
    photoCount: 6,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 55 },
      { left: 58.5, top: 0, width: 41.5, height: 26.75 },
      { left: 58.5, top: 28.25, width: 41.5, height: 26.75 },
      { left: 0, top: 56.5, width: 32.33, height: 43.5 },
      { left: 33.83, top: 56.5, width: 32.33, height: 43.5 },
      { left: 67.17, top: 56.5, width: 32.83, height: 43.5 },
    ],
  },

  // ── 7 photos ─────────────────────────────────────────
  {
    id: 'three-four',
    name: '3 + 4 Rows',
    photoCount: 7,
    recommendedHeight: 50,
    slots: [
      ...grid(3, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(4, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },
  {
    id: 'four-three',
    name: '4 + 3 Rows',
    photoCount: 7,
    recommendedHeight: 50,
    slots: [
      ...grid(4, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(3, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },
  {
    id: 'seven-hero-six',
    name: 'Hero + 6',
    photoCount: 7,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 45 },
      ...grid(6, 1).map(s => ({ ...s, top: 46.5, height: 53.5 })),
    ],
  },
  {
    id: 'seven-mosaic',
    name: 'Mosaic',
    photoCount: 7,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 55 },
      { left: 58.5, top: 0, width: 41.5, height: 26.75 },
      { left: 58.5, top: 28.25, width: 41.5, height: 26.75 },
      ...grid(4, 1).map(s => ({ ...s, top: 56.5, height: 43.5 })),
    ],
  },

  // ── 8 photos ─────────────────────────────────────────
  {
    id: 'grid-4x2',
    name: '4 × 2 Grid',
    photoCount: 8,
    recommendedHeight: 37,  // 176px slots × 2 rows → near-square
    slots: grid(4, 2),
  },
  {
    id: 'grid-2x4',
    name: '2 × 4 Grid',
    photoCount: 8,
    recommendedHeight: 65,
    slots: grid(2, 4),
  },
  {
    id: 'eight-hero-seven',
    name: 'Hero + 7',
    photoCount: 8,
    recommendedHeight: 55,
    slots: [
      { left: 0, top: 0, width: 100, height: 50 },
      ...grid(7, 1).map(s => ({ ...s, top: 51.5, height: 48.5 })),
    ],
  },
  {
    id: 'eight-mosaic',
    name: 'Mosaic',
    photoCount: 8,
    recommendedHeight: 60,
    slots: [
      { left: 0, top: 0, width: 57, height: 55 },
      { left: 58.5, top: 0, width: 41.5, height: 26.75 },
      { left: 58.5, top: 28.25, width: 41.5, height: 26.75 },
      ...grid(5, 1).map(s => ({ ...s, top: 56.5, height: 43.5 })),
    ],
  },

  // ── Side-by-side: 1 photo ─────────────────────────────
  {
    id: 'photo-left-text-right',
    name: 'Photo | Text',
    photoCount: 1,
    textPosition: 'right',
    photoWidth: 52,
    slots: [{ left: 0, top: 0, width: 100, height: 100 }],
  },
  {
    id: 'photo-right-text-left',
    name: 'Text | Photo',
    photoCount: 1,
    textPosition: 'left',
    photoWidth: 52,
    slots: [{ left: 0, top: 0, width: 100, height: 100 }],
  },

  // ── Side-by-side: 2 photos ────────────────────────────
  {
    id: 'two-stack-left-text-right',
    name: '2 Photos | Text',
    photoCount: 2,
    textPosition: 'right',
    photoWidth: 48,
    slots: grid(1, 2),
  },
  {
    id: 'text-left-two-stack-right',
    name: 'Text | 2 Photos',
    photoCount: 2,
    textPosition: 'left',
    photoWidth: 48,
    slots: grid(1, 2),
  },
  {
    id: 'two-side-text-below-left',
    name: '2 Side | Text',
    photoCount: 2,
    textPosition: 'right',
    photoWidth: 55,
    slots: grid(2, 1),
  },

  // ── Side-by-side: 3 photos ────────────────────────────
  {
    id: 'three-col-left-text-right',
    name: '3 Photos | Text',
    photoCount: 3,
    textPosition: 'right',
    photoWidth: 50,
    slots: grid(1, 3),
  },
  {
    id: 'text-left-three-col-right',
    name: 'Text | 3 Photos',
    photoCount: 3,
    textPosition: 'left',
    photoWidth: 50,
    slots: grid(1, 3),
  },
  {
    id: 'hero-text-right',
    name: 'Hero | Text',
    photoCount: 3,
    textPosition: 'right',
    photoWidth: 52,
    slots: [
      { left: 0, top: 0, width: 100, height: 64.25 },
      { left: 0, top: 65.75, width: 49.25, height: 34.25 },
      { left: 50.75, top: 65.75, width: 49.25, height: 34.25 },
    ],
  },

  // ── Side-by-side: 4 photos ────────────────────────────
  {
    id: 'grid-2x2-left-text-right',
    name: '2×2 | Text',
    photoCount: 4,
    textPosition: 'right',
    photoWidth: 52,
    slots: grid(2, 2),
  },
  {
    id: 'text-left-grid-2x2-right',
    name: 'Text | 2×2',
    photoCount: 4,
    textPosition: 'left',
    photoWidth: 52,
    slots: grid(2, 2),
  },
  {
    id: 'four-col-left-text-right',
    name: '4 Tall | Text',
    photoCount: 4,
    textPosition: 'right',
    photoWidth: 55,
    slots: grid(2, 2),
  },
]

export function getLayoutsForCount(count: number): LayoutDef[] {
  if (count === 0) return []
  return LAYOUTS.filter(l => l.photoCount === count)
}

export function getDefaultLayout(count: number): LayoutDef | null {
  const options = getLayoutsForCount(count)
  return options[0] ?? null
}

export function getLayout(id: string): LayoutDef | null {
  return LAYOUTS.find(l => l.id === id) ?? null
}
