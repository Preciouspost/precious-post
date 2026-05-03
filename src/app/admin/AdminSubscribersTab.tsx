'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'

interface ChartPoint {
  month: string
  label: string
  newSingle: number
  newTriple: number
  newTotal: number
  cumSingle: number
  cumTriple: number
  cumTotal: number
  revenue: number
}

interface Upgrade {
  id: string
  user_id: string
  upgraded_from: string
  upgraded_to: string
  upgraded_at: string
  profile: { name: string; email: string } | null
}

interface Cancellation {
  user_id: string
  name: string
  email: string
  cancellation_reason: string
}

interface Subscriber {
  user_id: string
  name: string
  email: string
  plan: string
  joined: string
}

interface SubscriberData {
  totalActive: number
  singleCount: number
  tripleCount: number
  lastMonthSingleCount: number
  lastMonthTripleCount: number
  monthlyRevenue: number
  lastMonthRevenue: number
  subscriberTrend: number
  newThisMonth: number
  newLastMonth: number
  chartData: ChartPoint[]
  upgrades: Upgrade[]
  cancellations: Cancellation[]
  allSubscribers: Subscriber[]
}

function TrendBadge({ value, prefix = '' }: { value: number; prefix?: string }) {
  if (value === 0) return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f0d8cf', color: 'var(--color-charcoal-light)' }}>
      — same
    </span>
  )
  const up = value > 0
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-0.5"
      style={{
        backgroundColor: up ? '#dcfce7' : '#fee2e2',
        color: up ? '#16a34a' : '#dc2626',
      }}
    >
      {up ? '↑' : '↓'} {prefix}{Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
    </span>
  )
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon,
  prefix = '',
}: {
  label: string
  value: string
  trend: number
  trendLabel: string
  icon: React.ReactNode
  prefix?: string
}) {
  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-blush)' }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
        {value}
      </p>
      <div className="flex items-center gap-2">
        <TrendBadge value={trend} prefix={prefix} />
        <span className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>{trendLabel}</span>
      </div>
    </div>
  )
}

function PlanCard({
  label,
  count,
  lastMonthCount,
  icon,
}: {
  label: string
  count: number
  lastMonthCount: number
  icon: React.ReactNode
}) {
  const trend = count - lastMonthCount
  return (
    <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-charcoal-light)' }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-blush)' }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
        {count}
      </p>
      <div className="flex items-center gap-2">
        <TrendBadge value={trend} />
        <span className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>vs last month</span>
      </div>
    </div>
  )
}

function SectionCard({ title, subtitle, right, children }: {
  title: string
  subtitle?: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)', fontSize: '1.05rem' }}>
            {title}
          </h2>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

// SVG line chart — cumulative subscribers
function SubscriberChart({ data }: { data: ChartPoint[] }) {
  const W = 700, H = 220, padL = 44, padR = 16, padT = 16, padB = 36
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const maxY = Math.max(...data.map(d => d.cumTotal), 1)
  const yTicks = 4

  function xPos(i: number) { return padL + (i / (data.length - 1)) * chartW }
  function yPos(v: number) { return padT + chartH - (v / maxY) * chartH }

  const singleLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.cumSingle).toFixed(1)}`).join(' ')
  const tripleLine = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.cumTriple).toFixed(1)}`).join(' ')
  const totalLine  = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.cumTotal).toFixed(1)}`).join(' ')
  const areaPath   = [
    ...data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.cumTotal).toFixed(1)}`),
    `L${xPos(data.length - 1).toFixed(1)},${(padT + chartH).toFixed(1)}`,
    `L${xPos(0).toFixed(1)},${(padT + chartH).toFixed(1)}`, 'Z',
  ].join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 220 }}>
      {/* Soft blush grid */}
      {Array.from({ length: yTicks + 1 }, (_, i) => {
        const v = Math.round((maxY / yTicks) * (yTicks - i))
        const y = yPos(v)
        return (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#f0d8cf" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--color-charcoal-light)">{v}</text>
          </g>
        )
      })}
      <path d={areaPath} fill="var(--color-mauve)" fillOpacity="0.07" />
      <path d={singleLine} fill="none" stroke="var(--color-mauve)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={tripleLine} fill="none" stroke="#b08ba0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={totalLine}  fill="none" stroke="var(--color-charcoal)" strokeWidth="2.5" strokeDasharray="6 3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xPos(i)} cy={yPos(d.cumSingle)} r={3} fill="var(--color-mauve)" />
          <circle cx={xPos(i)} cy={yPos(d.cumTriple)} r={3} fill="#b08ba0" />
          <circle cx={xPos(i)} cy={yPos(d.cumTotal)}  r={4} fill="white" stroke="var(--color-charcoal)" strokeWidth="2" />
        </g>
      ))}
      {data.map((d, i) => (
        i % 2 === 0
          ? <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="9.5" fill="var(--color-charcoal-light)">{d.label}</text>
          : null
      ))}
    </svg>
  )
}

