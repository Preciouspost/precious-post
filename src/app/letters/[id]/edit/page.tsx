import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LetterEditorClient } from '@/components/letter-editor/LetterEditorClient'
import { Address, Letter, Profile } from '@/types'
import { getCurrentMonthYear, getMaxLetters } from '@/lib/utils'

export default async function EditLetterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: letter } = await supabase
    .from('letters')
    .select('*, address:addresses(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: Letter | null }

  if (!letter || letter.status !== 'draft') redirect('/dashboard')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Profile | null }

  if (!profile) redirect('/select-plan')

  const monthYear = getCurrentMonthYear()
  const maxLetters = getMaxLetters(profile.plan ?? null)

  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .single()

  const usedCount = usage?.count ?? 0

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('name') as { data: Address[] | null }

  return (
    <LetterEditorClient
      profile={profile}
      addresses={addresses ?? []}
      monthYear={monthYear}
      usedCount={usedCount}
      maxLetters={maxLetters}
      initialLetter={letter}
    />
  )
}
