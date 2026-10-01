import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/useAuth'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import PlayerPage from './pages/PlayerPage'
import ProfilePage from './pages/ProfilePage'

// Protege las páginas que requieren sesión; recuerda a dónde quería ir el usuario
function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return children
}

// Con sesión iniciada, /login regresa a la página desde la que se pidió iniciar sesión
function LoginRoute() {
  const { user } = useAuth()
  const location = useLocation()
  return user ? <Navigate to={location.state?.from ?? '/'} replace /> : <AuthPage />
}

// Exactamente 4 páginas: Login/Registro, Principal, Reproductor y Perfil
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      {/* Ver videos no requiere cuenta; comentar, subir, reaccionar y suscribirse sí */}
      <Route path="/" element={<HomePage />} />
      <Route path="/watch/:id" element={<PlayerPage />} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      {/* Misma página Perfil, mostrando a otro usuario en modo solo lectura */}
      <Route path="/profile/:userId" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