// Stacked bar chart — new subscribers per month
function NewSubsChart({ data }: { data: ChartPoint[] }) {
  const W = 700, H = 140, padL = 44, padR = 16, padT = 12, padB = 30
  const chartW = W - padL - padR
  const chartH = H - padT - padB
  const maxY = Math.max(...data.map(d => d.newTotal), 1)
  const barW = (chartW / data.length) * 0.55
  const gap   = chartW / data.length

  function xCenter(i: number) { return padL + gap * i + gap / 2 }
  function yPos(v: number) { return padT + chartH - (v / maxY) * chartH }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 140 }}>
      <line x1={padL} x2={W - padR} y1={padT + chartH} y2={padT + chartH} stroke="#f0d8cf" strokeWidth="1" />
      {data.map((d, i) => {
        const cx = xCenter(i)
        const sH = (d.newSingle / maxY) * chartH
        const tH = (d.newTriple / maxY) * chartH
        return (
          <g key={i}>
            {sH > 0 && <rect x={cx - barW / 2} y={padT + chartH - sH} width={barW} height={sH} fill="var(--color-mauve)" rx={2} fillOpacity="0.8" />}
            {tH > 0 && <rect x={cx - barW / 2} y={padT + chartH - sH - tH} width={barW} height={tH} fill="#b08ba0" rx={2} fillOpacity="0.8" />}
            {i % 2 === 0 && <text x={cx} y={H - 4} textAnchor="middle" fontSize="9.5" fill="var(--color-charcoal-light)">{d.label}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

export function AdminSubscribersTab() {
  const [data, setData] = useState<SubscriberData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subSearch, setSubSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/subscribers')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>Loading subscriber data…</p>
      </div>
    )
  }

  if (!data || (data as { error?: string }).error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm" style={{ color: '#ef4444' }}>Failed to load subscriber data.</p>
      </div>
    )
  }

  const revenueTrend = data.monthlyRevenue - data.lastMonthRevenue

  const filteredSubs = (data.allSubscribers ?? []).filter(s => {
    if (!subSearch.trim()) return true
    const q = subSearch.toLowerCase()
    return s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q)
  })

  const EnvelopeIcon = ({ color }: { color: string }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )

  return (
    <div className="space-y-5">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Subscribers"
          value={String(data.totalActive)}
          trend={data.subscriberTrend}
          trendLabel="vs last month"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-mauve)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Monthly Revenue"
          value={`$${data.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={revenueTrend}
          trendLabel="vs last month"
          prefix="$"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-mauve)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <PlanCard
          label="Single Post"
          count={data.singleCount}
          lastMonthCount={data.lastMonthSingleCount}
          icon={<EnvelopeIcon color="var(--color-mauve)" />}
        />
        <PlanCard
          label="Triple Post"
          count={data.tripleCount}
          lastMonthCount={data.lastMonthTripleCount}
          icon={<EnvelopeIcon color="#b08ba0" />}
        />
      </div>

      {/* Growth line chart */}
      <SectionCard
        title="Subscriber Growth"
        right={
          <div className="flex items-center gap-4">
            <LegendDot color="var(--color-mauve)" label="Single Post" />
            <LegendDot color="#b08ba0" label="Triple Post" />
            <LegendDot color="var(--color-charcoal)" label="Total" />
          </div>
        }
      >
        <SubscriberChart data={data.chartData} />
      </SectionCard>

      {/* New subs bar chart */}
      <SectionCard
        title="New Subscribers per Month"
        subtitle={`${data.newThisMonth} this month${data.newLastMonth > 0 ? ` · ${data.newThisMonth >= data.newLastMonth ? '↑' : '↓'} vs ${data.newLastMonth} last month` : ''}`}
        right={
          <div className="flex items-center gap-4">
            <LegendDot color="var(--color-mauve)" label="Single" />
            <LegendDot color="#b08ba0" label="Triple" />
          </div>
        }
      >
        <NewSubsChart data={data.chartData} />
      </SectionCard>

      {/* All Subscribers */}
      <SectionCard
        title="All Subscribers"
        subtitle={`${data.totalActive} active`}
        right={
          <input
            type="text"
            placeholder="Search by name or email…"
            value={subSearch}
            onChange={e => setSubSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-xl outline-none w-52"
            style={{
              border: '1px solid var(--color-blush-dark)',
              backgroundColor: 'var(--color-blush)',
              color: 'var(--color-charcoal)',
            }}
          />
        }
      >
        {filteredSubs.length === 0 ? (
          <div className="rounded-xl py-8 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
            <p className="text-2xl mb-2">📬</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>
              {subSearch ? 'No results found' : 'No active subscribers yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 text-xs font-semibold uppercase tracking-wider px-3 pb-2 mb-1 border-b" style={{ color: 'var(--color-charcoal-light)', borderColor: 'var(--color-blush-dark)' }}>
              <span className="col-span-4">Name</span>
              <span className="col-span-4">Email</span>
              <span className="col-span-2">Plan</span>
              <span className="col-span-2 text-right">Joined</span>
            </div>
            <div>
              {filteredSubs.map((s, i) => (
                <div
                  key={s.user_id}
                  className="grid grid-cols-12 items-center px-3 py-3 text-sm rounded-xl transition-colors"
                  style={{ backgroundColor: i % 2 === 0 ? 'transparent' : 'var(--color-blush)' }}
                >
                  <span className="col-span-4 font-medium" style={{ color: 'var(--color-charcoal)' }}>{s.name || '—'}</span>
                  <span className="col-span-4 truncate text-xs" style={{ color: 'var(--color-charcoal-light)' }}>{s.email}</span>
                  <span className="col-span-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        s.plan === 'triple'
                          ? { backgroundColor: '#ede9fe', color: '#7c3aed' }
                          : { backgroundColor: 'var(--color-blush-dark)', color: 'var(--color-mauve)' }
                      }
                    >
                      {s.plan === 'triple' ? 'Triple' : 'Single'}
                    </span>
                  </span>
                  <span className="col-span-2 text-right text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                    {format(parseISO(s.joined), 'MMM d, yyyy')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* Plan Upgrades */}
      <SectionCard
        title="Plan Upgrades"
        subtitle="Subscribers who switched from Single Post → Triple Post"
      >
        {data.upgrades.length === 0 ? (
          <div className="rounded-xl py-8 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
            <p className="text-2xl mb-2">💌</p>
            <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>No upgrades yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>Upgrades will appear here as subscribers change their plan</p>
          </div>
        ) : (
          <>
            <div className="mb-3 px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              ↑ {data.upgrades.length} total upgrade{data.upgrades.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2">
              {data.upgrades.map((u, i) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: i % 2 === 0 ? 'var(--color-blush)' : 'white', border: '1px solid var(--color-blush-dark)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{u.profile?.name ?? 'Unknown'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>{u.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--color-blush-dark)', color: 'var(--color-mauve)' }}>
                      Single Post
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>→</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
                      Triple Post
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                      {format(parseISO(u.upgraded_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      {/* Cancellations */}
      {data.cancellations.length > 0 && (
        <SectionCard
          title="Recent Cancellations"
          subtitle="Reported reasons from cancelled subscribers"
        >
          <div className="space-y-2">
            {data.cancellations.map((c, i) => (
              <div
                key={i}
                className="flex items-start justify-between rounded-xl px-4 py-3"
                style={{ backgroundColor: i % 2 === 0 ? 'var(--color-blush)' : 'white', border: '1px solid var(--color-blush-dark)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{c.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>{c.email}</p>
                </div>
                <span className="text-xs text-right max-w-xs" style={{ color: 'var(--color-charcoal-light)' }}>
                  {c.cancellation_reason?.replace('other: ', '') ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

    </div>
  )
}
