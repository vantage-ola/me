import { useEffect, useRef, useState } from 'react'

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string
    action: string
    theme: 'dark'
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
  }) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window { turnstile?: TurnstileApi }
}

const testSiteKey = '1x00000000000000000000AA'
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || (import.meta.env.DEV ? testSiteKey : '')
let scriptPromise: Promise<void> | undefined

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.onload = () => window.turnstile ? resolve() : reject(new Error('Turnstile did not load'))
      script.onerror = () => reject(new Error('Turnstile did not load'))
      document.head.appendChild(script)
    }).catch((error: unknown) => {
      scriptPromise = undefined
      throw error
    })
  }
  return scriptPromise!
}

export function Turnstile({ onToken, resetCount }: { onToken: (token: string) => void; resetCount: number }) {
  const container = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!siteKey || !container.current) return
    let mounted = true
    loadScript().then(() => {
      if (!mounted || !container.current || !window.turnstile) return
      widgetId.current = window.turnstile.render(container.current, {
        sitekey: siteKey,
        action: 'session_request',
        theme: 'dark',
        callback: onToken,
        'expired-callback': () => onToken(''),
        'error-callback': () => { onToken(''); setFailed(true) },
      })
    }).catch(() => { if (mounted) setFailed(true) })
    return () => {
      mounted = false
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current)
      widgetId.current = null
    }
  }, [onToken])

  useEffect(() => {
    if (resetCount > 0 && widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
  }, [resetCount])

  if (!siteKey) return <p className="form-error" role="status">Requests are temporarily unavailable.</p>
  return <div className="challenge-field"><div ref={container} />{failed && <p className="form-error" role="alert">Verification couldn't load. Refresh the page and try again.</p>}</div>
}
