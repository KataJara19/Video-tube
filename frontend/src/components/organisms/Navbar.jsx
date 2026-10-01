import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import IconButton from '../atoms/IconButton'
import Logo from '../atoms/Logo'
import CreateMenu from '../molecules/CreateMenu'
import NotificationMenu from '../molecules/NotificationMenu'
import ThemeMenu from '../molecules/ThemeMenu'
import SearchBar from '../molecules/SearchBar'
import UserMenu from '../molecules/UserMenu'
import { useAuth } from '../../context/useAuth'
import { useRequireLogin } from '../../context/useRequireLogin'
import MaterialIcon from '../atoms/MaterialIcon'

// Barra superior: [menú + logo] · [buscador central] · [crear + avatar]
export default function Navbar({ onToggleMenu }) {
  const { user, logout } = useAuth()
  const requireLogin = useRequireLogin()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mobileSearch, setMobileSearch] = useState(false)
  const q = searchParams.get('q') ?? ''

  const search = (text) => {
    setMobileSearch(false)
    navigate(text ? `/?q=${encodeURIComponent(text)}` : '/')
  }

  if (mobileSearch) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 bg-page px-2">
        <IconButton icon="arrowLeft" label="Volver" onClick={() => setMobileSearch(false)} />
        <SearchBar key={q} initialValue={q} onSearch={search} autoFocus />
      </header>
    )
  }

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-2 bg-page px-1.5 sm:gap-4 sm:px-4">
      <div className="flex shrink-0 items-center">
        <IconButton icon="menu" label="Menú" onClick={onToggleMenu} />
        <Logo className="ml-1 sm:ml-4" />
      </div>

      <div className="hidden max-w-[728px] flex-1 justify-center sm:flex">
        <SearchBar key={q} initialValue={q} onSearch={search} className="max-w-[640px]" />
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        <IconButton icon="search" label="Buscar" className="sm:hidden" onClick={() => setMobileSearch(true)} />
        <CreateMenu
          onCreate={(kind) =>
            requireLogin(
              () => navigate('/profile', { state: { openUpload: kind } }),
              kind === 'short' ? 'Inicia sesión para subir Shorts.' : 'Inicia sesión para subir videos.',
            )
          }
        />
        <ThemeMenu className="max-sm:hidden" />
        {user ? (
          <>
            <NotificationMenu />
            <UserMenu user={user} onLogout={logout} />
          </>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            aria-label="Acceder"
            className="flex h-9 items-center gap-1.5 rounded-full border border-line px-2 text-sm font-medium text-link hover:border-transparent hover:bg-link/10 sm:px-3"
          >
            <MaterialIcon name="channel" size={22} /> <span className="max-[400px]:hidden">Acceder</span>
          </button>
        )}
      </div>
    </header>
  )
}
