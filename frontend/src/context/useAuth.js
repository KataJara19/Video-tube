import { useContext } from 'react'
import { AuthContext } from './authContext'

/** Acceso a { user, login, register, logout } desde cualquier componente. */
export function useAuth() {
  return useContext(AuthContext)
}
