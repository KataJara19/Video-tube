import { useEffect, useRef, useState } from 'react'
import Icon from '../atoms/Icon'
import MaterialIcon from '../atoms/MaterialIcon'

// Botón "Crear": elegir entre subir un video o un Short
export default function CreateMenu({ onCreate }) {
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

  const pick = (kind) => {
    setOpen(false)
    onCreate(kind)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Crear"
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-soft px-2.5 text-sm font-medium text-ink hover:bg-soft-strong sm:pr-4"
      >
        <Icon name="plus" />
        <span className="hidden sm:inline">Crear</span>
      </button>
      {open && (
        <ul className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-line bg-surface py-2 shadow-[0_4px_32px_rgba(0,0,0,0.1)]">
          <li>
            <button type="button" onClick={() => pick('video')} className="flex h-10 w-full items-center gap-4 px-4 text-sm hover:bg-soft">
              <MaterialIcon name="myVideos" /> Subir video
            </button>
          </li>
          <li>
            <button type="button" onClick={() => pick('short')} className="flex h-10 w-full items-center gap-4 px-4 text-sm hover:bg-soft">
              <MaterialIcon name="shorts" /> Subir Short
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
