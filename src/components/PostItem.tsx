import { Link } from 'react-router-dom'
import type { Post } from '../lib/types'

export function PostItem({ post }: { post: Post }) {
  const { slug, frontmatter: f } = post
  return (
    <Link to={`/writing/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="post-item" style={{
        padding: '1rem 0',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '1rem',
        alignItems: 'baseline',
      }}>
        <time style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {f.date}
        </time>
        <div>
          <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 500, color: 'var(--fg-primary)' }}>
            {f.title}
          </h3>
          {f.excerpt && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>{f.excerpt}</p>
          )}
        </div>
      </article>
    </Link>
  )
}
