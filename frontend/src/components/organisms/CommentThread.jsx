import { useState } from 'react'
import MaterialIcon from '../atoms/MaterialIcon'
import Spinner from '../atoms/Spinner'
import CommentForm from '../molecules/CommentForm'
import CommentItem from '../molecules/CommentItem'
import { useRequireLogin } from '../../context/useRequireLogin'
import { commentService } from '../../services/commentService'

// Comentario principal + respuestas desplegables + formulario de respuesta
export default function CommentThread({ comment, videoId, creatorId, userName, onChange }) {
  const [replying, setReplying] = useState(false)
  const requireLogin = useRequireLogin()
  const [open, setOpen] = useState(false)
  const [replies, setReplies] = useState({ loaded: false, list: [] })

  const loadReplies = () =>
    commentService.replies(comment.id).then((list) => setReplies({ loaded: true, list }))

  const toggleReplies = () => {
    const next = !open
    setOpen(next)
    if (next && !replies.loaded) loadReplies()
  }

  const react = async (target, value) => {
    if (!requireLogin(null, 'Inicia sesión para reaccionar a comentarios.')) return
    const r = await commentService.react(target.id, value)
    const updated = { ...target, likes: r.likes, dislikes: r.dislikes, my_reaction: r.my_reaction }
    if (target.id === comment.id) onChange(updated)
    else setReplies((s) => ({ ...s, list: s.list.map((c) => (c.id === target.id ? updated : c)) }))
  }

  const reply = async (text) => {
    const created = await commentService.create(videoId, text, comment.id)
    setReplies((s) => ({ loaded: s.loaded, list: [...s.list, created] }))
    setOpen(true)
    if (!replies.loaded) await loadReplies()
    onChange({ ...comment, reply_count: comment.reply_count + 1 })
  }

  return (
    <li>
      <CommentItem
        comment={comment}
        isCreator={comment.user_id === creatorId}
        onReact={(v) => react(comment, v)}
        onReply={() => requireLogin(() => setReplying(true), 'Inicia sesión para responder.')}
      />
      <div className="ml-14">
        {replying && (
          <div className="mt-2">
            <CommentForm
              userName={userName}
              avatarSize={24}
              autoFocus
              placeholder="Agrega una respuesta..."
              submitLabel="Responder"
              onSubmit={reply}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}
        {comment.reply_count > 0 && (
          <button
            type="button"
            onClick={toggleReplies}
            className="-ml-3 mt-1 flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium text-link hover:bg-link/10"
          >
            <MaterialIcon name={open ? 'up' : 'down'} size={22} />
            {comment.reply_count} {comment.reply_count === 1 ? 'respuesta' : 'respuestas'}
          </button>
        )}
        {open && (
          <ul className="mt-2 space-y-4">
            {!replies.loaded && <Spinner size={24} />}
            {replies.list.map((r) => (
              <li key={r.id}>
                <CommentItem
                  comment={r}
                  isCreator={r.user_id === creatorId}
                  avatarSize={24}
                  onReact={(v) => react(r, v)}
                  onReply={() => requireLogin(() => setReplying(true), 'Inicia sesión para responder.')}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
