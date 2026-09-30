const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function POST(request: Request): Promise<Response> {
  let input: Record<string, unknown>
  try {
    input = await request.json() as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const email = typeof input.email === 'string' ? input.email.trim().slice(0, 254) : ''
  const kind = input.kind
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (kind !== 'support' && kind !== 'session')) {
    return json({ error: 'Please enter a valid email address.' }, 400)
  }

  let amountNaira: number
  if (kind === 'session') {
    if (input.hours !== 1 && input.hours !== 2) return json({ error: 'Choose one or two hours.' }, 400)
    amountNaira = input.hours * 10_000
  } else {
    amountNaira = Number(input.amount)
    if (!Number.isInteger(amountNaira) || amountNaira < 100 || amountNaira > 1_000_000) {
      return json({ error: 'Enter an amount from ₦100 to ₦1,000,000.' }, 400)
    }
  }

  const secret = env?.PAYSTACK_SECRET_KEY
  const siteUrl = env?.SITE_URL
  if (!secret || !siteUrl) {
    console.error('[paystack-init] Paystack or site URL is not configured')
    return json({ error: 'Payments are unavailable right now. Please try again later.' }, 503)
  }

  const callbackUrl = new URL('/payment-result', siteUrl)
  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        email,
        amount: amountNaira * 100,
        currency: 'NGN',
        callback_url: callbackUrl.toString(),
        metadata: JSON.stringify({ kind, ...(kind === 'session' ? { hours: input.hours } : {}) }),
      }),
    })
    const result = await response.json() as { status?: boolean; data?: { authorization_url?: string } }
    if (!response.ok || !result.status || !result.data?.authorization_url?.startsWith('https://checkout.paystack.com/')) {
      console.error('[paystack-init] Paystack initialization failed', response.status)
      return json({ error: 'Checkout could not start. Please try again.' }, 502)
    }
    return json({ url: result.data.authorization_url })
  } catch (error) {
    console.error('[paystack-init] Paystack request failed', error)
    return json({ error: 'Checkout could not start. Please try again.' }, 502)
  }
}
