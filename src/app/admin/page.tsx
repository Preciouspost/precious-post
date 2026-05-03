import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PreciousPostLogo } from '@/components/Logo'
import { Letter } from '@/types'
import { AdminLetterRow } from './AdminLetterRow'
import { AdminBulkActions } from './AdminBulkActions'
import { AdminSubscribersTab } from './AdminSubscribersTab'
import { AdminWaitlistTab } from './AdminWaitlistTab'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string }>
}) {
  // Use regular client just for auth check
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/login')

  const params = await searchParams
  const activeTab = params.tab ?? 'letters'
  const filterStatus = params.status ?? 'submitted'

  // Only fetch letters when on letters tab
  let letters: (Letter & { profile: { name: string; email: string; phone: string } })[] | null = null
  if (activeTab === 'letters') {
    const supabase = await createAdminClient()
    const { data, error: lettersError } = await supabase
      .from('letters')
      .select('*, address:addresses(*), profile:profiles!left(name, email, phone)')
      .eq('status', filterStatus)
      .order('submitted_at', { ascending: false }) as { data: (Letter & { profile: { name: string; email: string; phone: string } })[] | null, error: unknown }

    if (lettersError) console.error('[Admin] letters query error:', lettersError)
    letters = data
  }

  const statusOptions = ['submitted', 'printed', 'mailed', 'draft']
  const topTabs = ['letters', 'subscribers', 'waitlist']

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-blush)' }}>
      <nav className="border-b px-4 py-3" style={{ backgroundColor: 'white', borderColor: 'var(--color-blush-dark)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PreciousPostLogo size="sm" />
            <span className="text-sm font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-blush)', color: 'var(--color-mauve)' }}>Admin</span>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Top-level tabs */}
        <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--color-blush-dark)' }}>
          {topTabs.map(t => (
            <a
              key={t}
              href={`/admin?tab=${t}`}
              className="px-5 py-2.5 text-sm font-medium capitalize transition-colors -mb-px border-b-2"
              style={{
                borderBottomColor: activeTab === t ? 'var(--color-mauve)' : 'transparent',
                color: activeTab === t ? 'var(--color-mauve)' : '#9ca3af',
              }}
            >
              {t === 'letters' ? '✉️ Letters' : t === 'subscribers' ? '👥 Subscribers' : '📋 Waitlist'}
            </a>
          ))}
        </div>

        {activeTab === 'subscribers' ? (
          <AdminSubscribersTab />
        ) : activeTab === 'waitlist' ? (
          <AdminWaitlistTab />
        ) : (
          <>
            {/* Letter status filter pills */}
            <div className="flex gap-2 mb-6">
              {statusOptions.map(s => (
                <a
                  key={s}
                  href={`/admin?tab=letters&status=${s}`}
                  className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors"
                  style={{
                    backgroundColor: filterStatus === s ? 'var(--color-mauve)' : 'white',
                    color: filterStatus === s ? 'white' : 'var(--color-charcoal)',
                    border: '1px solid',
                    borderColor: filterStatus === s ? 'var(--color-mauve)' : 'var(--color-blush-dark)',
                  }}
                >
                  {s}
                </a>
              ))}
            </div>

            {letters && letters.length > 0 && (
              <AdminBulkActions letters={letters} filterStatus={filterStatus} />
            )}

            {!letters || letters.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'white', border: '1px solid var(--color-blush-dark)' }}>
                <p className="text-sm" style={{ color: 'var(--color-charcoal-light)' }}>No {filterStatus} letters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {letters.map(letter => (
                  <AdminLetterRow key={letter.id} letter={letter} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
