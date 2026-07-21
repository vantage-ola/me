import { useState, useEffect, useRef, useCallback } from 'react'

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

const DAMPING = 2.0
const FREQUENCY = 5.5
const INITIAL_ANGLE = 18

function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute('data-theme', id)
}

function readStoredTheme(): ThemeId {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null
  return saved && THEMES.some(t => t.id === saved) ? saved : DEFAULT_THEME
}

export function ThemeSwitcher() {
  const [active, setActive] = useState<ThemeId>(readStoredTheme)
  const dotRefs = useRef<Map<ThemeId, HTMLButtonElement>>(new Map())
  const rafRef = useRef<number | null>(null)
  const swingingId = useRef<ThemeId | null>(null)

  useEffect(() => {
    applyTheme(active)
  }, [active])

  const startPendulum = useCallback((id: ThemeId) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    const el = dotRefs.current.get(id)
    if (!el) return

    swingingId.current = id
    const start = performance.now()
    const dot = el

    function tick() {
      const elapsed = (performance.now() - start) / 1000
      const amplitude = INITIAL_ANGLE * Math.exp(-DAMPING * elapsed)
      const angle = amplitude * Math.cos(2 * Math.PI * FREQUENCY * elapsed)

      dot.style.transform = `rotate(${angle}deg)`

      if (Math.abs(angle) < 0.08 && elapsed > 0.6) {
        dot.style.transform = 'rotate(0deg)'
        swingingId.current = null
        rafRef.current = null
        return
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    startPendulum(active)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setDotRef(id: ThemeId, el: HTMLButtonElement | null) {
    if (el) dotRefs.current.set(id, el)
    else dotRefs.current.delete(id)
  }

  function select(id: ThemeId) {
    if (id === active) return
    setActive(id)
    localStorage.setItem(STORAGE_KEY, id)
    startPendulum(id)
  }

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {THEMES.map(({ id, label, accent, bg }) => (
        <button
          key={id}
          ref={(el) => setDotRef(id, el)}
          title={label}
          onClick={() => select(id)}
          style={{
            width: 14,
            height: 14,
            borderRadius: 8,
            background: accent,
            border: active === id ? '2px solid var(--fg-primary)' : `2px solid ${bg}`,
            outline: active === id ? `1px solid ${accent}` : 'none',
            outlineOffset: 1,
            cursor: 'pointer',
            padding: 0,
            flexShrink: 0,
            transformOrigin: '50% -400%',
            transform: 'rotate(0deg)',
            willChange: 'transform',
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
