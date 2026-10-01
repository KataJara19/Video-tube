import { useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import MaterialIcon from '../atoms/MaterialIcon'
import LikeDislike from '../molecules/LikeDislike'
import SubscribeButton from '../molecules/SubscribeButton'
import { useRequireLogin } from '../../context/useRequireLogin'
import { videoService } from '../../services/videoService'
import { copyText } from '../../services/clipboard'
import { formatDate, formatSubscribers, formatViewsFull, timeAgo } from '../../services/formatters'

function PillButton({ icon, children, ...props }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-soft px-3.5 text-sm font-medium hover:bg-soft-strong"
      {...props}
    >
      <MaterialIcon name={icon} size={20} />
      {children}
    </button>
  )
}

// Información debajo del reproductor: título, canal + Suscribirse, me gusta, compartir, guardar y descripción
export default function VideoDetails({ video, views }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState({ likes: video.likes, my_reaction: video.my_reaction })
  const [saved, setSaved] = useState(video.saved)
  const [subscribers, setSubscribers] = useState(video.author_subscribers)
  const [busy, setBusy] = useState(false)
  const requireLogin = useRequireLogin()

  const react = async (value) => {
    if (!requireLogin(null, value === -1 ? 'Inicia sesión para indicar que no te gusta este video.' : 'Inicia sesión para indicar que te gusta este video.')) return
    setBusy(true)
    try {
      const r = await videoService.react(video.id, value)
      setReaction({ likes: r.likes, my_reaction: r.my_reaction })
    } finally {
      setBusy(false)
    }
  }

  const toggleSave = async () => {
    if (!requireLogin(null, 'Inicia sesión para guardar este video.')) return
    const r = saved ? await videoService.unsave(video.id) : await videoService.save(video.id)
    setSaved(r.saved)
  }

  const share = async () => {
    try {
      setCopied(await copyText(window.location.href))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const channel = `/profile/${video.user_id}`

  return (
    <section className="px-4 sm:px-0">
      <h1 className="mt-3 break-words text-xl font-bold leading-7 text-ink">{video.title}</h1>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={channel} aria-label={`Canal de ${video.user.name}`}>
            <Avatar name={video.user.name} size={40} />
          </Link>
          <div className="mr-3 min-w-0">
            <Link to={channel} className="block truncate text-base font-medium leading-5 hover:underline">
              {video.user.name}
            </Link>
            <p className="text-xs leading-5 text-muted">{formatSubscribers(subscribers)}</p>
          </div>
          <SubscribeButton channelId={video.user_id} onChange={(r) => setSubscribers(r.subscriber_count)} />
        </div>

        <div className="scrollbar-none flex max-w-full items-center gap-2 overflow-x-auto">
          <LikeDislike likes={reaction.likes} myReaction={reaction.my_reaction} onReact={react} disabled={busy} />
          <PillButton icon={copied ? 'check' : 'share'} onClick={share}>
            {copied ? 'Enlace copiado' : 'Compartir'}
          </PillButton>
          <PillButton icon={saved ? 'saved' : 'save'} onClick={toggleSave} aria-pressed={saved}>
            {saved ? 'Guardado' : 'Guardar'}
          </PillButton>
        </div>
      </div>

      <div
        onClick={() => !expanded && setExpanded(true)}
        className={`mt-3 rounded-xl bg-soft p-3 text-sm leading-5 ${expanded ? '' : 'cursor-pointer hover:bg-soft-strong'}`}
      >
        <p className="font-medium">
          {formatViewsFull(views)}
          <span className="ml-2">{expanded ? formatDate(video.created_at) : timeAgo(video.created_at)}</span>
          {video.is_short && <span className="ml-2 text-link">#Shorts</span>}
        </p>
        {video.description ? (
          <p className={`mt-1 whitespace-pre-line break-words ${expanded ? '' : 'line-clamp-3'}`}>{video.description}</p>
        ) : (
          <p className="mt-1 text-muted">Este video no tiene descripción.</p>
        )}
        {expanded && (
          // Enlaces directos a los archivos guardados en S3 (video y miniatura)
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3">
            <a href={video.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
              <MaterialIcon name="link" size={18} /> Enlace del video
            </a>
            <a href={video.thumbnail_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-link hover:underline">
              <MaterialIcon name="link" size={18} /> Enlace de la miniatura
            </a>
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded((x) => !x)
          }}
          className="mt-1 font-medium"
        >
          {expanded ? 'Mostrar menos' : '...más'}
        </button>
      </div>
    </section>
  )
}
