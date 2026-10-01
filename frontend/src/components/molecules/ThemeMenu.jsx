import { useEffect, useRef, useState } from 'react'
import MaterialIcon from '../atoms/MaterialIcon'
import { THEME_EVENT, THEMES, themeService } from '../../services/themeService'

/**
 * Muestras de color. compact=true: una sola fila de círculos (guía lateral).
 * Todas las instancias leen el tema del documento, así que se mantienen sincronizadas.
 */
export function ThemeSwatches({ compact = false }) {
  const [current, setCurrent] = useState(() => themeService.current())

  useEffect(() => {
    const sync = () => setCurrent(themeService.current())
    window.addEventListener(THEME_EVENT, sync)
    return () => window.removeEventListener(THEME_EVENT, sync)
  }, [])

  const choose = (key) => {
    themeService.apply(key)
    setCurrent(key)
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 px-3" role="radiogroup" aria-label="Color del tema">
        {THEMES.map((t) => (
          <button
            key={t.key}
            type="button"
            role="radio"
            aria-checked={current === t.key}
            aria-label={t.label}
            title={t.label}
            onClick={() => choose(t.key)}
            className={`h-7 w-7 rounded-full border border-black/10 ${current === t.key ? 'ring-2 ring-ink ring-offset-2 ring-offset-page' : ''}`}
            style={{ background: `linear-gradient(135deg, ${t.page} 0 50%, ${t.accent} 50% 100%)` }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Temas">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={current === t.key}
                onClick={() => choose(t.key)}
                className={`flex flex-col items-center gap-1.5 rounded-lg p-2 text-xs transition-colors hover:bg-soft ${current === t.key ? 'bg-soft font-medium' : ''}`}
              >
                <span
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10"
                  style={{ background: `linear-gradient(135deg, ${t.page} 0 50%, ${t.accent} 50% 100%)` }}
                >
                  {current === t.key && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-ink shadow">
                      <MaterialIcon name="check" size={16} />
                    </span>
                  )}
                </span>
                {t.label}
              </button>
            ))}
          </div>
  )
}

// Botón de paleta: cambia el color de fondo y de acento de toda la interfaz
export default function ThemeMenu({ className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Color del tema"
        aria-expanded={open}
        title="Color del tema"
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-soft"
      >
        <MaterialIcon name="palette" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-line bg-surface p-3 shadow-[0_4px_32px_rgba(0,0,0,0.1)] max-sm:fixed max-sm:inset-x-3 max-sm:top-14 max-sm:w-auto">
          <p className="px-1 text-sm font-medium">Color del tema</p>
          <p className="mb-3 px-1 text-xs text-muted">Cambia el fondo, los botones y los iconos.</p>
          <ThemeSwatches />
        </div>
      )}
    </div>
  )
}
