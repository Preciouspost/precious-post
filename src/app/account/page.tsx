import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { Profile } from '@/types'
import { PLANS, formatMonthYear, getCurrentMonthYear, getMaxLetters } from '@/lib/utils'
import { AccountClient } from './AccountClient'
import { ManageBillingButton } from '@/components/ManageBillingButton'
import { CancelSubscriptionButton } from '@/components/CancelSubscriptionButton'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single() as { data: Profile | null }

  if (!profile) redirect('/login')

  const monthYear = getCurrentMonthYear()
  const { data: usage } = await supabase
    .from('monthly_usage')
    .select('count')
    .eq('user_id', user.id)
    .eq('month_year', monthYear)
    .single()

  const { data: allUsage } = await supabase
    .from('monthly_usage')
    .select('month_year, count')
    .eq('user_id', user.id)
    .order('month_year', { ascending: false })
    .limit(6)

  const { data: letterCount } = await supabase
    .from('letters')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('status', 'mailed')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-blush)' }}>
      <AppNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--color-charcoal)' }}>
          My Account
        </h1>

        {/* Profile info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-charcoal-light)' }}>Profile</h2>
          <AccountClient profile={profile} />
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-charcoal-light)' }}>Subscription</h2>
          {profile.plan ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-charcoal)' }}>Plan</span>
                <span className="text-sm font-medium px-3 py-1 rounded-full text-white" style={{ backgroundColor: 'var(--color-mauve)' }}>
                  {PLANS[profile.plan].name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-charcoal)' }}>Monthly price</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>${PLANS[profile.plan].price}/mo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-charcoal)' }}>Letters per month</span>
                <span className="text-sm font-medium" style={{ color: 'var(--color-charcoal)' }}>{getMaxLetters(profile.plan)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: 'var(--color-charcoal)' }}>Status</span>
                <span className="text-sm font-medium capitalize" style={{ color: profile.stripe_subscription_status === 'active' ? '#22c55e' : '#ef4444' }}>
                  {profile.stripe_subscription_status ?? 'Unknown'}
                </span>
              </div>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-blush-dark)' }}>
                <ManageBillingButton />
                <CancelSubscriptionButton />
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm mb-3" style={{ color: 'var(--color-charcoal-light)' }}>No active subscription.</p>
              <a href="/select-plan" className="text-sm font-medium underline" style={{ color: 'var(--color-mauve)' }}>Choose a plan →</a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-charcoal-light)' }}>Your letters</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatBox label="Total mailed" value={String(letterCount?.length ?? 0)} />
            <StatBox label="This month" value={`${usage?.count ?? 0} / ${getMaxLetters(profile.plan)}`} />
          </div>

          {allUsage && allUsage.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-charcoal-light)' }}>Monthly history</p>
              <div className="space-y-1">
                {allUsage.map(u => (
                  <div key={u.month_year} className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-charcoal)' }}>{formatMonthYear(u.month_year)}</span>
                    <span style={{ color: 'var(--color-charcoal-light)' }}>{u.count} letter{u.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ backgroundColor: 'var(--color-blush)' }}>
      <p className="text-2xl font-bold" style={{ color: 'var(--color-charcoal)' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--color-charcoal-light)' }}>{label}</p>
    </div>
  )
}

