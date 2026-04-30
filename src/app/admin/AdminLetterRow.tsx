'use client'

import { useState } from 'react'
import { Letter } from '@/types'
import { formatMonthYear } from '@/lib/utils'
import { format } from 'date-fns'
import { AdminPDFDownload } from './AdminPDFDownload'

interface Props {
  letter: Letter & { profile: { name: string; email: string; phone: string } }
}

export function AdminLetterRow({ letter }: Props) {
  const [status, setStatus] = useState(letter.status)
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: string) {
    setLoading(true)
    await fetch('/api/admin/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ letterId: letter.id, status: newStatus }),
    })
    setStatus(newStatus as typeof status)
    setLoading(false)
  }

  const statusColors: Record<string, string> = {
    submitted: '#fef9c3',
    printed: '#dbeafe',
    mailed: '#dcfce7',
    draft: '#f3f4f6',
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border" style={{ borderColor: '#f3f4f6' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full capitalize"
              style={{ backgroundColor: statusColors[status] }}
            >
              {status}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
              {letter.profile.name}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
              {letter.profile.email}
            </span>
          </div>

          <div className="text-sm" style={{ color: 'var(--color-charcoal)' }}>
            <strong>To:</strong> {letter.address?.name ?? '—'}
          </div>
          {letter.address && (
            <div className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
              {letter.address.address_line1}
              {letter.address.address_line2 ? `, ${letter.address.address_line2}` : ''},{' '}
              {letter.address.city}, {letter.address.state} {letter.address.zip}
            </div>
          )}

          <div className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
            {formatMonthYear(letter.month_year)}
            {letter.submitted_at && ` · Submitted ${format(new Date(letter.submitted_at), 'MMM d, h:mm a')}`}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <AdminPDFDownload letter={letter} />

          {status === 'submitted' && (
            <button
              onClick={() => updateStatus('printed')}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#3b82f6' }}
            >
              Mark printed
            </button>
          )}
          {status === 'printed' && (
            <button
              onClick={() => updateStatus('mailed')}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#22c55e' }}
            >
              Mark mailed
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
