import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreciousPostLogo } from '@/components/Logo'
import { Letter } from '@/types'
import { format } from 'date-fns'
import { AdminLetterRow } from './AdminLetterRow'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/login')

  const params = await searchParams
  const filterStatus = params.status ?? 'submitted'

  const { data: letters } = await supabase
    .from('letters')
    .select('*, address:addresses(*), profile:profiles(name, email, phone)')
    .eq('status', filterStatus)
    .order('submitted_at', { ascending: false }) as { data: (Letter & { profile: { name: string; email: string; phone: string } })[] | null }

  const statusOptions = ['submitted', 'printed', 'mailed', 'draft']

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PreciousPostLogo size="sm" />
            <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Admin</span>
          </div>
          <LogoutButton />
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          Letters Dashboard
        </h1>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {statusOptions.map(s => (
            <a
              key={s}
              href={`/admin?status=${s}`}
              className="px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors"
              style={{
                backgroundColor: filterStatus === s ? 'var(--color-mauve)' : 'white',
                color: filterStatus === s ? 'white' : 'var(--color-charcoal)',
                border: '1px solid',
                borderColor: filterStatus === s ? 'var(--color-mauve)' : '#e5e7eb',
              }}
            >
              {s}
            </a>
          ))}
        </div>

        {!letters || letters.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">No {filterStatus} letters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map(letter => (
              <AdminLetterRow key={letter.id} letter={letter} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
