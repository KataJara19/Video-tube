import { useState } from 'react'
import Button from '../atoms/Button'
import Icon from '../atoms/Icon'
import Input from '../atoms/Input'
import FormField from '../molecules/FormField'

const COPY = {
  login: { title: 'Inicia sesión', subtitle: 'Ingresa para ver y publicar videos', submit: 'Iniciar sesión' },
  register: { title: 'Crea tu cuenta', subtitle: 'Solo necesitas tu nombre, correo y una contraseña', submit: 'Crear cuenta' },
}

export default function AuthForm({ mode, onModeChange, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const copy = COPY[mode]

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const switchMode = () => {
    setError('')
    onModeChange(mode === 'login' ? 'register' : 'login')
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate={false}>
      <div>
        <h1 className="text-2xl font-normal text-ink">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>
      </div>

      {mode === 'register' && (
        <FormField label="Nombre" htmlFor="name">
          <Input id="name" name="name" value={form.name} onChange={change} required minLength={2} maxLength={100} autoComplete="name" />
        </FormField>
      )}
      <FormField label="Correo electrónico" htmlFor="email">
        <Input id="email" name="email" type="email" value={form.email} onChange={change} required autoComplete="email" />
      </FormField>
      <FormField label="Contraseña" htmlFor="password" hint={mode === 'register' ? 'Mínimo 6 caracteres' : undefined}>
        <Input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={change}
          required
          minLength={6}
          maxLength={72}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </FormField>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <Icon name="alert" size={18} className="mt-0.5" /> {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="link" onClick={switchMode} className="!px-2">
          {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
        </Button>
        <Button type="submit" variant="brand" size="lg" disabled={loading}>
          {loading ? 'Procesando…' : copy.submit}
        </Button>
      </div>
    </form>
  )
}
