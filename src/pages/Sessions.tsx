import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Turnstile } from '../components/Turnstile'
import { formatNaira, sessionPackages } from '../../shared/session-pricing.mjs'

const focusOptions = ['CV review', 'Portfolio or project review', 'Getting started', 'Something else']

export function Sessions() {
  const [packageId, setPackageId] = useState('workshop')
  const [customHours, setCustomHours] = useState(3)
  const selected = sessionPackages.find((option) => option.id === packageId)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [challengeToken, setChallengeToken] = useState('')
  const [challengeResetCount, setChallengeResetCount] = useState(0)
  const onChallengeToken = useCallback((token: string) => setChallengeToken(token), [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!challengeToken) {
      setError('Complete the verification before sending your request.')
      return
    }
    setBusy(true)
    const form = event.currentTarget
    const values = new FormData(form)

    try {
      const response = await fetch('/api/session-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: values.get('name'),
          email: values.get('email'),
          packageId,
          ...(packageId === 'custom' ? { customHours } : {}),
          focus: values.get('focus'),
          link: values.get('link'),
          details: values.get('details'),
          website: values.get('website'),
          challengeToken,
        }),
      })
      const result = await response.json() as { error?: string }
      if (!response.ok) throw new Error(result.error ?? 'Your request could not be sent.')
      setSent(true)
      form.reset()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your request could not be sent.')
    } finally {
      setBusy(false)
      setChallengeToken('')
      setChallengeResetCount((count) => count + 1)
    }
  }

  return (
    <div className="offer-page">
      <div className="page-eyebrow">Work with me</div>
      <h1>Let's work through what's keeping you stuck.</h1>
      <p className="page-lead">One-on-one help for people getting started with software engineering. Bring a CV, a project, or a question about what to learn next.</p>

      <div className="intro-offer">
        <strong>50% off for the first five people I approve</strong>
        <p>Pick a session below. I'll confirm by email if you get one of the five discounted spots before you pay. The discount also applies to an agreed custom quote.</p>
      </div>

      <fieldset className="session-plans">
        <legend>Choose how much time you need</legend>
        <div className="session-plan-grid">
          {sessionPackages.map((option) => <label key={option.id} className={`session-plan${packageId === option.id ? ' selected' : ''}`}>
            <input type="radio" name="session-package" value={option.id} checked={packageId === option.id} onChange={() => setPackageId(option.id)} />
            <span className="plan-duration">{option.duration}</span>
            <strong className="plan-name">{option.name}</strong>
            <span className="plan-description">{option.description}</span>
            <span className="plan-price">{formatNaira(option.price)}</span>
            <span className="plan-saving">{option.hourlyPrice > option.price ? <><s>{formatNaira(option.hourlyPrice)}</s> at the hourly rate. Save {formatNaira(option.hourlyPrice - option.price)}.</> : 'The regular hourly rate.'}</span>
            <span className="plan-intro"><span>First-five offer</span><span><s>{formatNaira(option.price)}</s> <strong>{formatNaira(option.price / 2)}</strong></span></span>
            {option.id === 'workshop' && <span className="plan-fit">Good for a review + changes</span>}
          </label>)}
        </div>
        <label className={`session-plan custom-plan${packageId === 'custom' ? ' selected' : ''}`}>
          <input type="radio" name="session-package" value="custom" checked={packageId === 'custom'} onChange={() => setPackageId('custom')} />
          <span><strong className="plan-name">Multiple hours</strong><span className="plan-description">Need more than two hours or a few sessions? Tell me what you're working on and we'll agree a plan.</span></span>
          <strong className="custom-quote">Ask for a quote</strong>
        </label>
      </fieldset>

      <div className="offer-grid">
        <section className="offer-copy" aria-labelledby="session-about">
          <h2 id="session-about">What we can do</h2>
          <ul className="offer-list">
            <li><strong>CV review</strong><span>Find what's unclear, then improve a section together.</span></li>
            <li><strong>Portfolio or project review</strong><span>Look at what you've built and how you explain it.</span></li>
            <li><strong>Getting started</strong><span>Talk through your current skills and pick useful next steps.</span></li>
          </ul>
          <p>An hour works well for one focused review. Ninety minutes gives us time to make changes together. Choose two hours for a longer walkthrough, or ask about splitting a few hours across sessions.</p>
          <div className="offer-note">
            <span>How it works</span>
            <p>Send a request below. I'll reply by email if I can help, confirm your price, and send a Paystack payment link. Once payment is confirmed, I'll send my Calendly link so you can choose a time.</p>
          </div>
          <p className="offer-small">This is practical feedback from another software engineer. I can't promise a job or rewrite an entire CV during a call.</p>
          <Link className="text-link" to="/support">Just want to support my work?</Link>
        </section>

        <section className="offer-form-panel" aria-labelledby="request-title">
          <div className="form-heading"><div><span className="form-kicker">Session request</span><h2 id="request-title">Tell me what you need</h2></div></div>
          {sent ? (
            <div className="form-success" role="status">
              <h3>Request sent.</h3>
              <p>Thanks for reaching out. I'll read it and reply by email with the next step.</p>
              <button type="button" className="text-button" onClick={() => setSent(false)}>Send another request</button>
            </div>
          ) : (
            <form className="offer-form" onSubmit={submit}>
              <div className="field-row">
                <label> Name <input name="name" type="text" autoComplete="name" maxLength={100} required /></label>
                <label> Email <input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
              </div>
              <p className="selected-session" role="status">{selected ? `${selected.duration} · ${formatNaira(selected.price)} before any first-five discount` : 'Multiple hours · price agreed by email'}</p>
              {packageId === 'custom' && <label>How many hours are you thinking of? <input type="number" min={3} max={20} step={1} value={customHours} onChange={(event) => setCustomHours(Number(event.target.value))} required /><span className="optional">We can split these across a few calls.</span></label>}
              <label>What should we focus on? <select name="focus" required defaultValue=""><option value="" disabled>Choose one</option>{focusOptions.map((focus) => <option key={focus}>{focus}</option>)}</select></label>
              <label>What would you like help with? <textarea name="details" rows={5} minLength={12} maxLength={3000} placeholder="A few sentences are enough." required /></label>
              <label>Relevant link <span className="optional">(optional)</span><input name="link" type="url" placeholder="CV, portfolio, GitHub, or project link" maxLength={500} /></label>
              <div className="honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
              <Turnstile onToken={onChallengeToken} resetCount={challengeResetCount} />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" type="submit" disabled={busy || !challengeToken}>{busy ? 'Sending…' : 'Send request'}</button>
              <p className="form-footnote">No payment yet. I'll confirm your price and any discount by email first. I'll only use your email to arrange this session.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
