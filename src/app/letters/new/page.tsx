import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LetterEditorClient } from '@/components/letter-editor/LetterEditorClient'
import { Address, Profile } from '@/types'
import { getCurrentMonthYear, getMaxLetters } from '@/lib/utils'

export default async function NewLetterPage({ searchParams }: { searchParams: Promise<{ extra?: string }> }) {
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
  const params = await searchParams
  const isExtra = params.extra === '1'

  // Triple post at limit — redirect. Single post users can still write extra letters (upsell modal handles payment).
  // null/one_time users pay at submit so never blocked here.
  if (profile.plan === 'triple' && usedCount >= maxLetters) redirect('/dashboard')

  // If there's an existing draft this month, resume it — unless this is a fresh extra letter
  if (!isExtra) {
    const { data: existingDraft } = await supabase
      .from('letters')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .eq('month_year', monthYear)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existingDraft) redirect(`/letters/${existingDraft.id}/edit`)
  }

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
