export type Plan = 'single' | 'triple'
export type LetterStatus = 'draft' | 'submitted' | 'printed' | 'mailed'
export type FontFamily = 'handwritten' | 'serif' | 'sans'
export type FontSize = 'small' | 'medium' | 'large'
export type LayoutId = string

export interface Profile {
  id: string
  user_id: string
  name: string
  email: string
  plan: Plan | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_subscription_status: string | null
  phone: string | null
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  name: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  zip: string
  country: string
  created_at: string
}

export interface PhotoItem {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  zoom?: number  // 1.0 = default fill, >1 = zoomed in
}

export interface Letter {
  id: string
  user_id: string
  address_id: string | null
  address?: Address
  photos: PhotoItem[]
  layout: LayoutId
  photo_area_height: number
  photo_area_width: number
  font: FontFamily
  font_size: FontSize
  letter_text: string
  status: LetterStatus
  month_year: string
  submitted_at: string | null
  printed_at: string | null
  mailed_at: string | null
  created_at: string
  profile?: Profile
}

export interface MonthlyUsage {
  id: string
  user_id: string
  month_year: string
  count: number
}
