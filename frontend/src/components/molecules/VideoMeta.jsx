import { formatViews, timeAgo } from '../../services/formatters'

// "1,2 mil vistas • hace 3 días"
export default function VideoMeta({ views, createdAt, className = '' }) {
  return (
    <p className={`text-muted ${className}`}>
      {formatViews(views)}
      <span className="mx-1">•</span>
      {timeAgo(createdAt)}
    </p>
  )
}
