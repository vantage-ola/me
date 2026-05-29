import { useState, useEffect } from 'react'

const THEMES = [
  { id: 'lander-dark',       label: 'Night',  accent: '#818cf8', bg: '#020617' },
  { id: 'lander-light',      label: 'Day',    accent: '#4f46e5', bg: '#f8fafc' },
  { id: 'ferrous-monolith',  label: 'Carbon', accent: '#00f3ff', bg: '#0a0a0a' },
  { id: 'zinc',              label: 'Steel',  accent: '#0ea5e9', bg: '#e4e4e7' },
  { id: 'acid-etched',       label: 'Acid',   accent: '#ccff00', bg: '#f4f6f0' },
  { id: 'micropress',        label: 'Press',  accent: '#ff3c00', bg: '#000000' },
] as const

type ThemeId = typeof THEMES[number]['id']
const DEFAULT_THEME: ThemeId = 'lander-dark'
const STORAGE_KEY = 'mdwrk-portfolio-theme'

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
}

export function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>(DEFAULT_THEME)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    const initial = saved && THEMES.some(t => t.id === saved) ? saved : DEFAULT_THEME
    setActive(initial)
    applyTheme(initial)
  }, [])

  function select(id: ThemeId) {
    setActive(id)
    applyTheme(id)
    localStorage.setItem(STORAGE_KEY, id)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {THEMES.map(({ id, label, accent, bg }) => (
        <button
          key={id}
          title={label}
          onClick={() => select(id)}
          style={{
            width: 14,
            height: 14,
            background: accent,
            border: active === id ? '2px solid var(--fg-primary)' : `2px solid ${bg}`,
            outline: active === id ? `1px solid ${accent}` : 'none',
            outlineOffset: 1,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            opacity: active === id ? 1 : 0.6,
            transition: 'opacity 0.15s, border-color 0.15s',
          }}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={active === id}
        />
      ))}
    </div>
  )
}
