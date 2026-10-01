import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import Icon from '../atoms/Icon'

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Cierra el menú al hacer clic fuera o presionar Escape
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
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menú de la cuenta"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full"
      >
        <Avatar name={user.name} size={32} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl border border-line bg-surface py-2 shadow-[0_4px_32px_rgba(0,0,0,0.1)]">
          <div className="flex gap-4 px-4 pb-3 pt-2">
            <Avatar name={user.name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-base text-ink">{user.name}</p>
              <p className="truncate text-sm text-muted">{user.email}</p>
              <Link to="/profile" onClick={() => setOpen(false)} className="mt-1 inline-block text-sm text-link">
                Ver tu perfil
              </Link>
            </div>
          </div>
          <div className="border-t border-line pt-2">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex h-10 items-center gap-4 px-4 text-sm hover:bg-soft"
            >
              <Icon name="library" /> Mis videos
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-10 w-full items-center gap-4 px-4 text-left text-sm hover:bg-soft"
            >
              <Icon name="logout" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
