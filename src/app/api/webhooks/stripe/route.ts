import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS, notifyAdmin, SMS_TEMPLATES } from '@/lib/twilio'
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
    const letterId = session.metadata?.letter_id
    const sessionType = session.metadata?.type
    const subscriptionId = session.subscription as string

    // Handle one-time letter purchase
    if (sessionType === 'one_time_letter' && userId && letterId) {
      // Only set plan to 'one_time' if user has no subscription plan yet
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('plan, phone, name')
        .eq('user_id', userId)
        .single()

      if (!existingProfile?.plan || existingProfile.plan === 'one_time') {
        await supabase.from('profiles').update({ plan: 'one_time' }).eq('user_id', userId)
      }

      // Submit the letter
      await supabase.from('letters').update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }).eq('id', letterId)

      await notifyAdmin(`💌 New letter submitted! ${existingProfile?.name ?? 'A customer'} sent a One & Done letter. View it at ${process.env.NEXT_PUBLIC_SITE_URL}/admin`)

      return NextResponse.json({ received: true })
    }

    // Handle subscription checkout
    if (userId && plan) {
      // Check if this is an upgrade (user already has a different active plan)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('name, phone, plan')
        .eq('user_id', userId)
        .single()

      const previousPlan = existingProfile?.plan
      const isUpgrade = previousPlan && previousPlan !== plan && previousPlan !== 'one_time'

      await supabase.from('profiles').update({
        plan,
        stripe_subscription_id: subscriptionId,
        stripe_subscription_status: 'active',
      }).eq('user_id', userId)

      // Log the upgrade
      if (isUpgrade) {
        await supabase.from('plan_upgrades').insert({
          user_id: userId,
          upgraded_from: previousPlan,
          upgraded_to: plan,
        })
      }

      if (existingProfile?.phone && !isUpgrade) {
        await sendSMS(existingProfile.phone, SMS_TEMPLATES.welcome(existingProfile.name))
      }

      // If a letter_id was passed (user subscribed from the upsell modal), submit that letter
      if (letterId) {
        await supabase.from('letters').update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        }).eq('id', letterId)
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
