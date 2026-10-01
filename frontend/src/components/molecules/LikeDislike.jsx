import MaterialIcon from '../atoms/MaterialIcon'
import { formatCompact } from '../../services/formatters'

// Botón doble "Me gusta | No me gusta"
export default function LikeDislike({ likes, myReaction, onReact, disabled }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full bg-soft text-sm font-medium">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onReact(myReaction === 1 ? 0 : 1)}
        aria-pressed={myReaction === 1}
        aria-label="Me gusta"
        className="flex h-full items-center gap-1.5 rounded-l-full pl-3 pr-3 hover:bg-soft-strong"
      >
        <MaterialIcon name={myReaction === 1 ? 'likeFilled' : 'like'} size={20} />
        {formatCompact(likes)}
      </button>
      <span className="h-6 w-px bg-line" />
      <button
        type="button"
        disabled={disabled}
        onClick={() => onReact(myReaction === -1 ? 0 : -1)}
        aria-pressed={myReaction === -1}
        aria-label="No me gusta"
        className="flex h-full items-center rounded-r-full pl-3 pr-3.5 hover:bg-soft-strong"
      >
        <MaterialIcon name={myReaction === -1 ? 'dislikeFilled' : 'dislike'} size={20} />
      </button>
    </div>
  )
}
