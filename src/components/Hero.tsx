const socials = [
  { label: 'GitHub', url: 'https://github.com/vantage-ola' },
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/olaoluwa-oluwasanya/' },
  { label: 'Medium', url: 'https://iloveracing.medium.com/' },
  { label: 'X', url: 'https://x.com/oosanya2' },

]

export function Hero() {
  return (
    <section className="hero">
      <h1>I build useful software for real people.</h1>
      <p className="hero-intro">
        I'm Olaoluwa. I work across the stack, turning practical ideas into products that are simple to use and built to last.
      </p>
      <div className="hero-socials" aria-label="Social links">
        {socials.map(({ label, url }) => (
          <a key={label} href={url} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        ))}
      </div>
    </section>
  )
}
