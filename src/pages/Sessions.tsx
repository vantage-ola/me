import { useCallback, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Turnstile } from '../components/Turnstile'

const focusOptions = ['CV review', 'Portfolio or project review', 'Getting started', 'Something else']

export function Sessions() {
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
        <strong>Free, 1 hour 30 minutes, one-on-one</strong>
        <p>No payment. Send a request below and I'll reply by email with a link to pick a time.</p>
      </div>

      <figure className="testimonial">
        <blockquote>
          <p>You helped me see things from a different perspective and gain clarity on what I'm truly passionate about, the direction I want to pursue, and the steps I can take to deepen my knowledge while creating opportunities to earn from it.</p>
          <p>I would definitely recommend to anyone who needs genuine support and advice regarding any dilemma in their niche.</p>
        </blockquote>
        <figcaption><strong>Japheth</strong><span>After our session</span></figcaption>
      </figure>

      <div className="offer-grid">
        <section className="offer-copy" aria-labelledby="session-about">
          <h2 id="session-about">What we can do</h2>
          <ul className="offer-list">
            <li><strong>CV review</strong><span>Find what's unclear, then improve a section together.</span></li>
            <li><strong>Portfolio or project review</strong><span>Look at what you've built and how you explain it.</span></li>
            <li><strong>Getting started</strong><span>Talk through your current skills and pick useful next steps.</span></li>
          </ul>
          <p>Ninety minutes gives us time to talk through where you are, look at your work, and leave with clear next steps.</p>
          <div className="offer-note">
            <span>How it works</span>
            <p>Send a request below. I'll reply by email if I can help and send my Calendly link so you can choose a time.</p>
          </div>
          <p className="offer-small">I'll share practical feedback from my experience building software. I can't promise a job or rewrite an entire CV during a call.</p>
          <Link className="text-link" to="/support">Found it useful? You can support my work.</Link>
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
              <p className="selected-session">1 hour 30 minutes · free</p>
              <label>What should we focus on? <select name="focus" required defaultValue=""><option value="" disabled>Choose one</option>{focusOptions.map((focus) => <option key={focus}>{focus}</option>)}</select></label>
              <label>What would you like help with? <textarea name="details" rows={5} minLength={12} maxLength={3000} placeholder="A few sentences are enough." required /></label>
              <label>Relevant link <span className="optional">(optional)</span><input name="link" type="url" placeholder="CV, portfolio, GitHub, or project link" maxLength={500} /></label>
              <div className="honeypot" aria-hidden="true"><label>Website<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label></div>
              <Turnstile onToken={onChallengeToken} resetCount={challengeResetCount} />
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-button" type="submit" disabled={busy || !challengeToken}>{busy ? 'Sending…' : 'Send request'}</button>
              <p className="form-footnote">I'll only use your email to arrange this session.</p>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
