import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { letterId, status } = await req.json()
  const adminSupabase = await createAdminClient()

  const updates: Record<string, string> = { status }
  if (status === 'printed') updates.printed_at = new Date().toISOString()
  if (status === 'mailed') updates.mailed_at = new Date().toISOString()

  const { error } = await adminSupabase
    .from('letters')
    .update(updates)
    .eq('id', letterId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
