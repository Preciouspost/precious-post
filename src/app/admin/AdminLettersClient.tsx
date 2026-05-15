'use client'

import { useState } from 'react'
import { Letter } from '@/types'
import { AdminBulkActions } from './AdminBulkActions'
import { AdminLetterRow } from './AdminLetterRow'

type LetterWithProfile = Letter & { profile: { name: string; email: string; phone: string } }

export function AdminLettersClient({ letters, filterStatus }: { letters: LetterWithProfile[], filterStatus: string }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd] = useState('')

  const filteredLetters = letters.filter(l => {
    if (!appliedStart && !appliedEnd) return true
    if (!l.submitted_at) return false
    const submitted = new Date(l.submitted_at)
    if (appliedStart && submitted < new Date(appliedStart)) return false
    if (appliedEnd && submitted > new Date(appliedEnd + 'T23:59:59')) return false
    return true
  })

  const dateLabel = appliedStart || appliedEnd
    ? `${appliedStart || '\u2026'} \u2192 ${appliedEnd || '\u2026'} (${filteredLetters.length} letter${filteredLetters.length !== 1 ? 's' : ''})`
    : `All ${letters.length} letter${letters.length !== 1 ? 's' : ''}`

  return (
    <>
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-white rounded-xl border" style={{ borderColor: '#e5e7eb' }}>
        <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>Filter by date submitted:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>From</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>To</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="px-2 py-1 rounded-lg border text-sm outline-none"
            style={{ borderColor: '#e5e7eb', color: 'var(--color-charcoal)' }}
          />
        </div>
        <button
          onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate) }}
          className="px-3 py-1 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: 'var(--color-mauve)' }}
        >
          Apply
        </button>
        {(appliedStart || appliedEnd) && (
          <button
            onClick={() => { setStartDate(''); setEndDate(''); setAppliedStart(''); setAppliedEnd('') }}
            className="text-xs underline"
            style={{ color: 'var(--color-charcoal-light)' }}
          >
            Clear
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--color-charcoal-light)' }}>{dateLabel}</span>
      </div>

      <AdminBulkActions letters={filteredLetters} filterStatus={filterStatus} />

      {filteredLetters.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>No letters match this date range.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLetters.map(letter => (
            <AdminLetterRow key={letter.id} letter={letter} />
          ))}
        </div>
      )}
    </>
  )
}
