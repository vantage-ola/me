import { useParams, Link } from 'react-router-dom'
import { FaAngleLeft } from 'react-icons/fa6'
import { MarkdownRenderer } from '@mdwrk/markdown-renderer-react'
import { loadPosts } from '../lib/content'

const posts = loadPosts()

export function PostDetail() {
  const { slug } = useParams<{ slug: string }>()
  const post = posts.find(p => p.slug === slug)

  if (!post) {
    return (
      <div>
        <p style={{ color: 'var(--fg-muted)' }}>Post not found.</p>
        <Link to="/writing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.9rem' }}><FaAngleLeft /> Back to writing</Link>
      </div>
    )
  }

  const { frontmatter: f, content } = post

  return (
    <>
      <Link to="/writing" style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <FaAngleLeft /> Writing
      </Link>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--fg-primary)' }}>
          {f.title}
        </h1>
        <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: '0.85rem' }}>{f.date}</p>
      </header>
      <MarkdownRenderer markdown={content} profile="gfm-default" />
    </>
  )
}
