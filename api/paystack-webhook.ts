const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

type Charge = {
  status?: string
  currency?: string
  amount?: number
  reference?: string
  metadata?: string | { kind?: string } | null
  customer?: { email?: string }
}

export async function POST(request: Request): Promise<Response> {
  const paystackSecret = env?.PAYSTACK_SECRET_KEY
  if (!paystackSecret) return json({ error: 'Webhook is not configured.' }, 503)

  const signature = request.headers.get('x-paystack-signature') ?? ''
  if (!/^[a-f0-9]{128}$/i.test(signature)) return json({ error: 'Invalid signature.' }, 401)

  let rawBody: ArrayBuffer
  try {
    rawBody = await request.arrayBuffer()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  if (rawBody.byteLength > 100_000) return json({ error: 'Request is too large.' }, 413)

  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(paystackSecret), { name: 'HMAC', hash: 'SHA-512' }, false, ['verify'],
  )
  const signatureBytes = Uint8Array.from(signature.match(/../g)!, (pair) => parseInt(pair, 16))
  if (!await crypto.subtle.verify('HMAC', key, signatureBytes, rawBody)) {
    return json({ error: 'Invalid signature.' }, 401)
  }

  let event: { event?: string; data?: Charge }
  try {
    event = JSON.parse(new TextDecoder().decode(rawBody)) as typeof event
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }
  if (event.event !== 'charge.success' || !event.data) return json({ ok: true })

  const charge = event.data
  let metadata: { kind?: string } = {}
  try {
    metadata = typeof charge.metadata === 'string' ? JSON.parse(charge.metadata) as typeof metadata : charge.metadata ?? {}
  } catch {
    return json({ ok: true })
  }
  if (metadata.kind !== 'support') return json({ ok: true })

  const email = charge.customer?.email?.trim() ?? ''
  if (charge.status !== 'success' || charge.currency !== 'NGN' ||
      !Number.isInteger(charge.amount) || charge.amount! < 10_000 || charge.amount! > 100_000_000 ||
      !/^[A-Za-z0-9.=-]{4,100}$/.test(charge.reference ?? '') ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('[paystack-webhook] Invalid support charge')
    return json({ ok: true })
  }

  const resendKey = env?.RESEND_API_KEY
  const from = env?.RESEND_FROM
  if (!resendKey || !from) return json({ error: 'Email is not configured.' }, 503)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resendKey}`,
        'content-type': 'application/json',
        'idempotency-key': `support-thanks/${charge.reference}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Thanks for the support',
        text: 'Hi,\n\nThanks for supporting my work. I really appreciate it.\n\nOlaoluwa',
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.error('[paystack-webhook] Resend rejected thank you email', response.status)
      return json({ error: 'Email could not be sent.' }, 502)
    }
    return json({ ok: true })
  } catch (error) {
    console.error('[paystack-webhook] Thank you email failed', error)
    return json({ error: 'Email could not be sent.' }, 502)
  }
}
