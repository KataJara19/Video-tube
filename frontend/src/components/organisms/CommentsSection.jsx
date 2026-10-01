import { useEffect, useState } from 'react'
import CommentForm from '../molecules/CommentForm'
import SortMenu from '../molecules/SortMenu'
import { useRequireLogin } from '../../context/useRequireLogin'
import { commentService } from '../../services/commentService'
import { formatNumber } from '../../services/formatters'
import CommentThread from './CommentThread'

function SkeletonComment() {
  return (
    <div className="flex animate-pulse gap-4">
      <div className="h-10 w-10 rounded-full bg-soft" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3 w-40 rounded bg-soft" />
        <div className="h-3.5 w-3/4 rounded bg-soft" />
      </div>
    </div>
  )
}

// Comentarios del video: contador, "Ordenar por", nuevo comentario e hilos con respuestas
export default function CommentsSection({ videoId, creatorId, total, userName, onCountChange, className = '' }) {
  const [sort, setSort] = useState('top')
  const requireLogin = useRequireLogin()
  const [data, setData] = useState({ key: null, list: [] })
  const key = `${videoId}-${sort}`

  useEffect(() => {
    let active = true
    commentService
      .list(videoId, sort)
      .then((list) => active && setData({ key, list }))
      .catch(() => active && setData({ key, list: [] }))
    return () => {
      active = false
    }
  }, [videoId, sort, key])

  const add = async (text) => {
    const created = await commentService.create(videoId, text)
    setData((d) => ({ ...d, list: [created, ...d.list] }))
    onCountChange?.(1)
  }

  const update = (updated) => {
    setData((d) => ({ ...d, list: d.list.map((c) => (c.id === updated.id ? updated : c)) }))
    if (updated.reply_count > (data.list.find((c) => c.id === updated.id)?.reply_count ?? 0)) onCountChange?.(1)
  }

  const loading = data.key !== key

  return (
    <section className={`mt-6 px-4 pb-10 sm:px-0 ${className}`}>
      <div className="mb-6 flex items-center gap-8">
        <h2 className="text-xl font-bold">
          {formatNumber(total)} {total === 1 ? 'comentario' : 'comentarios'}
        </h2>
        <SortMenu value={sort} onChange={setSort} />
      </div>
      {userName ? (
        <CommentForm userName={userName} onSubmit={add} />
      ) : (
        <button
          type="button"
          onClick={() => requireLogin(null, 'Inicia sesión para comentar.')}
          className="flex w-full items-center gap-4 border-b border-line pb-2 text-left text-sm text-muted hover:border-ink"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-soft">?</span>
          Inicia sesión para comentar…
        </button>
      )}
      <ul className="mt-8 space-y-6">
        {loading
          ? Array.from({ length: 3 }, (_, i) => (
              <li key={i}>
                <SkeletonComment />
              </li>
            ))
          : data.list.map((c) => (
              <CommentThread key={c.id} comment={c} videoId={videoId} creatorId={creatorId} userName={userName} onChange={update} />
            ))}
      </ul>
    </section>
  )
}
