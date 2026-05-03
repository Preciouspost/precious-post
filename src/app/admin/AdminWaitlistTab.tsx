'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'

interface WaitlistEntry {
  id: string
  name: string | null
  email: string
  phone: string | null
  heard_from: string | null
  story: string | null
  share_ok: boolean
  created_at: string
}

const HEARD_FROM_LABELS: Record<string, string> = {
  instagram:     'Instagram',
  tiktok:        'TikTok',
  google:        'Google',
  friend_family: 'Friend / Family',
  other:         'Other',
}

export function AdminWaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [view,    setView]    = useState<'all' | 'stories'>('all')

  useEffect(() => {
    fetch('/api/admin/waitlist')
      .then(r => r.json())
      .then(d => {
        setEntries(d.entries ?? [])
        setTotal(d.total ?? 0)
        setLoading(false)
      })
  }, [])

  function downloadCSV() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Heard From', 'Story', 'Share OK', 'Joined'],
      ...entries.map(e => [
        e.name ?? '',
        e.email,
        e.phone ?? '',
        e.heard_from ? (HEARD_FROM_LABELS[e.heard_from] ?? e.heard_from) : '',
        e.story ?? '',
        e.share_ok ? 'Yes' : 'No',
        format(parseISO(e.created_at), 'yyyy-MM-dd'),
      ]),
    ]
    const csv  = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `precious-post-waitlist-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const storiesEntries = entries.filter(e => e.story && e.share_ok)
  const storiesOnly    = entries.filter(e => e.story)

  const filtered = (view === 'stories' ? storiesOnly : entries).filter(e => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      e.email.toLowerCase().includes(q) ||
      (e.name ?? '').toLowerCase().includes(q) ||
      (e.phone ?? '').includes(q) ||
      (e.story ?? '').toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>Loading waitlist…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>Total Signups</span>
          <p className="text-4xl font-bold mt-2 mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>{total}</p>
          <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>people waiting to launch</p>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>With Phone</span>
          <p className="text-4xl font-bold mt-2 mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            {entries.filter(e => e.phone).length}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>can get a launch-day text</p>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>Shared Stories</span>
          <p className="text-4xl font-bold mt-2 mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            {storiesOnly.length}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
            {storiesEntries.length} approved for social
          </p>
        </div>

        <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>Most Recent</span>
          {entries[0] ? (
            <>
              <p className="font-semibold mt-2 truncate" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)', fontSize: '1rem' }}>
                {entries[0].name ?? entries[0].email}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>
                {format(parseISO(entries[0].created_at), 'MMM d · h:mm a')}
              </p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: 'var(--color-charcoal-light)' }}>No signups yet</p>
          )}
        </div>
      </div>

      {/* Social-approved stories */}
      {storiesEntries.length > 0 && (
        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)', fontSize: '1.05rem' }}>
                ✨ Stories to Share
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>
                These people gave you permission to share their story on social media
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-mauve)' }}>
              {storiesEntries.length} approved
            </span>
          </div>
          <div className="space-y-3">
            {storiesEntries.map((e, i) => (
              <div
                key={e.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: i % 2 === 0 ? 'var(--color-blush)' : 'white', border: '1px solid var(--color-blush-dark)' }}
              >
                <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-charcoal)' }}>
                  "{e.story}"
                </p>
                <p className="text-xs font-medium" style={{ color: 'var(--color-mauve)' }}>
                  — {e.name ? e.name.split(' ')[0] : 'Anonymous'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main table */}
      <div className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>

        {/* Table toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--color-blush-dark)' }}>
          <div className="flex items-center gap-3">
            <h2 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)', fontSize: '1.05rem' }}>
              Waitlist
            </h2>
            {/* View toggle */}
            <div className="flex rounded-lg overflow-hidden text-xs font-medium" style={{ border: '1px solid var(--color-blush-dark)' }}>
              {(['all', 'stories'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-3 py-1.5 capitalize transition-colors"
                  style={{
                    backgroundColor: view === v ? 'var(--color-mauve)' : 'var(--color-blush)',
                    color: view === v ? 'white' : 'var(--color-charcoal-light)',
                  }}
                >
                  {v === 'all' ? `All (${total})` : `With story (${storiesOnly.length})`}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-xl outline-none w-40"
              style={{ border: '1px solid var(--color-blush-dark)', backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal)' }}
            />
            <button
              onClick={downloadCSV}
              disabled={entries.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: 'var(--color-mauve)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
            <p className="text-3xl mb-3">💌</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
              {search ? 'No results match your search' : 'No waitlist signups yet'}
            </p>
            {!search && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>
                Share <span className="font-mono" style={{ color: 'var(--color-mauve)' }}>/waitlist</span> to start collecting emails
              </p>
            )}
          </div>
        ) : (
          <>
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-6 py-2.5"
              style={{
                gridTemplateColumns: '2fr 2.5fr 1.5fr 1.5fr 2.5fr 1fr 1fr',
                color: 'var(--color-charcoal-light)',
                backgroundColor: 'var(--color-blush)',
                borderBottom: '1px solid var(--color-blush-dark)',
              }}
            >
              <span>Name</span>
              <span>Email</span>
              <span>Phone</span>
              <span>Heard From</span>
              <span>Their Story</span>
              <span className="text-center">Share OK</span>
              <span className="text-right">Joined</span>
            </div>

            <div>
              {filtered.map((e, i) => (
                <div
                  key={e.id}
                  className="grid items-start px-6 py-3.5 text-sm"
                  style={{
                    gridTemplateColumns: '2fr 2.5fr 1.5fr 1.5fr 2.5fr 1fr 1fr',
                    backgroundColor: i % 2 === 0 ? 'white' : 'var(--color-blush)',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--color-blush-dark)' : 'none',
                  }}
                >
                  <span className="font-medium truncate pr-2" style={{ color: 'var(--color-charcoal)' }}>
                    {e.name || <span style={{ color: 'var(--color-charcoal-light)' }}>—</span>}
                  </span>
                  <span className="text-xs truncate pr-2" style={{ color: 'var(--color-charcoal-light)' }}>{e.email}</span>
                  <span className="text-xs pr-2" style={{ color: 'var(--color-charcoal-light)' }}>{e.phone || '—'}</span>
                  <span className="text-xs pr-2" style={{ color: 'var(--color-charcoal-light)' }}>
                    {e.heard_from ? (HEARD_FROM_LABELS[e.heard_from] ?? e.heard_from) : '—'}
                  </span>
                  <span className="text-xs pr-2 leading-relaxed" style={{ color: 'var(--color-charcoal)', whiteSpace: 'normal' }}>
                    {e.story
                      ? <span title={e.story}>{e.story.length > 80 ? e.story.slice(0, 80) + '…' : e.story}</span>
                      : <span style={{ color: 'var(--color-charcoal-light)' }}>—</span>
                    }
                  </span>
                  <span className="text-center text-base">{e.share_ok ? '✅' : '—'}</span>
                  <span className="text-right text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                    {format(parseISO(e.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
