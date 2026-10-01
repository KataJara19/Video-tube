import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import PreviewThumbnail from './PreviewThumbnail'
import VideoMeta from './VideoMeta'

// Tarjeta vertical (9:16) de un Short: miniatura con duración, avatar, título, autor, vistas y fecha
export default function ShortCard({ video }) {
  const watch = `/watch/${video.id}`
  const profile = `/profile/${video.user_id}`
  return (
    <article className="group">
      <Link to={watch} className="block">
        <PreviewThumbnail
          src={video.thumbnail_url}
          videoSrc={video.video_url}
          videoId={video.id}
          duration={video.duration}
          alt={video.title}
          shape="short"
          rounded="rounded-xl"
        />
      </Link>
      <div className="mt-2 flex gap-2">
        <Link to={profile} aria-label={`Perfil de ${video.user.name}`} className="h-7 shrink-0">
          <Avatar name={video.user.name} size={28} />
        </Link>
        <div className="min-w-0">
          <Link to={watch}>
            <h3 className="line-clamp-2 text-sm font-medium leading-5 text-ink sm:text-base sm:leading-[22px]">{video.title}</h3>
          </Link>
          <Link to={profile} className="block truncate text-xs leading-5 text-muted hover:text-ink sm:text-sm">
            {video.user.name}
          </Link>
          <VideoMeta views={video.views} createdAt={video.created_at} className="text-xs leading-5 sm:text-sm" />
        </div>
      </div>
    </article>
  )
}

export function ShortCardSkeleton({ animated = true }) {
  return (
    <div className={animated ? 'animate-pulse' : ''} aria-hidden="true">
      <div className="aspect-[9/16] rounded-xl bg-soft" />
      <div className="mt-2 flex gap-2">
        <div className="h-7 w-7 shrink-0 rounded-full bg-soft" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-11/12 rounded bg-soft" />
          <div className="h-3.5 w-1/2 rounded bg-soft" />
        </div>
      </div>
    </div>
  )
}
