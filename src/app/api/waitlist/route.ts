import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { name, email, phone, heard_from, story, share_ok } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Check for duplicate
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single()

  if (existing) {
    return NextResponse.json({ success: true, alreadyJoined: true })
  }

  const { error } = await supabase.from('waitlist').insert({
    name:       name?.trim()           || null,
    email:      email.toLowerCase().trim(),
    phone:      phone?.trim()          || null,
    heard_from: heard_from             || null,
    story:      story?.trim()          || null,
    share_ok:   share_ok === true,
  })

  if (error) {
    console.error('[Waitlist] insert error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
