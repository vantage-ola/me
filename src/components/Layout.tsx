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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-ui)' }}>
      <nav style={{
        padding: '1rem 2rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {navLinks.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--fg-secondary)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <main style={{
        flex: 1,
        maxWidth: 720,
        width: '100%',
        margin: '0 auto',
        padding: '2.5rem 1.5rem',
        color: 'var(--fg-primary)',
      }}>
        {children}
      </main>

      <footer style={{
        padding: '1rem 2rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.8rem',
        color: 'var(--fg-muted)',
        textAlign: 'center',
      }}>
        © {new Date().getFullYear()} Olaoluwa
      </footer>
    </div>
  )
}
