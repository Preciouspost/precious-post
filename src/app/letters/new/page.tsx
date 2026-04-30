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

  if (!profile?.plan) redirect('/select-plan')

  const monthYear = getCurrentMonthYear()
  const maxLetters = getMaxLetters(profile.plan)

  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .single()

  const usedCount = usage?.count ?? 0
  if (usedCount >= maxLetters) redirect('/dashboard')

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
    />
  )
}
