import { Link } from 'react-router-dom'
import Avatar from '../atoms/Avatar'
import MaterialIcon from '../atoms/MaterialIcon'
import { formatCompact, timeAgo } from '../../services/formatters'

// Un comentario con sus acciones: me gusta, no me gusta y responder
export default function CommentItem({ comment, isCreator, avatarSize = 40, onReact, onReply }) {
  const handle = `@${comment.user.name.replace(/\s+/g, '').toLowerCase()}`
  return (
    <div className="flex gap-4">
      <Link to={`/profile/${comment.user_id}`} aria-label={`Perfil de ${comment.user.name}`} className="shrink-0" style={{ height: avatarSize }}>
        <Avatar name={comment.user.name} size={avatarSize} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-[18px]">
          <Link
            to={`/profile/${comment.user_id}`}
            className={`font-medium hover:underline ${isCreator ? 'rounded-full bg-[#888]/90 px-1.5 py-0.5 text-white hover:no-underline' : 'text-ink'}`}
          >
            {handle}
          </Link>
          <span className="ml-1.5 text-muted">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-5 text-ink">{comment.content}</p>
        <div className="-ml-2 mt-1 flex items-center text-xs text-muted">
          <button
            type="button"
            onClick={() => onReact(comment.my_reaction === 1 ? 0 : 1)}
            aria-label="Me gusta"
            aria-pressed={comment.my_reaction === 1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-soft"
          >
            <MaterialIcon name={comment.my_reaction === 1 ? 'likeFilled' : 'like'} size={18} />
          </button>
          <span className="min-w-4 pr-1">{comment.likes > 0 ? formatCompact(comment.likes) : ''}</span>
          <button
            type="button"
            onClick={() => onReact(comment.my_reaction === -1 ? 0 : -1)}
            aria-label="No me gusta"
            aria-pressed={comment.my_reaction === -1}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-soft"
          >
            <MaterialIcon name={comment.my_reaction === -1 ? 'dislikeFilled' : 'dislike'} size={18} />
          </button>
          <button type="button" onClick={onReply} className="ml-2 h-8 rounded-full px-3 font-medium text-ink hover:bg-soft">
            Responder
          </button>
        </div>
      </div>
    </div>
  )
}
