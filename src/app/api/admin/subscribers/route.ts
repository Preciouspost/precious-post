import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { subMonths, format, startOfMonth, parseISO } from 'date-fns'

export async function GET() {
  // Auth check
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  // All profiles that have ever had a subscription
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, email, plan, stripe_subscription_status, created_at, cancellation_reason')
    .order('created_at', { ascending: false })

  // Plan upgrades
  const { data: upgrades } = await supabase
    .from('plan_upgrades')
    .select('id, user_id, upgraded_from, upgraded_to, upgraded_at, profile:profiles(name, email)')
    .order('upgraded_at', { ascending: false })

  const allProfiles = profiles ?? []
  const allUpgrades = upgrades ?? []

  // Active subscribers (status = active and plan set)
  const activeProfiles = allProfiles.filter(
    p => p.stripe_subscription_status === 'active' && p.plan
  )
  const singleCount = activeProfiles.filter(p => p.plan === 'single').length
  const tripleCount = activeProfiles.filter(p => p.plan === 'triple').length
  const totalActive = activeProfiles.length
  const monthlyRevenue = singleCount * 12.95 + tripleCount * 32

  // Build last 13 months of monthly data
  const now = new Date()
  const monthlyData: {
    month: string
    label: string
    newSingle: number
    newTriple: number
    newTotal: number
  }[] = []

  for (let i = 12; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i))
    const monthKey = format(monthStart, 'yyyy-MM')
    const label = format(monthStart, 'MMM yy')

    const newSingle = allProfiles.filter(p => {
      const created = format(parseISO(p.created_at), 'yyyy-MM')
      return created === monthKey && p.plan === 'single'
    }).length

    const newTriple = allProfiles.filter(p => {
      const created = format(parseISO(p.created_at), 'yyyy-MM')
      return created === monthKey && p.plan === 'triple'
    }).length

    monthlyData.push({
      month: monthKey,
      label,
      newSingle,
      newTriple,
      newTotal: newSingle + newTriple,
    })
  }

  // MoM change: compare current month new signups vs last month
  const currentMonthNew = monthlyData[monthlyData.length - 1].newTotal
  const lastMonthNew = monthlyData[monthlyData.length - 2].newTotal

  // MoM revenue change: compare this month vs last assuming same ratio
  // Use cumulative actives at end of each month for revenue trend
  const currentMonthKey = format(now, 'yyyy-MM')
  const lastMonthKey = format(subMonths(now, 1), 'yyyy-MM')

  // Subscribers created on or before each month end
  const activeAtEndOfMonth = (monthKey: string) => {
    return allProfiles.filter(p => {
      const created = format(parseISO(p.created_at), 'yyyy-MM')
      return created <= monthKey && p.stripe_subscription_status === 'active' && p.plan
    })
  }

  const thisMonthActives = activeAtEndOfMonth(currentMonthKey)
  const lastMonthActives = activeAtEndOfMonth(lastMonthKey)

  const lastMonthSingleCount = lastMonthActives.filter(p => p.plan === 'single').length
  const lastMonthTripleCount = lastMonthActives.filter(p => p.plan === 'triple').length

  const lastMonthRevenue =
    lastMonthSingleCount * 12.95 +
    lastMonthTripleCount * 32

  // Build cumulative subscriber chart data (actives at end of each month)
  const chartData = monthlyData.map(m => {
    const cumulative = activeAtEndOfMonth(m.month)
    return {
      ...m,
      cumSingle: cumulative.filter(p => p.plan === 'single').length,
      cumTriple: cumulative.filter(p => p.plan === 'triple').length,
      cumTotal: cumulative.length,
      revenue: cumulative.filter(p => p.plan === 'single').length * 12.95 +
               cumulative.filter(p => p.plan === 'triple').length * 32,
    }
  })

  // Recent cancellations
  const cancellations = allProfiles
    .filter(p => p.cancellation_reason)
    .slice(0, 20)

  // All subscribers list (active only), sorted newest first
  const allSubscribers = activeProfiles.map(p => ({
    user_id: p.user_id,
    name: p.name,
    email: p.email,
    plan: p.plan,
    joined: p.created_at,
  }))

  return NextResponse.json({
    totalActive,
    singleCount,
    tripleCount,
    lastMonthSingleCount,
    lastMonthTripleCount,
    monthlyRevenue,
    lastMonthRevenue,
    subscriberTrend: totalActive - lastMonthActives.length,
    newThisMonth: currentMonthNew,
    newLastMonth: lastMonthNew,
    chartData,
    upgrades: allUpgrades,
    cancellations,
    allSubscribers,
  })
}
