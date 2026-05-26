import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyAdmin } from '@/lib/twilio'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { letter_id } = await req.json() as { letter_id?: string }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, plan')
    .eq('user_id', user.id)
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precious-post.vercel.app'
  const plan = profile?.plan === 'triple' ? 'Triple Post' : 'Single Post'
  const name = profile?.name ?? 'A subscriber'

  await notifyAdmin(`💌 New letter submitted! ${name} (${plan}) just sent their letter. View it at ${siteUrl}/admin`)

  return NextResponse.json({ ok: true })
}
