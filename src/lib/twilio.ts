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

export async function notifyAdmin(message: string) {
  const adminPhone = process.env.ADMIN_PHONE
  if (!adminPhone) return
  return sendSMS(adminPhone, message)
}

const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://precious-post.vercel.app'

export const SMS_TEMPLATES = {
  welcome: (name: string) => {
    const first = name.split(' ')[0]
    return `Welcome to Precious Post, ${first}! 💌 Save this number as Precious Post so you don't miss updates. Your first letter is waiting to be written: ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`
  },

  monthlyReminder: (name: string) => {
    const first = name.split(' ')[0]
    return `Hi ${first}! 💌 It's time to send your Precious Post letter this month. Write it here: ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`
  },

  nudgeReminder: (name: string) => {
    const first = name.split(' ')[0]
    return `Hi ${first}! Just a reminder — your Precious Post letter hasn't been sent yet this month. A few minutes is all it takes 💌 ${APP_URL}/dashboard — Reply STOP to unsubscribe from texts.`
  },

  oneTimeNudge: (name: string) => {
    const first = name.split(' ')[0]
    return `Hi ${first}! It's a new month — want to send another Precious Post letter? 💌 ${APP_URL}/letters/new — Reply STOP to unsubscribe from texts.`
  },
}
