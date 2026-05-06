import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/twilio'
import { getCurrentMonthYear } from '@/lib/utils'

// Called by Vercel Cron on the 20th of each month
// Sends a nudge only to active subscribers who haven't submitted a letter yet this month
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const monthYear = getCurrentMonthYear()

  // Get all active subscribers with a phone number
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, name, phone')
    .not('phone', 'is', null)
    .not('plan', 'is', null)
    .eq('stripe_subscription_status', 'active')

  if (!profiles?.length) return NextResponse.json({ sent: 0 })

  // Find which users have already submitted at least one letter this month
  const userIds = profiles.map(p => p.user_id)
  const { data: submitted } = await supabase
    .from('letters')
    .select('user_id')
    .in('user_id', userIds)
    .eq('month_year', monthYear)
    .eq('status', 'submitted')

  const submittedIds = new Set((submitted ?? []).map(l => l.user_id))

  // Send nudge only to those who haven't written their letter yet
  let sent = 0
  for (const profile of profiles) {
    if (profile.phone && !submittedIds.has(profile.user_id)) {
      await sendSMS(profile.phone, SMS_TEMPLATES.nudgeReminder(profile.name))
      sent++
    }
  }

  return NextResponse.json({ sent, skipped: profiles.length - sent })
}
