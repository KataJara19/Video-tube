import { useCallback, useEffect, useMemo, useState } from 'react'
import { SESSION_EXPIRED_EVENT } from '../services/apiClient'
import { authService } from '../services/authService'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.loadSession())

  const logout = useCallback(() => {
    authService.clearSession()
    setUser(null)
  }, [])

  // Si la API responde 401 (token vencido), se cierra la sesión automáticamente
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo(
    () => ({
      user,
      login: async (email, password) => setUser(await authService.login(email, password)),
      register: async (name, email, password) => setUser(await authService.register(name, email, password)),
      logout,
    }),
    [user, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
