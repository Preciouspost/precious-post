import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: Request) {
  const { name, email, phone, heard_from, story, share_ok } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
  }

  const supabase = getSupabase()
  const cleanEmail = email.toLowerCase().trim()

  // Check for duplicate (maybeSingle avoids error when no row found)
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, alreadyJoined: true })
  }

  // Try full insert with all fields
  const { error } = await supabase.from('waitlist').insert({
    name:       name?.trim()  || null,
    email:      cleanEmail,
    phone:      phone?.trim() || null,
    heard_from: heard_from    || null,
    story:      story?.trim() || null,
    share_ok:   share_ok === true,
  })

  if (error) {
    // PGRST204 = column doesn't exist yet — fall back to basic columns
    if (error.code === 'PGRST204') {
      const { error: fallbackError } = await supabase.from('waitlist').insert({
        name:  name?.trim()  || null,
        email: cleanEmail,
        phone: phone?.trim() || null,
      })
      if (fallbackError) {
        if (fallbackError.code === '23505') return NextResponse.json({ success: true, alreadyJoined: true })
        console.error('[Waitlist] fallback insert error:', fallbackError.message)
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }
    // Unique violation = already on list
    if (error.code === '23505') {
      return NextResponse.json({ success: true, alreadyJoined: true })
    }
    console.error('[Waitlist] insert error:', error.code, error.message)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
