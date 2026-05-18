import { ProjectCard } from '../components/ProjectCard'
import { loadProjects } from '../lib/content'

const projects = loadProjects()

export function Projects() {
  return (
    <>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--fg-primary)' }}>
        Projects
      </h1>
      {projects.length === 0 ? (
        <p style={{ color: 'var(--fg-muted)' }}>No projects yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {projects.map(p => <ProjectCard key={p.slug} project={p} />)}
        </div>
      )}
    </>
  )
}
