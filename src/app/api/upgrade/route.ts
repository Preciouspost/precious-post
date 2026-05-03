import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, PRICES } from '@/lib/stripe'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id, stripe_customer_id, plan')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: 'No active subscription found.' }, { status: 400 })
  }

  if (profile.plan !== 'single') {
    return NextResponse.json({ error: 'Only Single Post subscribers can upgrade.' }, { status: 400 })
  }

  const stripe = getStripe()
  const triplePriceId = PRICES.triple()

  // Get the current subscription to find the existing item id
  const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
  const existingItemId = subscription.items.data[0]?.id

  if (!existingItemId) {
    return NextResponse.json({ error: 'Could not find subscription item.' }, { status: 400 })
  }

  // Update subscription to triple plan, charging only the prorated difference now
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    items: [{ id: existingItemId, price: triplePriceId }],
    proration_behavior: 'always_invoice',
  })

  // Update profile plan immediately
  await supabase
    .from('profiles')
    .update({ plan: 'triple' })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
