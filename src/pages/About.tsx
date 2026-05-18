import { MarkdownRenderer } from '@mdwrk/markdown-renderer-react'
import { loadPage } from '../lib/content'

const content = loadPage('about')

export function About() {
  return <MarkdownRenderer markdown={content} profile="gfm-default" />
}
