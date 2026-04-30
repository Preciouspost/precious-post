import { LayoutId } from '@/types'

export interface LayoutDef {
  id: LayoutId
  name: string
  description: string
  maxPhotos: number
  // Grid areas as CSS grid-template-areas, normalized to 12 columns
  areas: string[][]
}

export const LAYOUTS: LayoutDef[] = [
  {
    id: 'three-across',
    name: 'Three Across',
    description: '3 photos in a row',
    maxPhotos: 3,
    areas: [['A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'C', 'C', 'C', 'C']],
  },
  {
    id: 'hero-2-stacked',
    name: 'Hero + 2 Stacked',
    description: '1 large photo with 2 stacked beside',
    maxPhotos: 3,
    areas: [
      ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B'],
      ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'C', 'C', 'C', 'C'],
    ],
  },
  {
    id: 'hero-2-below',
    name: 'Hero + 2 Below',
    description: '1 large photo above 2 smaller',
    maxPhotos: 3,
    areas: [
      ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
      ['B', 'B', 'B', 'B', 'B', 'B', 'C', 'C', 'C', 'C', 'C', 'C'],
    ],
  },
  {
    id: 'grid-2x2',
    name: '2×2 Grid',
    description: '4 photos in a square grid',
    maxPhotos: 4,
    areas: [
      ['A', 'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B', 'B'],
      ['C', 'C', 'C', 'C', 'C', 'C', 'D', 'D', 'D', 'D', 'D', 'D'],
    ],
  },
  {
    id: 'two-side-by-side',
    name: 'Side by Side',
    description: '2 photos equal width',
    maxPhotos: 2,
    areas: [['A', 'A', 'A', 'A', 'A', 'A', 'B', 'B', 'B', 'B', 'B', 'B']],
  },
  {
    id: 'full-single',
    name: 'Full Width',
    description: '1 photo spanning full width',
    maxPhotos: 1,
    areas: [['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A']],
  },
]

export function getLayout(id: LayoutId): LayoutDef {
  return LAYOUTS.find(l => l.id === id) ?? LAYOUTS[2]
}
