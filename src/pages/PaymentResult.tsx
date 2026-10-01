import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

type PaymentState = { status: 'checking' | 'paid' | 'unpaid' | 'error'; kind?: 'session' | 'support'; duration?: string }

export function PaymentResult() {
  const [params] = useSearchParams()
  const reference = params.get('reference')
  const [result, setResult] = useState<PaymentState>({ status: 'checking' })

  useEffect(() => {
    if (!reference) return
    const controller = new AbortController()
    fetch(`/api/paystack-verify?reference=${encodeURIComponent(reference)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Verification failed')
        return response.json() as Promise<{ paid: boolean; kind?: 'session' | 'support'; duration?: string }>
      })
      .then((data) => setResult(data.paid ? { status: 'paid', kind: data.kind, duration: data.duration } : { status: 'unpaid' }))
      .catch(() => { if (!controller.signal.aborted) setResult({ status: 'error' }) })
    return () => controller.abort()
  }, [reference])

  const status = reference ? result.status : 'error'

  return <div className="narrow-page"><div className="page-eyebrow">Paystack</div>
    {status === 'checking' && <><h1>Checking your payment.</h1><p className="page-lead">This should only take a moment.</p></>}
    {status === 'paid' && result.kind === 'support' && <><h1>Thank you for the support.</h1><p className="page-lead">Your payment was confirmed. I appreciate it.</p></>}
    {status === 'paid' && result.kind === 'session' && <><h1>Payment confirmed.</h1><p className="page-lead">Thanks for booking {result.duration}. Reply to my email with your Paystack reference, and I'll send my Calendly link after checking the payment.</p><p>Your reference: <code>{reference}</code></p></>}
    {status === 'unpaid' && <><h1>Payment isn't confirmed yet.</h1><p className="page-lead">If you just paid, give it a moment and refresh this page. You can also check your Paystack receipt.</p></>}
    {status === 'error' && <><h1>I couldn't check that payment.</h1><p className="page-lead">Please check your Paystack receipt. If money left your account, email <a href="mailto:olaoluwasanya1@gmail.com">olaoluwasanya1@gmail.com</a> with the reference from Paystack.</p></>}
    <Link className="text-link" to="/">Back to home</Link>
  </div>
}
