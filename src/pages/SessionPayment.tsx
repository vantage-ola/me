import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { startPayment } from '../lib/payments'

export function SessionPayment() {
  const [params] = useSearchParams()
  const hours = Number(params.get('hours'))
  const validHours = hours === 1 || hours === 2
  const offer = params.get('offer') ?? undefined
  const amount = hours * (offer ? 5000 : 10000)
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validHours) return
    setBusy(true)
    setError('')
    try {
      await startPayment({ kind: 'session', hours, email, ...(offer ? { offer } : {}) })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not start.')
      setBusy(false)
    }
  }

  return <div className="narrow-page"><div className="page-eyebrow">Session payment</div><h1>Complete your booking payment.</h1>
    {validHours ? <><p className="page-lead">{hours} {hours === 1 ? 'hour' : 'hours'} of one-on-one software engineering help. {offer && <span className="offer-highlight">50% offer link. </span>}Total: ₦{amount.toLocaleString('en-NG')}.</p>
      <p>Use this page after I've confirmed your request by email. {offer && 'Use the same email address I sent this offer to. '}After paying, reply to my email with the Paystack reference shown on the confirmation page. I'll check it and send my Calendly link.</p>
      <form className="offer-form payment-form" onSubmit={submit}><label>Your email <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Opening Paystack…' : `Pay ₦${amount.toLocaleString('en-NG')} with Paystack`}</button></form>
    </> : <p>This payment link is incomplete. Please use the link I sent by email or <Link className="text-link" to="/sessions">request a session</Link>.</p>}
  </div>
}
