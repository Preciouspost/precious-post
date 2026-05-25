import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export async function sendSMS(to: string, body: string) {
  if (!to) return
  return client.messages.create({
    body,
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
  })
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precious-post.vercel.app'

export const SMS_TEMPLATES = {
  welcome: (name: string) =>
    `Welcome to Precious Post, ${name}! 💌 Your first letter is waiting to be written. Log in to get started: ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`,

  monthlyReminder: (name: string) =>
    `Hi ${name}! It's time to send your Precious Post letter this month. Write it here: ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`,

  submitted: (recipientName: string) =>
    `Your letter to ${recipientName} has been submitted! Lauren will print and mail it within 2 business days. 💌`,

  nudgeReminder: (name: string) =>
    `Hi ${name}! Just a reminder — your Precious Post letter hasn't been sent yet this month. A few minutes is all it takes 💌 ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`,

  oneTimeNudge: (name: string) =>
    `Hi ${name}! It's a new month — want to send another Precious Post letter? It's just $15, no subscription needed. 💌 ${APP_URL}/letters/new — Reply STOP to unsubscribe from texts.`,
}
