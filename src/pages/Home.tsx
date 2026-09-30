import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { ProjectCard } from '../components/ProjectCard'
import { PostItem } from '../components/PostItem'
import { loadProjects, loadPosts } from '../lib/content'
import { FaAngleRight } from 'react-icons/fa6'


const featured = loadProjects().filter(p => p.frontmatter.highlight)
const recentPosts = loadPosts().slice(0, 3)

export function Home() {
  return (
    <>
      <Hero />

      <section className="home-session-callout">
        <div>
          <span className="page-eyebrow">One-on-one sessions</span>
          <h2>Stuck on your next step in software engineering?</h2>
          <p>Bring your CV, a project, or a question. We'll work through it together.</p>
        </div>
        <Link to="/sessions">See how sessions work <FaAngleRight /></Link>
      </section>

      {featured.length > 0 && (
        <section style={{ marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projects
            </h2>
            <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none' }}>
              All projects <FaAngleRight />
            </Link>
          </div>
          <div className="project-grid">
            {featured.map(p => <ProjectCard key={p.slug} project={p} />)}
          </div>
        </section>
      )}

      {recentPosts.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Writing
            </h2>
            <Link to="/writing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none' }}>
              All posts <FaAngleRight />
            </Link>
          </div>
          {recentPosts.map(p => <PostItem key={p.slug} post={p} />)}
        </section>
      )}
    </>
  )
}
