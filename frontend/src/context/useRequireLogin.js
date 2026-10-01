import { useContext } from 'react'
import { LoginPromptContext } from './loginPromptContext'
import { useAuth } from './useAuth'

/**
 * Acciones que necesitan sesión (comentar, subir, reaccionar, guardar, suscribirse).
 * requireLogin(accion?, motivo?): con sesión ejecuta la acción y devuelve true;
 * sin sesión muestra la ventana "Inicia sesión" con el motivo y devuelve false.
 */
export function useRequireLogin() {
  const { user } = useAuth()
  const { ask } = useContext(LoginPromptContext)
  return (action, reason) => {
    if (user) {
      action?.()
      return true
    }
    ask(reason)
    return false
  }
}
