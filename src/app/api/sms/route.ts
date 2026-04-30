import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/twilio'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, letterId } = await req.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('user_id', user.id)
    .single()

  if (!profile?.phone) return NextResponse.json({ ok: true })

  if (type === 'submitted' && letterId) {
    const { data: letter } = await supabase
      .from('letters')
      .select('address:addresses(name)')
      .eq('id', letterId)
      .single()

    const addr = letter?.address as unknown as { name: string } | null
    const recipientName = addr?.name ?? 'your recipient'
    await sendSMS(profile.phone, SMS_TEMPLATES.submitted(recipientName))
  }

  return NextResponse.json({ ok: true })
}
