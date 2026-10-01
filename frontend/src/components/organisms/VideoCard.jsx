import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import PreviewThumbnail from '../molecules/PreviewThumbnail'
import VideoMeta from '../molecules/VideoMeta'

/**
 * variant "grid"    → miniatura grande con la información debajo (Inicio).
 * variant "compact" → miniatura a la izquierda y texto a la derecha (Recomendados).
 * El video y el perfil del autor son enlaces separados. Al pasar el mouse se reproduce una vista previa.
 */
export default function VideoCard({ video, variant = 'grid' }) {
  const watch = `/watch/${video.id}`
  const profile = `/profile/${video.user_id}`

  if (variant === 'compact') {
    return (
      <article className="flex gap-2">
        <Link to={watch} className="w-[168px] shrink-0 max-sm:w-[42%]">
          <PreviewThumbnail src={video.thumbnail_url} videoSrc={video.video_url} videoId={video.id} duration={video.duration} alt={video.title} rounded="rounded-lg" />
        </Link>
        <div className="min-w-0 pr-2">
          <Link to={watch}>
            <h3 className="line-clamp-2 text-sm font-medium leading-5 text-ink">{video.title}</h3>
          </Link>
          <Link to={profile} className="mt-1 block truncate text-xs leading-[18px] text-muted hover:text-ink">
            {video.user.name}
          </Link>
          <VideoMeta views={video.views} createdAt={video.created_at} className="text-xs leading-[18px]" />
        </div>
      </article>
    )
  }

  return (
    <article className="group">
      <Link to={watch} className="block">
        <PreviewThumbnail
          src={video.thumbnail_url}
          videoSrc={video.video_url}
          videoId={video.id}
          duration={video.duration}
          alt={video.title}
          className="transition-[border-radius] duration-200 group-hover:rounded-none"
        />
      </Link>
      <div className="mt-3 flex gap-3">
        <Link to={profile} aria-label={`Perfil de ${video.user.name}`} className="h-9 shrink-0">
          <Avatar name={video.user.name} size={36} />
        </Link>
        <div className="min-w-0 pr-6">
          <Link to={watch}>
            <h3 className="line-clamp-2 text-base font-medium leading-[22px] text-ink">{video.title}</h3>
          </Link>
          <Link to={profile} className="mt-1 block truncate text-sm leading-5 text-muted hover:text-ink">
            {video.user.name}
          </Link>
          <VideoMeta views={video.views} createdAt={video.created_at} className="text-sm leading-5" />
        </div>
      </div>
    </article>
  )
}
