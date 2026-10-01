import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/atoms/Button'
import MaterialIcon from '../components/atoms/MaterialIcon'
import Modal from '../components/molecules/Modal'
import { LoginPromptContext } from './loginPromptContext'

// Muestra "Inicia sesión para …" con un botón que lleva a /login y luego regresa a la página actual
export function LoginPromptProvider({ children }) {
  const [reason, setReason] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const close = useCallback(() => setReason(null), [])
  const value = useMemo(() => ({ ask: (text) => setReason(text || 'Inicia sesión para continuar.') }), [])

  const goToLogin = () => {
    setReason(null)
    navigate('/login', { state: { from: location.pathname + location.search } })
  }

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      <Modal
        open={reason !== null}
        title="Necesitas una cuenta"
        onClose={close}
        width="max-w-sm"
        footer={
          <>
            <Button variant="ghost" onClick={close}>Ahora no</Button>
            <Button variant="link-solid" onClick={goToLogin}>Iniciar sesión</Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-ink">
            <MaterialIcon name="channel" />
          </span>
          <div>
            <p className="font-medium text-ink">{reason}</p>
            <p className="mt-1 text-sm text-muted">Puedes seguir viendo videos sin cuenta. Para dar me gusta, comentar, suscribirte o subir contenido, inicia sesión.</p>
          </div>
        </div>
      </Modal>
    </LoginPromptContext.Provider>
  )
}
