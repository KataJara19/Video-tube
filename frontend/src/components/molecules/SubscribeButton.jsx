import { useState } from 'react'
import MaterialIcon from '../atoms/MaterialIcon'
import { useAuth } from '../../context/useAuth'
import { useRequireLogin } from '../../context/useRequireLogin'
import { useSubscriptions } from '../../context/useSubscriptions'

// "Suscribirse" (negro) / "Suscrito" (gris con campana). No se muestra en tu propio canal.
export default function SubscribeButton({ channelId, onChange, size = 'md' }) {
  const { user } = useAuth()
  const { isSubscribed, toggle } = useSubscriptions()
  const requireLogin = useRequireLogin()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (user && user.id === channelId) return null

  const subscribed = isSubscribed(channelId)
  const height = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'

  const click = async () => {
    if (!user) return requireLogin(null, 'Inicia sesión para suscribirte a este canal.')
    setBusy(true)
    setError('')
    try {
      // Primero se llama a la API y después se avisa (onChange es opcional)
      const result = await toggle(channelId)
      onChange?.(result)
    } catch (err) {
      // Si la API falla, el botón lo indica en vez de quedarse igual sin explicación
      setError(err.message || 'No se pudo completar la suscripción')
      setTimeout(() => setError(''), 3000)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      aria-pressed={subscribed}
      title={error || undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium transition-colors disabled:opacity-60 ${height} ${
        subscribed ? 'bg-soft text-ink hover:bg-soft-strong' : 'bg-ink text-white hover:bg-ink/85'
      }`}
    >
      {subscribed && <MaterialIcon name="bellActive" size={20} />}
      {error ? 'Reintentar' : subscribed ? 'Suscrito' : 'Suscribirse'}
    </button>
  )
}
