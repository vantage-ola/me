import { Link } from 'react-router-dom'

export function NotFound() {
  return <div className="narrow-page"><div className="page-eyebrow">404</div><h1>This page doesn't exist.</h1><p className="page-lead">The link may have changed. You can find my projects, writing, and sessions from the home page.</p><Link className="text-link" to="/">Back to home</Link></div>
}
