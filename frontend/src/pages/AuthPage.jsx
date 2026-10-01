import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/atoms/Logo'
import AuthForm from '../components/organisms/AuthForm'
import { useAuth } from '../context/useAuth'

// Página 1 · Registro / Login
export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState('login')

  const submit = async ({ name, email, password }) => {
    if (mode === 'login') await login(email, password)
    else await register(name, email, password)
    navigate(location.state?.from ?? '/', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-4 py-10 sm:bg-soft/50">
      <div className="w-full max-w-[448px] rounded-3xl bg-surface p-6 sm:border sm:border-line sm:p-10 sm:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <Logo className="mb-8" size={30} />
        {/* key: al cambiar de modo el formulario se reinicia */}
        <AuthForm key={mode} mode={mode} onModeChange={setMode} onSubmit={submit} />
      </div>
      <Link to="/" className="mt-6 text-sm font-medium text-link hover:underline">
        Ver videos sin iniciar sesión
      </Link>
      <p className="mt-3 text-xs text-muted">Proyecto académico · React + FastAPI + AWS</p>
    </div>
  )
}
