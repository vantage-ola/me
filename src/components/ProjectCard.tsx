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
    <Link to={`/projects/${slug}`} className="project-card-link">
      <article className="project-card">
        <div className="project-card-heading">
          <h3>{f.title}</h3>
          <span className="project-status" style={{ color: statusColor[f.status] ?? 'var(--fg-muted)' }}>
            <i aria-hidden="true" style={{ background: statusColor[f.status] ?? 'var(--fg-muted)' }} />
            {f.status}
          </span>
        </div>
        <p className="project-meta">{f.role} · {f.period}</p>
        <div className="project-tags">
          {f.tags.slice(0, 6).map(tag => <span key={tag}>{tag}</span>)}
          {f.tags.length > 6 && <span>+{f.tags.length - 6}</span>}
        </div>
      </article>
    </Link>
  )
}
