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

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || details.length < 12 ||
      !['CV review', 'Portfolio or project review', 'Getting started', 'Something else'].includes(focus) ||
      !challengeToken ||
      (link && !/^https?:\/\/\S+$/i.test(link))) {
    return json({ error: 'Please check the form and try again.' }, 400)
  }

  const apiKey = env?.RESEND_API_KEY
  const from = env?.RESEND_FROM
  const turnstileSecret = env?.TURNSTILE_SECRET_KEY
  if (!apiKey || !from || !env?.SITE_URL || !turnstileSecret) {
    console.error('[session-request] Email or challenge is not configured')
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

  const message = [
    `Name: ${name}`,
    `Email: ${email}`,
    'Session: Free, 1 hour 30 minutes',
    `Focus: ${focus}`,
    `Link: ${link || 'None provided'}`,
    '',
    'What they want help with:',
    details,
    '',
    'Reply by email and send your Calendly link if you can help.',
  ].join('\n')

  const fingerprint = new TextEncoder().encode(JSON.stringify({ name, email, focus, details, link }))
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
