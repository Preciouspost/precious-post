import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/twilio'

// Runs at 6:45am ET (10:45 UTC) and 5:00pm ET (21:00 UTC) daily
// Lists all letters that are submitted or printed but not yet mailed

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data: letters } = await supabase
    .from('letters')
    .select('id, status, month_year, address:addresses(name)')
    .in('status', ['submitted', 'printed'])
    .order('created_at', { ascending: true })

  if (!letters || letters.length === 0) {
    await notifyAdmin(`📋 Precious Post — No letters pending. All caught up! ✅`)
    return NextResponse.json({ sent: true, count: 0 })
  }

  const lines = letters.map(l => {
    const recipient = (l.address as { name?: string } | null)?.name ?? 'Unknown'
    const status = l.status === 'submitted' ? 'Print' : 'Mail'
    return `• ${recipient} — ${status}`
  })

  const message = [
    `📋 Precious Post — ${letters.length} letter${letters.length !== 1 ? 's' : ''} need attention:`,
    '',
    ...lines,
    '',
    `${process.env.NEXT_PUBLIC_SITE_URL}/admin`,
  ].join('\n')

  await notifyAdmin(message)

  return NextResponse.json({ sent: true, count: letters.length })
}
