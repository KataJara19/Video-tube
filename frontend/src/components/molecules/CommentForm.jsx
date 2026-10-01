import { useState } from 'react'
import Avatar from '../atoms/Avatar'
import Button from '../atoms/Button'

// Campo subrayado; los botones aparecen al enfocar. Se usa para comentarios y respuestas.
export default function CommentForm({
  userName,
  onSubmit,
  onCancel,
  placeholder = 'Agrega un comentario...',
  submitLabel = 'Comentar',
  avatarSize = 40,
  autoFocus = false,
}) {
  const [text, setText] = useState('')
  const [active, setActive] = useState(autoFocus)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const cancel = () => {
    setText('')
    setActive(false)
    setError('')
    onCancel?.()
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    setError('')
    try {
      await onSubmit(text.trim())
      setText('')
      setActive(false)
      onCancel?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex gap-4">
      <Avatar name={userName} size={avatarSize} />
      <div className="flex-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setActive(true)}
          autoFocus={autoFocus}
          maxLength={2000}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full border-b border-line bg-transparent pb-1 pt-2 text-sm outline-none transition-colors focus:border-b-2 focus:border-ink"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {active && (
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel}>
              Cancelar
            </Button>
            <Button type="submit" variant={text.trim() ? 'link-solid' : 'soft'} disabled={!text.trim() || sending}>
              {sending ? 'Enviando…' : submitLabel}
            </Button>
          </div>
        )}
      </div>
    </form>
  )
}
