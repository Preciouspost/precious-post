import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentMonthYear(): string {
  return format(new Date(), 'yyyy-MM')
}

export function formatMonthYear(monthYear: string): string {
  const [year, month] = monthYear.split('-')
  return format(new Date(parseInt(year), parseInt(month) - 1), 'MMMM yyyy')
}

export function getMaxLetters(plan: string | null): number {
  if (plan === 'triple') return 3
  return 1
}

export const PLANS = {
  single: {
    name: 'Single Post',
    price: 12.95,
    letters: 1,
    description: '1 letter per month, 1 recipient',
  },
  triple: {
    name: 'Triple Post',
    price: 32,
    letters: 3,
    description: '3 letters per month, up to 3 recipients',
  },
}
