const socials = [
  { label: 'GitHub', url: 'https://github.com/vantage-ola' },
  { label: 'X', url: 'https://x.com/oosanya2' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/olaoluwa-oluwasanya/' },
]

export function Hero() {
  return (
    <section style={{ marginBottom: '3rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--fg-primary)', margin: '0 0 0.5rem' }}>
        Olaoluwa
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--fg-secondary)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
        Software Engineer and Motorsports Enthusiast.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {socials.map(({ label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--accent)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              borderBottom: '1px solid transparent',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderBottomColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
          >
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
