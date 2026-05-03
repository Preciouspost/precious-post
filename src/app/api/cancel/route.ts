import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reason } = await req.json()

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 })
  }

  const stripe = getStripe()

  // Cancel at period end so they keep access until the billing cycle ends
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  })

  // Record the cancellation reason
  await supabase
    .from('profiles')
    .update({ cancellation_reason: reason ?? null })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
