import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
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
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('user_id, name, email, plan, stripe_subscription_status, created_at, heard_from')
    .order('created_at', { ascending: false })

  if (profilesError) {
    console.error('[admin/subscribers] profiles query failed:', profilesError)
    return NextResponse.json({ error: `DB error: ${profilesError.message}` }, { status: 500 })
  }

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

  // --- Real revenue from Stripe ---
  const stripe = getStripe()

  // Fetch all active subscriptions (with discounts expanded)
  let allSubs: Awaited<ReturnType<typeof stripe.subscriptions.list>>['data'] = []
  let hasMore = true
  let startingAfter: string | undefined
  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.discounts'],
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })
    allSubs = allSubs.concat(page.data)
    hasMore = page.has_more
    if (page.data.length > 0) startingAfter = page.data[page.data.length - 1].id
  }

  // Sum actual monthly amounts after any coupon discounts
  const monthlyRevenue = allSubs.reduce((sum, sub) => {
    const item = sub.items.data[0]
    if (!item) return sum
    const unitAmount = item.price.unit_amount ?? 0
    const interval = item.price.recurring?.interval
    const baseMonthly = interval === 'year' ? unitAmount / 12 : unitAmount
    // discounts is an array; grab the first expanded Discount object if any
    const firstDiscount = Array.isArray(sub.discounts) ? sub.discounts[0] : null
    const coupon = firstDiscount && typeof firstDiscount === 'object' && 'coupon' in firstDiscount
      ? (firstDiscount as { coupon: { percent_off?: number; amount_off?: number } }).coupon
      : null
    let actual = baseMonthly
    if (coupon?.percent_off) actual = baseMonthly * (1 - coupon.percent_off / 100)
    else if (coupon?.amount_off) actual = Math.max(0, baseMonthly - coupon.amount_off)
    return sum + actual / 100
  }, 0)

  // Fetch paid subscription invoices for the last 14 months for chart + last-month revenue
  const now = new Date()
  const chartStart = startOfMonth(subMonths(now, 12))
  let allInvoices: Awaited<ReturnType<typeof stripe.invoices.list>>['data'] = []
  let invHasMore = true
  let invStartingAfter: string | undefined
  while (invHasMore) {
    const page = await stripe.invoices.list({
      status: 'paid',
      created: { gte: Math.floor(chartStart.getTime() / 1000) },
      limit: 100,
      ...(invStartingAfter ? { starting_after: invStartingAfter } : {}),
    })
    allInvoices = allInvoices.concat(page.data)
    invHasMore = page.has_more
    if (page.data.length > 0) invStartingAfter = page.data[page.data.length - 1].id
  }
  // Only count subscription invoices (not one-time) — identified by billing_reason
  const subInvoices = allInvoices.filter(inv =>
    inv.billing_reason && inv.billing_reason.startsWith('subscription')
  )

  // Group invoices by month key → total paid
  const invoicesByMonth: Record<string, number> = {}
  for (const inv of subInvoices) {
    const monthKey = format(new Date((inv.created) * 1000), 'yyyy-MM')
    invoicesByMonth[monthKey] = (invoicesByMonth[monthKey] ?? 0) + (inv.amount_paid ?? 0) / 100
  }

  const lastMonthKey = format(subMonths(now, 1), 'yyyy-MM')
  const lastMonthRevenue = invoicesByMonth[lastMonthKey] ?? 0

  // Build last 13 months of monthly data
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

  const currentMonthKey = format(now, 'yyyy-MM')

  // Subscribers created on or before each month end
  const activeAtEndOfMonth = (monthKey: string) => {
    return allProfiles.filter(p => {
      const created = format(parseISO(p.created_at), 'yyyy-MM')
      return created <= monthKey && p.stripe_subscription_status === 'active' && p.plan
    })
  }

  const lastMonthActives = activeAtEndOfMonth(lastMonthKey)
  const lastMonthSingleCount = lastMonthActives.filter(p => p.plan === 'single').length
  const lastMonthTripleCount = lastMonthActives.filter(p => p.plan === 'triple').length

  // Build cumulative subscriber chart data — subscriber counts from DB, revenue from Stripe invoices
  const chartData = monthlyData.map(m => {
    const cumulative = activeAtEndOfMonth(m.month)
    return {
      ...m,
      cumSingle: cumulative.filter(p => p.plan === 'single').length,
      cumTriple: cumulative.filter(p => p.plan === 'triple').length,
      cumTotal: cumulative.length,
      revenue: invoicesByMonth[m.month] ?? 0,
    }
  })

  // Recent cancellations (column not yet in schema)
  const cancellations: never[] = []

  // All subscribers list (active only), sorted newest first
  const allSubscribers = activeProfiles.map(p => ({
    user_id: p.user_id,
    name: p.name,
    email: p.email,
    plan: p.plan,
    joined: p.created_at,
    heard_from: p.heard_from ?? null,
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
