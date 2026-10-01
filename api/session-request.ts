import { formatNaira, resolveSession } from '../shared/session-pricing.mjs'

const recipient = 'olaoluwasanya1@gmail.com'
const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function field(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function POST(request: Request): Promise<Response> {
  if (Number(request.headers.get('content-length') ?? 0) > 12_000) {
    return json({ error: 'Request is too large.' }, 413)
  }

  let input: Record<string, unknown>
  try {
    input = await request.json() as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Invalid request.' }, 400)

  // A hidden field catches basic form spam without adding friction for visitors.
  if (field(input.website, 200)) return json({ ok: true })

  const name = field(input.name, 100)
  const email = field(input.email, 254)
  const focus = field(input.focus, 80)
  const details = field(input.details, 3000)
  const link = field(input.link, 500)
  const challengeToken = field(input.challengeToken, 2048)
  const hours = input.hours
  const session = resolveSession(input)
  const custom = input.packageId === 'custom'
  const customHours = input.customHours

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || details.length < 12 ||
      !['CV review', 'Portfolio or project review', 'Getting started', 'Something else'].includes(focus) ||
      (!session && !(custom && Number.isInteger(customHours) && Number(customHours) >= 3 && Number(customHours) <= 20)) || !challengeToken ||
      (link && !/^https?:\/\/\S+$/i.test(link))) {
    return json({ error: 'Please check the form and try again.' }, 400)
  }

  const apiKey = env?.RESEND_API_KEY
  const from = env?.RESEND_FROM
  const turnstileSecret = env?.TURNSTILE_SECRET_KEY
  if (!apiKey || !from || !env?.SITE_URL || !env?.PAYSTACK_SECRET_KEY || !turnstileSecret) {
    console.error('[session-request] Email, payment, or challenge is not configured')
    return json({ error: 'The form is unavailable right now. Please try again later.' }, 503)
  }

  // A valid, single-use challenge token is required even for callers that skip the UI.
  try {
    const verificationResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: turnstileSecret, response: challengeToken }),
      signal: AbortSignal.timeout(5000),
    })
    const verification = await verificationResponse.json() as {
      success?: boolean; hostname?: string; action?: string
    }
    const expectedHost = new URL(env.SITE_URL).hostname
    const isTestKey = turnstileSecret === '1x0000000000000000000000000000000AA'
    const isLocalHost = expectedHost === 'localhost' || expectedHost === '127.0.0.1'
    if (!verificationResponse.ok || !verification.success ||
        (isTestKey && !isLocalHost) ||
        (!isTestKey && (verification.hostname !== expectedHost || verification.action !== 'session_request'))) {
      return json({ error: 'Verification failed. Refresh the page and try again.' }, 403)
    }
  } catch (error) {
    console.error('[session-request] Challenge verification failed', error)
    return json({ error: 'Verification is unavailable right now. Please try again later.' }, 502)
  }

  let paymentInstructions = [
    'This is a custom request. Agree the scope, total price, and how the hours will be split by email.',
    'If this is one of the first five people you approve, apply 50% off your agreed quote.',
    'Send a Paystack invoice or Payment Page for the agreed amount. Do not use the fixed session checkout for this quote.',
  ]
  if (session) {
    const paymentUrl = new URL('/sessions/pay', env.SITE_URL)
    const legacy = session.id.startsWith('legacy-')
    paymentUrl.searchParams.set(legacy ? 'hours' : 'package', legacy ? String(hours) : session.id)
    paymentUrl.searchParams.set('email', email)
    // The owner chooses who gets the offer; applicants never receive this token from the API.
    const offerExpires = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60
    const offerKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(env.PAYSTACK_SECRET_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const offerPayload = new TextEncoder().encode(legacy
      ? `first-five:v1:${email.toLowerCase()}:${hours}:${offerExpires}`
      : `first-five:v2:${email.toLowerCase()}:${session.id}:${offerExpires}`)
    const offerSignature = new Uint8Array(await crypto.subtle.sign('HMAC', offerKey, offerPayload))
    const offerHex = Array.from(offerSignature, (byte) => byte.toString(16).padStart(2, '0')).join('')
    const discountedUrl = new URL(paymentUrl)
    discountedUrl.searchParams.set('offer', `${offerExpires}.${offerHex}`)
    paymentInstructions = [
      'Standard payment link:', paymentUrl.toString(), '',
      'For one of the first five people you approve, send this 50% off link instead:', discountedUrl.toString(),
      `Discounted total: ${formatNaira(session.price / 2)}. Link expires in 30 days.`,
      'Only send the discounted link to an approved person. Keep count of the five offers you grant.',
    ]
  }

  const message = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Session: ${session ? `${session.name}, ${session.duration} (${formatNaira(session.price)})` : `${customHours} hours, custom quote requested`}`,
    `Focus: ${focus}`,
    `Link: ${link || 'None provided'}`,
    '',
    'What they want help with:',
    details,
    '',
    ...paymentInstructions,
    'After Paystack confirms payment, send your Calendly link by email.',
  ].join('\n')

  const fingerprint = new TextEncoder().encode(JSON.stringify({ name, email, session: session?.id, customHours: custom ? customHours : undefined, focus, details, link }))
  const digest = await crypto.subtle.digest('SHA-256', fingerprint)
  const idempotencyKey = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject: `Session request from ${name}`,
        text: message,
      }),
    })
    if (!response.ok) {
      let resendError: { name?: string; message?: string } = {}
      try {
        resendError = await response.json() as typeof resendError
      } catch {
        // Keep the HTTP status when Resend does not return a JSON error.
      }
      console.error('[session-request] Resend rejected request', {
        status: response.status,
        name: resendError.name,
        message: resendError.message,
      })
      return json({ error: 'Your request could not be sent. Please try again later.' }, 502)
    }
    return json({ ok: true })
  } catch (error) {
    console.error('[session-request] Email request failed', error)
    return json({ error: 'Your request could not be sent. Please try again later.' }, 502)
  }
}
