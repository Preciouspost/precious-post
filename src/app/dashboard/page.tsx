import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { formatMonthYear, getCurrentMonthYear, getMaxLetters, PLANS } from '@/lib/utils'
import { Letter, Profile } from '@/types'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Profile | null }

  if (!profile?.plan) redirect('/select-plan')

  const monthYear = getCurrentMonthYear()

  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .single()

  const { data: letters } = await supabase
    .from('letters')
    .select('*, address:addresses(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20) as { data: Letter[] | null }

  const usedCount = usage?.count ?? 0
  const maxLetters = getMaxLetters(profile.plan)
  const params = await searchParams
  const justSubscribed = params.success === '1'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-blush)' }}>
      <AppNav />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {justSubscribed && (
          <div className="rounded-xl px-4 py-3 text-sm mb-6 text-white" style={{ backgroundColor: 'var(--color-mauve)' }}>
            🎉 Welcome to Precious Post! Your subscription is active. Write your first letter below.
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
            Hello, {(profile.name ?? 'there').split(' ')[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>
            {formatMonthYear(monthYear)} · {PLANS[profile.plan].name}
          </p>
        </div>

        {/* This month's usage */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-charcoal-light)' }}>Letters this month</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--color-charcoal)' }}>
                {usedCount} <span className="text-base font-normal" style={{ color: 'var(--color-charcoal-light)' }}>/ {maxLetters}</span>
              </p>
            </div>
            {usedCount < maxLetters ? (
              <Link
                href="/letters/new"
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-mauve)' }}
              >
                + Start a new letter
              </Link>
            ) : (
              <span className="px-4 py-2 rounded-full text-sm" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-charcoal-light)' }}>
                All letters sent ✓
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-blush)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(usedCount / maxLetters) * 100}%`, backgroundColor: 'var(--color-mauve)' }}
            />
          </div>
        </div>

        {/* Letter history */}
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-charcoal)' }}>Your letters</h2>
        {letters && letters.length > 0 ? (
          <div className="space-y-3">
            {letters.map((letter) => (
              <LetterRow key={letter.id} letter={letter} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-3xl mb-3">💌</p>
            <p className="font-medium mb-1" style={{ color: 'var(--color-charcoal)' }}>No letters yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-charcoal-light)' }}>Write your first letter and send some love!</p>
            <Link href="/letters/new" className="text-sm font-medium underline" style={{ color: 'var(--color-mauve)' }}>
              Start a letter →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

function LetterRow({ letter }: { letter: Letter }) {
  const statusColors: Record<string, string> = {
    draft: '#e5e7eb',
    submitted: '#fef9c3',
    printed: '#dbeafe',
    mailed: '#dcfce7',
  }
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    printed: 'Printed',
    mailed: '📬 Mailed',
  }

  return (
    <div className="bg-white rounded-xl px-4 py-4 shadow-sm flex items-center justify-between">
      <div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-charcoal)' }}>
          To: {letter.address?.name ?? 'No recipient'}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-charcoal-light)' }}>
          {formatMonthYear(letter.month_year)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ backgroundColor: statusColors[letter.status], color: 'var(--color-charcoal)' }}
        >
          {statusLabels[letter.status]}
        </span>
        {letter.status === 'draft' && (
          <Link
            href={`/letters/${letter.id}/edit`}
            className="text-xs font-medium px-3 py-1 rounded-full text-white"
            style={{ backgroundColor: 'var(--color-mauve)' }}
          >
            Edit
          </Link>
        )}
      </div>
    </div>
  )
}
