import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, SMS_TEMPLATES } from '@/lib/twilio'
import Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan as 'single' | 'triple'
    const subscriptionId = session.subscription as string

    if (userId && plan) {
      await supabase.from('profiles').update({
        plan,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: 'active',
      }).eq('user_id', userId)

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('user_id', userId)
        .single()

      if (profile?.phone) {
        await sendSMS(profile.phone, SMS_TEMPLATES.welcome(profile.name))
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (profile) {
      await supabase.from('profiles').update({
        stripe_subscription_status: subscription.status,
        ...(subscription.status !== 'active' ? { plan: null } : {}),
      }).eq('user_id', profile.user_id)
    }
  }

  return NextResponse.json({ received: true })
}
