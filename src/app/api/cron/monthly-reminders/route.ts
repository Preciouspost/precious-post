import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/twilio'

// Called by Vercel Cron on the 1st of each month
// vercel.json: { "crons": [{ "path": "/api/cron/monthly-reminders", "schedule": "0 10 1 * *" }] }
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('name, phone')
    .not('phone', 'is', null)
    .not('plan', 'is', null)
    .eq('stripe_subscription_status', 'active')

  if (!profiles) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const profile of profiles) {
    if (profile.phone) {
      await sendSMS(profile.phone, SMS_TEMPLATES.monthlyReminder(profile.name))
      sent++
    }
  }

  return NextResponse.json({ sent })
}
