import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import SubscribeButton from './SubscribeButton'
import { formatViews } from '../../services/formatters'

// Usuario que coincide con la búsqueda (se muestra sobre los resultados)
export default function UserResultCard({ user }) {
  const to = `/profile/${user.id}`
  return (
    <div className="flex items-center gap-4 py-3 sm:gap-6">
      <Link to={to} className="flex w-24 shrink-0 justify-center sm:w-40">
        <Avatar name={user.name} size={72} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={to} className="block truncate text-lg text-ink hover:underline">
          {user.name}
        </Link>
        <p className="text-xs text-muted">
          {user.count} {user.count === 1 ? 'video' : 'videos'} en los resultados · {formatViews(user.views)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        <SubscribeButton channelId={user.id} />
        <Link to={to} className="inline-flex h-9 items-center justify-center rounded-full bg-soft px-4 text-sm font-medium hover:bg-soft-strong">
          Ver perfil
        </Link>
      </div>
    </div>
  )
}
