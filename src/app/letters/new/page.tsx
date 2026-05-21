import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LetterEditorClient } from '@/components/letter-editor/LetterEditorClient'
import { Address, Profile } from '@/types'
import { getCurrentMonthYear, getMaxLetters } from '@/lib/utils'

export default async function NewLetterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Profile | null }

  // Only redirect to select-plan if no profile at all
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
  // Only enforce limits for subscription users — null/one_time users pay at submit
  if (profile.plan && profile.plan !== 'one_time' && usedCount >= maxLetters) redirect('/dashboard')

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
    />
  )
}
