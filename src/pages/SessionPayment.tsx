import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { startPayment } from '../lib/payments'
import { formatNaira, resolveSession } from '../../shared/session-pricing.mjs'

export function SessionPayment() {
  const [params] = useSearchParams()
  const hours = Number(params.get('hours'))
  const packageId = params.get('package') ?? undefined
  const session = resolveSession({ packageId, hours })
  const offer = params.get('offer') ?? undefined
  const amount = session ? session.price / (offer ? 2 : 1) : 0
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session) return
    setBusy(true)
    setError('')
    try {
      await startPayment({ kind: 'session', ...(packageId ? { packageId } : { hours }), email, ...(offer ? { offer } : {}) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not start.')
      setBusy(false)
    }
  }

  return <div className="narrow-page"><div className="page-eyebrow">Session payment</div><h1>Complete your booking payment.</h1>
    {session ? <><p className="page-lead">{session.duration} of one-on-one software engineering help. {offer && <span className="offer-highlight">50% offer link. </span>}Total: {formatNaira(amount)}.</p>
      <p>Use this page after I've confirmed your request by email. {offer && 'Use the same email address I sent this offer to. '}After paying, reply to my email with the Paystack reference shown on the confirmation page. I'll check it and send my Calendly link.</p>
      <form className="offer-form payment-form" onSubmit={submit}><label>Your email <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {offer && <p className="checkout-discount"><s>{formatNaira(session.price)}</s> <strong>{formatNaira(amount)}</strong><span>First-five offer, checked before checkout</span></p>}
        {error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Opening Paystack…' : `Pay ${formatNaira(amount)} with Paystack`}</button></form>
    </> : <p>This payment link is incomplete. Please use the link I sent by email or <Link className="text-link" to="/sessions">request a session</Link>.</p>}
  </div>
}
