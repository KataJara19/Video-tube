import { useEffect, useRef, useState } from 'react'
import MaterialIcon from '../atoms/MaterialIcon'

const OPTIONS = [
  { value: 'top', label: 'Comentarios principales' },
  { value: 'new', label: 'Más recientes primero' },
]

// "Ordenar por" de los comentarios
export default function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-sm font-medium" aria-expanded={open}>
        <MaterialIcon name="sort" /> Ordenar por
      </button>
      {open && (
        <ul className="absolute left-0 top-9 z-30 w-60 rounded-xl border border-line bg-surface py-2 shadow-[0_4px_32px_rgba(0,0,0,0.1)]">
          {OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm hover:bg-soft ${value === o.value ? 'bg-soft font-medium' : ''}`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
