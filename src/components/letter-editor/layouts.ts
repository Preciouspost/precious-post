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
    slots: [{ left: 0, top: 0, width: 100, height: 100 }],
  },

  // ── 2 photos ─────────────────────────────────────────
  {
    id: 'two-side',
    name: 'Side by Side',
    photoCount: 2,
    slots: grid(2, 1),
  },
  {
    id: 'two-stacked',
    name: 'Stacked',
    photoCount: 2,
    slots: grid(1, 2),
  },

  // ── 3 photos ─────────────────────────────────────────
  {
    id: 'three-across',
    name: 'Three Across',
    photoCount: 3,
    slots: grid(3, 1),
  },
  {
    id: 'hero-2-stacked',
    name: 'Hero + 2 Right',
    photoCount: 3,
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
    slots: [
      { left: 0, top: 0, width: 100, height: 64.25 },
      { left: 0, top: 65.75, width: 49.25, height: 34.25 },
      { left: 50.75, top: 65.75, width: 49.25, height: 34.25 },
    ],
  },

  // ── 4 photos ─────────────────────────────────────────
  {
    id: 'grid-2x2',
    name: '2 × 2 Grid',
    photoCount: 4,
    slots: grid(2, 2),
  },
  {
    id: 'four-across',
    name: 'Four Across',
    photoCount: 4,
    slots: grid(4, 1),
  },
  {
    id: 'hero-3-below',
    name: 'Hero + 3 Below',
    photoCount: 4,
    slots: [
      { left: 0, top: 0, width: 100, height: 64.25 },
      { left: 0, top: 65.75, width: 32.5, height: 34.25 },
      { left: 33.75, top: 65.75, width: 32.5, height: 34.25 },
      { left: 67.5, top: 65.75, width: 32.5, height: 34.25 },
    ],
  },

  // ── 5 photos ─────────────────────────────────────────
  {
    id: 'hero-4-below',
    name: 'Hero + 4 Below',
    photoCount: 5,
    slots: [
      { left: 0, top: 0, width: 100, height: 60 },
      ...grid(4, 1).map(s => ({ ...s, top: 61.5, height: 38.5 })),
    ],
  },
  {
    id: 'two-three',
    name: '2 + 3 Rows',
    photoCount: 5,
    slots: [
      ...grid(2, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(3, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },

  // ── 6 photos ─────────────────────────────────────────
  {
    id: 'grid-3x2',
    name: '3 × 2 Grid',
    photoCount: 6,
    slots: grid(3, 2),
  },
  {
    id: 'grid-2x3',
    name: '2 × 3 Grid',
    photoCount: 6,
    slots: grid(2, 3),
  },

  // ── 7 photos ─────────────────────────────────────────
  {
    id: 'three-four',
    name: '3 + 4 Rows',
    photoCount: 7,
    slots: [
      ...grid(3, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(4, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },
  {
    id: 'four-three',
    name: '4 + 3 Rows',
    photoCount: 7,
    slots: [
      ...grid(4, 1).map(s => ({ ...s, height: 49.25 })),
      ...grid(3, 1).map(s => ({ ...s, top: 50.75, height: 49.25 })),
    ],
  },

  // ── 8 photos ─────────────────────────────────────────
  {
    id: 'grid-4x2',
    name: '4 × 2 Grid',
    photoCount: 8,
    slots: grid(4, 2),
  },
  {
    id: 'grid-2x4',
    name: '2 × 4 Grid',
    photoCount: 8,
    slots: grid(2, 4),
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
