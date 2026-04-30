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

export const SMS_TEMPLATES = {
  welcome: (name: string) =>
    `Welcome to Precious Post, ${name}! 💌 Your first letter is waiting to be written. Log in to get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,

  monthlyReminder: (name: string) =>
    `Hi ${name}! It's time to send your Precious Post letter this month. Click here to write it: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,

  submitted: (recipientName: string) =>
    `Your letter to ${recipientName} has been submitted! Lauren will print and mail it within 2 business days. 💌`,
}
