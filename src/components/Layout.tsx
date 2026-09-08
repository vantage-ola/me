import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/writing', label: 'Writing' },
  { to: '/uses', label: 'Uses' },
  { to: '/now', label: 'Now' },
]

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-sidebar">
        <NavLink to="/" className="site-identity" aria-label="Olaoluwa — home">
          <strong>Olaoluwa</strong>
          <small>Software Engineer</small>
        </NavLink>

        <nav className="site-nav" aria-label="Main navigation">
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `site-nav-link${isActive ? ' is-active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="site-content">
        <main className="site-main">{children}</main>
        <footer className="site-footer">
          <span>© {new Date().getFullYear()} olaoluwa</span>
          <span>
            powered by{' '}
            <a href="https://github.com/groupsum/markdown_workspace" target="_blank" rel="noopener noreferrer">
              @mdwrk
            </a>
          </span>
        </footer>
      </div>
    </div>
  )
}
