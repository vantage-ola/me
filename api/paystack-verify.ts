import { resolveSession } from '../shared/session-pricing.mjs'

const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

export async function GET(request: Request): Promise<Response> {
  const reference = new URL(request.url).searchParams.get('reference') ?? ''
  if (!/^[A-Za-z0-9.=-]{4,100}$/.test(reference)) return json({ error: 'Invalid payment reference.' }, 400)

  const secret = env?.PAYSTACK_SECRET_KEY
  if (!secret) return json({ error: 'Payment verification is unavailable.' }, 503)

  try {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { authorization: `Bearer ${secret}` },
    })
    const result = await response.json() as {
      status?: boolean
      data?: { status?: string; amount?: number; currency?: string; metadata?: PaymentMetadata | string }
    }
    if (!response.ok || !result.status || !result.data) return json({ error: 'Payment could not be verified.' }, 502)

    const { data } = result
    let metadata: PaymentMetadata = {}
    try {
      metadata = typeof data.metadata === 'string' ? JSON.parse(data.metadata) as typeof metadata : data.metadata ?? {}
    } catch {
      metadata = {}
    }
    const kind = metadata.kind
    const session = metadata.pricing_version === 2 ? resolveSession({ packageId: metadata.package }) :
      metadata.pricing_version === undefined && metadata.package === undefined ? resolveSession({ hours: metadata.hours }) : undefined
    const expectedAmount = kind === 'session' && session &&
      (metadata.offer === undefined || metadata.offer === 'first_five')
      ? session.price * (metadata.offer === 'first_five' ? 50 : 100) : null
    const valid = data.status === 'success' && data.currency === 'NGN' &&
      (kind === 'support' ? Number.isInteger(data.amount) && data.amount! >= 10_000 :
        kind === 'session' && expectedAmount !== null && data.amount === expectedAmount)

    return json({ paid: valid, kind: valid ? kind : null, hours: valid && kind === 'session' ? session?.minutes && session.minutes / 60 : null, duration: valid && kind === 'session' ? session?.duration : null })
  } catch (error) {
    console.error('[paystack-verify] Verification failed', error)
    return json({ error: 'Payment could not be verified.' }, 502)
  }
}

type PaymentMetadata = { kind?: string; hours?: number; offer?: string; package?: string; pricing_version?: number }
