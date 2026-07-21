import { useParams, Link } from 'react-router-dom'
import { FaAngleLeft, FaArrowUpRightFromSquare } from 'react-icons/fa6'
import { MarkdownRenderer } from '@mdwrk/markdown-renderer-react'
import { loadProjects } from '../lib/content'

const projects = loadProjects()

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const project = projects.find(p => p.slug === slug)

  if (!project) {
    return (
      <div>
        <p style={{ color: 'var(--fg-muted)' }}>Project not found.</p>
        <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.9rem' }}><FaAngleLeft /> Back to projects</Link>
      </div>
    )
  }

  const { frontmatter: f, content } = project

  return (
    <>
      <Link to="/projects" style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <FaAngleLeft /> Projects
      </Link>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.4rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--fg-primary)' }}>
          {f.title}
        </h1>
        <p style={{ margin: '0 0 1rem', color: 'var(--fg-secondary)', fontSize: '0.9rem' }}>
          {f.role} · {f.period}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {f.links.map(({ label, url }) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent)', fontSize: '0.85rem', textDecoration: 'none' }}>
              {label} <FaArrowUpRightFromSquare />
            </a>
          ))}
        </div>
      </header>
      {content && <MarkdownRenderer markdown={content} profile="gfm-default" />}
    </>
  )
}
