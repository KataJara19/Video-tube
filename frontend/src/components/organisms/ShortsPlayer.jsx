import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import IconButton from '../atoms/IconButton'
import MaterialIcon from '../atoms/MaterialIcon'
import SubscribeButton from '../molecules/SubscribeButton'
import { useRequireLogin } from '../../context/useRequireLogin'
import { copyText } from '../../services/clipboard'
import { videoService } from '../../services/videoService'
import { formatCompact, formatViews, timeAgo } from '../../services/formatters'
import CommentsSection from './CommentsSection'

function Action({ icon, label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1 text-xs font-medium" aria-pressed={active}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-ink text-white' : 'bg-soft hover:bg-soft-strong'}`}>
        <MaterialIcon name={icon} />
      </span>
      {label}
    </button>
  )
}

/**
 * Reproductor vertical de Shorts (reels): Me gusta, Comentarios y Compartir (copia el enlace).
 * Sin sesión se puede ver y leer comentarios; dar me gusta o comentar abre la ventana "Inicia sesión".
 */
export default function ShortsPlayer({ video, next, userName, onPlay }) {
  const navigate = useNavigate()
  const requireLogin = useRequireLogin()
  const [reaction, setReaction] = useState({ likes: video.likes, my_reaction: video.my_reaction })
  const [comments, setComments] = useState(video.comment_count)
  const [showComments, setShowComments] = useState(false)
  const [copied, setCopied] = useState(false)

  // Flechas del teclado: ↓ siguiente Short · ↑ anterior
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key === 'ArrowDown' && next) navigate(`/watch/${next.id}`)
      if (e.key === 'ArrowUp') navigate(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, navigate])

  const toggleLike = async () => {
    if (!requireLogin(null, 'Inicia sesión para darle me gusta a este Short.')) return
    const r = await videoService.react(video.id, reaction.my_reaction === 1 ? 0 : 1)
    setReaction({ likes: r.likes, my_reaction: r.my_reaction })
  }

  const share = async () => {
    try {
      setCopied(await copyText(window.location.href))
    } catch {
      setCopied(false)
    }
    setTimeout(() => setCopied(false), 2000)
  }

  const handle = `@${video.user.name.replace(/\s+/g, '').toLowerCase()}`

  return (
    <div className="flex justify-center gap-6 py-4 max-sm:py-0">
      <div className="relative flex items-end gap-4">
        <div className="relative h-[calc(100dvh-88px)] max-h-[860px] min-h-[420px] overflow-hidden rounded-xl bg-black max-sm:h-[calc(100dvh-56px)] max-sm:w-screen max-sm:rounded-none sm:aspect-[9/16]">
          <video
            key={video.id}
            src={video.video_url}
            poster={video.thumbnail_url}
            autoPlay
            loop
            controls
            playsInline
            onPlay={onPlay}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 pb-16 pr-20 text-white sm:pr-4">
            <div className="pointer-events-auto flex items-center gap-2">
              <Link to={`/profile/${video.user_id}`} className="flex min-w-0 items-center gap-2 font-medium hover:underline">
                <Avatar name={video.user.name} size={32} />
                <span className="truncate">{handle}</span>
              </Link>
              <SubscribeButton channelId={video.user_id} size="sm" />
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium">{video.title}</p>
            <p className="mt-1 text-xs text-white/80">
              {formatViews(video.views)} • {timeAgo(video.created_at)}
            </p>
          </div>
        </div>

        {/* Acciones: al costado en pantallas grandes, sobre el video en el celular */}
        <div className="flex flex-col items-center gap-4 max-sm:absolute max-sm:bottom-28 max-sm:right-3 max-sm:text-white max-sm:[text-shadow:0_1px_3px_rgba(0,0,0,0.7)] max-sm:[&_span]:bg-black/40 max-sm:[&_span]:text-white">
          <Action
            icon={reaction.my_reaction === 1 ? 'likeFilled' : 'like'}
            label={formatCompact(reaction.likes)}
            active={reaction.my_reaction === 1}
            onClick={toggleLike}
          />
          <Action icon="commentFilled" label={formatCompact(comments)} active={showComments} onClick={() => setShowComments((s) => !s)} />
          <Action icon={copied ? 'check' : 'share'} label={copied ? 'Enlace copiado' : 'Compartir'} onClick={share} />
          <Link to={`/profile/${video.user_id}`} aria-label={`Canal de ${video.user.name}`} className="mt-1 max-sm:hidden">
            <Avatar name={video.user.name} size={40} />
          </Link>
        </div>
      </div>

      {/* Comentarios: panel lateral (≥1024 px) u hoja inferior (celular y tablet) */}
      {showComments && (
        <aside
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75dvh] flex-col rounded-t-2xl border border-line bg-surface shadow-[0_-8px_30px_rgba(0,0,0,0.15)] lg:static lg:z-auto lg:h-[calc(100dvh-88px)] lg:max-h-[860px] lg:w-[420px] lg:rounded-xl lg:shadow-none"
          aria-label="Comentarios"
        >
          <header className="flex items-center justify-between border-b border-line px-4 py-2">
            <h2 className="font-bold">Comentarios</h2>
            <IconButton icon="close" label="Cerrar comentarios" onClick={() => setShowComments(false)} />
          </header>
          <div className="flex-1 overflow-y-auto px-4">
            <CommentsSection
              videoId={video.id}
              creatorId={video.user_id}
              total={comments}
              userName={userName}
              onCountChange={(d) => setComments((c) => c + d)}
              className="!mt-3"
            />
          </div>
        </aside>
      )}

      {/* Navegación entre Shorts */}
      <div className="hidden flex-col justify-center gap-3 md:flex">
        <button type="button" onClick={() => navigate(-1)} aria-label="Short anterior" className="flex h-14 w-14 items-center justify-center rounded-full bg-soft hover:bg-soft-strong">
          <MaterialIcon name="up" size={28} />
        </button>
        <button
          type="button"
          disabled={!next}
          onClick={() => next && navigate(`/watch/${next.id}`)}
          aria-label="Siguiente Short"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-soft hover:bg-soft-strong disabled:opacity-40"
        >
          <MaterialIcon name="down" size={28} />
        </button>
      </div>

      {/* En el celular: botón flotante para pasar al siguiente */}
      {next && (
        <button
          type="button"
          onClick={() => navigate(`/watch/${next.id}`)}
          aria-label="Siguiente Short"
          className="fixed right-3 top-[68px] z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white md:hidden"
        >
          <MaterialIcon name="down" />
        </button>
      )}
    </div>
  )
}
