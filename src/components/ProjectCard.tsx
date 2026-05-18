import { Link } from 'react-router-dom'
import type { Project } from '../lib/types'

const statusColor: Record<string, string> = {
  active: 'var(--status-ok)',
  shipped: 'var(--accent)',
  archived: 'var(--fg-muted)',
}

export function ProjectCard({ project }: { project: Project }) {
  const { slug, frontmatter: f } = project
  return (
    <Link
      to={`/projects/${slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <article style={{
        border: '1px solid var(--border-color)',
        borderRadius: 8,
        padding: '1.25rem',
        background: 'var(--bg-panel)',
        transition: 'border-color 0.15s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-primary)' }}>{f.title}</h3>
          <span style={{ fontSize: '0.75rem', color: statusColor[f.status] ?? 'var(--fg-muted)', marginLeft: '1rem', flexShrink: 0 }}>
            {f.status}
          </span>
        </div>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--fg-secondary)' }}>
          {f.role} · {f.period}
        </p>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {f.tags.map(tag => (
            <span key={tag} style={{
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: 999,
              background: 'var(--bg-inset)',
              color: 'var(--fg-muted)',
            }}>
              {tag}
            </span>
          ))}
        </div>
      </article>
    </Link>
  )
}
