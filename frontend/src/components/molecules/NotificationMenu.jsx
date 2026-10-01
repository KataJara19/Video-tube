import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import MaterialIcon from '../atoms/MaterialIcon'
import { notificationService } from '../../services/notificationService'
import { timeAgo } from '../../services/formatters'

function message(n) {
  const title = n.video_title ? `: ${n.video_title}` : ''
  switch (n.type) {
    case 'new_video':
      return <>{<b className="font-medium">{n.actor.name}</b>} subió {n.video_is_short ? 'un Short' : 'un video'}{title}</>
    case 'comment':
      return <>{<b className="font-medium">{n.actor.name}</b>} comentó tu video{title}</>
    case 'reply':
      return <>{<b className="font-medium">{n.actor.name}</b>} respondió a tu comentario{title}</>
    case 'subscribe':
      return <>{<b className="font-medium">{n.actor.name}</b>} se suscribió a tu canal</>
    default:
      return n.actor.name
  }
}

// Campana de notificaciones con contador de no leídas
export default function NotificationMenu() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({ loaded: false, unread_count: 0, items: [] })
  const ref = useRef(null)

  const load = useCallback(
    () =>
      notificationService
        .list()
        .then((d) => setData({ loaded: true, ...d }))
        .catch(() => setData((d) => ({ ...d, loaded: true }))),
    [],
  )

  // Carga inicial y actualización cada 60 segundos
  useEffect(() => {
    load()
    const timer = setInterval(load, 60000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) {
      load()
      if (data.unread_count > 0) notificationService.readAll().then(() => setData((d) => ({ ...d, unread_count: 0 })))
    }
  }

  const go = (n) => {
    setOpen(false)
    navigate(n.video_id ? `/watch/${n.video_id}` : `/profile/${n.actor.id}`)
  }

  const badge = data.unread_count > 9 ? '9+' : data.unread_count

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notificaciones${data.unread_count ? `: ${data.unread_count} sin leer` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-soft"
      >
        <MaterialIcon name={open ? 'bellFilled' : 'bell'} />
        {data.unread_count > 0 && (
          <span className="absolute right-0.5 top-1 min-w-[18px] rounded-full border-2 border-page bg-[#cc0000] px-1 text-center text-[10px] font-medium leading-[14px] text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 flex max-h-[70vh] w-[min(480px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-[0_4px_32px_rgba(0,0,0,0.1)] max-sm:-right-12">
          <header className="border-b border-line px-4 py-3 text-base">Notificaciones</header>
          <div className="overflow-y-auto py-2">
            {!data.loaded &&
              Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex animate-pulse gap-4 px-4 py-3">
                  <div className="h-12 w-12 rounded-full bg-soft" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 rounded bg-soft" />
                    <div className="h-3 w-1/3 rounded bg-soft" />
                  </div>
                </div>
              ))}
            {data.loaded && data.items.length === 0 && (
              <div className="flex flex-col items-center px-6 py-12 text-center text-muted">
                <MaterialIcon name="bell" size={56} className="text-muted/50" />
                <p className="mt-3 text-sm">Aquí aparecerán tus notificaciones: nuevos videos de tus suscripciones, comentarios y respuestas.</p>
              </div>
            )}
            {data.items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => go(n)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-soft"
              >
                <span className={`mt-5 h-1 w-1 shrink-0 rounded-full ${n.is_read ? '' : 'bg-link'}`} />
                <Avatar name={n.actor.name} size={48} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-3 text-sm leading-5 text-ink">{message(n)}</span>
                  <span className="text-xs text-muted">{timeAgo(n.created_at)}</span>
                </span>
                {n.video_thumbnail && (
                  <img src={n.video_thumbnail} alt="" className="aspect-video w-[86px] shrink-0 rounded-md bg-soft object-cover" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
