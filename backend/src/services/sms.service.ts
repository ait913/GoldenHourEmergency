import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

/**
 * SMS送信
 * @param to E.164形式の電話番号（例: +819039655913）
 * @param body 送信メッセージ
 */
export async function sendSms(to: string, body: string): Promise<void> {
  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[sms.service] Twilio credentials not set, skipping SMS send')
    return
  }

  const client = twilio(accountSid, authToken)
  await client.messages.create({
    body,
    from: fromNumber,
    to,
  })
}
