import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import MaterialIcon from '../atoms/MaterialIcon'
import { useAuth } from '../../context/useAuth'

const VISIBLE = 7

// Canales suscritos (guía lateral). Mientras carga muestra skeletons.
export default function ChannelList({ channels, loading, onNavigate }) {
  const { user } = useAuth()
  const [showAll, setShowAll] = useState(false)

  if (!user) {
    return (
      <div className="px-3 py-2">
        <p className="text-sm leading-5">Accede para suscribirte a canales, comentar y dar Me gusta.</p>
        <Link
          to="/login"
          onClick={onNavigate}
          className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-link hover:border-transparent hover:bg-link/10"
        >
          <MaterialIcon name="channel" size={22} /> Acceder
        </Link>
      </div>
    )
  }

  if (loading) {
    return Array.from({ length: 4 }, (_, i) => (
      <div key={i} className="flex h-10 animate-pulse items-center gap-6 px-3" aria-hidden="true">
        <span className="h-6 w-6 rounded-full bg-soft" />
        <span className="h-3 w-24 rounded bg-soft" />
      </div>
    ))
  }

  if (channels.length === 0) {
    return <p className="px-3 py-2 text-xs leading-[18px] text-muted">Suscríbete a canales para ver aquí sus videos y Shorts.</p>
  }

  const shown = showAll ? channels : channels.slice(0, VISIBLE)
  return (
    <>
      {shown.map((c) => (
        <Link key={c.id} to={`/profile/${c.id}`} onClick={onNavigate} className="flex h-10 items-center gap-6 rounded-[10px] px-3 text-sm hover:bg-soft">
          <Avatar name={c.name} size={24} />
          <span className="flex-1 truncate">{c.name}</span>
          {c.has_new && <span className="h-1 w-1 rounded-full bg-link" title="Contenido nuevo" />}
        </Link>
      ))}
      {channels.length > VISIBLE && (
        <button type="button" onClick={() => setShowAll((s) => !s)} className="flex h-10 items-center gap-6 rounded-[10px] px-3 text-left text-sm hover:bg-soft">
          <MaterialIcon name={showAll ? 'showLess' : 'showMore'} />
          {showAll ? 'Mostrar menos' : `Mostrar ${channels.length - VISIBLE} más`}
        </button>
      )}
    </>
  )
}
