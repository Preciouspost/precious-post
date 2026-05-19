import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, ONE_TIME_PRICE_DATA } from '@/lib/stripe'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { letter_id } = await req.json() as { letter_id?: string }
  if (!letter_id) return NextResponse.json({ error: 'letter_id is required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email, name')
    .eq('user_id', user.id)
    .single()

  const stripe = getStripe()
  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile?.email ?? user.email,
      name: profile?.name ?? '',
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('user_id', user.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL

  const priceConfig = process.env.STRIPE_ONE_TIME_PRICE_ID
    ? { price: process.env.STRIPE_ONE_TIME_PRICE_ID, quantity: 1 }
    : { price_data: ONE_TIME_PRICE_DATA, quantity: 1 }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [priceConfig],
    success_url: `${siteUrl}/dashboard?submitted=1`,
    cancel_url: `${siteUrl}/dashboard`,
    metadata: {
      user_id: user.id,
      letter_id,
      type: 'one_time_letter',
    },
  })

  return NextResponse.json({ url: session.url })
}
