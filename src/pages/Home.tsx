import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { ProjectCard } from '../components/ProjectCard'
import { PostItem } from '../components/PostItem'
import { loadProjects, loadPosts } from '../lib/content'
import { FaAngleRight } from "react-icons/fa6";

const featured = loadProjects().filter(p => p.frontmatter.highlight)
const recentPosts = loadPosts().slice(0, 3)

export function Home() {
  return (
    <>
      <Hero />

      {featured.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--fg-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Projects
            </h2>
            <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', color: 'var(--accent)', textDecoration: 'none' }}>
              All projects <FaAngleRight />
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
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
