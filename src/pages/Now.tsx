import { MarkdownRenderer } from '@mdwrk/markdown-renderer-react'
import { loadPage } from '../lib/content'

const content = loadPage('now')

export function Now() {
  return content
    ? <MarkdownRenderer markdown={content} profile="gfm-default" />
    : <p style={{ color: 'var(--fg-muted)' }}>Coming soon.</p>
}
