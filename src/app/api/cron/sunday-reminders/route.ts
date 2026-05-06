import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/twilio'
import { getCurrentMonthYear } from '@/lib/utils'

// Runs every Sunday at 6pm UTC — vercel.json: "0 18 * * 0"
//
// Each subscriber's reminders are anchored to their signup day-of-month:
//   • Initial reminder  → Sunday before their monthly anniversary (1–7 days away)
//   • Nudge reminder    → Sunday ~2 weeks after their anniversary if no letter yet
//
// Example: signed up on the 12th
//   → Initial SMS goes out the Sunday of the week containing the 12th
//   → Nudge SMS goes out the Sunday of the week containing the 26th (if not submitted)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const monthYear = getCurrentMonthYear()

  const today = new Date()
  const todayDay = today.getDate()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()

  // All active subscribers with a phone number
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, phone, created_at')
    .not('phone', 'is', null)
    .not('plan', 'is', null)
    .eq('stripe_subscription_status', 'active')

  if (!profiles?.length) return NextResponse.json({ initialSent: 0, nudgesSent: 0 })

  // Find who has already submitted a letter this calendar month
  const userIds = profiles.map(p => p.user_id)
  const { data: submitted } = await supabase
    .from('letters')
    .select('user_id')
    .in('user_id', userIds)
    .eq('month_year', monthYear)
    .eq('status', 'submitted')

  const submittedIds = new Set((submitted ?? []).map(l => l.user_id))

  let initialSent = 0
  let nudgesSent = 0

  for (const profile of profiles) {
    if (!profile.phone || !profile.created_at) continue

    // Their signup day-of-month, capped to the length of the current month
    // (e.g. signed up Jan 31 → treated as Feb 28 in February)
    const anchorDay = new Date(profile.created_at).getDate()
    const anchorDayCapped = Math.min(anchorDay, daysInMonth)

    // Days until next occurrence of their anchor day this month
    // Result is always 1–daysInMonth (never 0 so we don't double-fire on the exact day)
    const daysUntil = ((anchorDayCapped - todayDay + daysInMonth) % daysInMonth) || daysInMonth
    const daysSince = daysInMonth - daysUntil

    if (daysUntil >= 1 && daysUntil <= 7) {
      // Anniversary is in the coming week — send the monthly reminder
      await sendSMS(profile.phone, SMS_TEMPLATES.monthlyReminder(profile.name))
      initialSent++
    } else if (daysSince >= 14 && daysSince <= 21 && !submittedIds.has(profile.user_id)) {
      // ~2 weeks past their anniversary and still no letter — send a nudge
      await sendSMS(profile.phone, SMS_TEMPLATES.nudgeReminder(profile.name))
      nudgesSent++
    }
  }

  console.log(`[sunday-reminders] ${monthYear} — initial: ${initialSent}, nudges: ${nudgesSent}`)
  return NextResponse.json({ initialSent, nudgesSent })
}
