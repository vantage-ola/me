import { useState, type FormEvent } from 'react'
import { startPayment } from '../lib/payments'

export function Support() {
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await startPayment({ kind: 'support', amount: Number(amount), email })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not start.')
      setBusy(false)
    }
  }

  return <div className="narrow-page"><div className="page-eyebrow">Support my work</div><h1>Buy me a coffee.</h1>
    <p className="page-lead">If you've found something I've built or written useful, you can send a little support here. Choose an amount from ₦100.</p>
    <div className="support-panel"><form className="offer-form" onSubmit={submit}>
      <label>Amount in naira <div className="amount-input"><span>₦</span><input type="number" min="100" max="1000000" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Enter an amount" required /></div></label>
      <label>Your email <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="For your Paystack receipt" required /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? 'Opening Paystack…' : 'Continue to Paystack'}</button>
      <p className="form-footnote">This is a voluntary contribution, not a session booking.</p>
    </form></div>
  </div>
}
