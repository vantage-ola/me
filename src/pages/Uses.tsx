import { MarkdownRenderer } from '@mdwrk/markdown-renderer-react'
import { loadPage } from '../lib/content'

const content = loadPage('uses')

export function Uses() {
  return content
    ? <MarkdownRenderer markdown={content} profile="gfm-default" />
    : <p style={{ color: 'var(--fg-muted)' }}>Coming soon.</p>
}
