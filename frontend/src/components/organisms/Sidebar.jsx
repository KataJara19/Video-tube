import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import IconButton from '../atoms/IconButton'
import Logo from '../atoms/Logo'
import MaterialIcon from '../atoms/MaterialIcon'
import ChannelList from '../molecules/ChannelList'
import { ThemeSwatches } from '../molecules/ThemeMenu'
import SidebarItem from '../molecules/SidebarItem'
import { useSubscriptions } from '../../context/useSubscriptions'

// "Explorar": accesos a búsquedas reales del catálogo (GET /videos?q=...)
const EXPLORE = [
  { q: 'música', icon: 'music', activeIcon: 'musicFilled', label: 'Música' },
  { q: 'videojuegos', icon: 'gaming', activeIcon: 'gamingFilled', label: 'Videojuegos' },
  { q: 'deportes', icon: 'sports', activeIcon: 'sportsFilled', label: 'Deportes' },
]
const EXPLORE_MORE = [
  { q: 'tecnología', icon: 'tech', activeIcon: 'techFilled', label: 'Tecnología' },
  { q: 'educación', icon: 'education', activeIcon: 'educationFilled', label: 'Educación' },
  { q: 'noticias', icon: 'news', activeIcon: 'newsFilled', label: 'Noticias' },
]

// Calcula qué opción está activa según la ruta, ?feed= y ?q=
function useActive() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').toLowerCase()
  const feed = params.get('feed') ?? ''
  const home = pathname === '/'
  return {
    feed: (name) => home && !q && feed === name,
    profile: pathname === '/profile',
    search: (term) => home && q === term,
  }
}

const Divider = () => <hr className="my-3 border-line" />

function SectionLink({ to, children, onClick }) {
  return (
    <Link to={to} onClick={onClick} className="flex h-10 items-center gap-2 rounded-[10px] px-3 text-base font-medium hover:bg-soft">
      {children} <MaterialIcon name="chevronRight" size={20} />
    </Link>
  )
}

function FullNav({ onNavigate }) {
  const active = useActive()
  const { channels, loading } = useSubscriptions()
  const [showMore, setShowMore] = useState(false)
  const explore = showMore ? [...EXPLORE, ...EXPLORE_MORE] : EXPLORE

  return (
    <nav className="flex flex-col px-3 py-3" aria-label="Navegación principal">
      <SidebarItem to="/" icon="home" activeIcon="homeFilled" label="Principal" active={active.feed('')} onClick={onNavigate} />
      <SidebarItem to="/?feed=shorts" icon="shorts" activeIcon="shortsFilled" label="Shorts" active={active.feed('shorts')} onClick={onNavigate} />

      <Divider />
      <SectionLink to="/?feed=subscriptions" onClick={onNavigate}>
        Suscripciones
      </SectionLink>
      <ChannelList channels={channels} loading={loading} onNavigate={onNavigate} />

      <Divider />
      <SectionLink to="/profile" onClick={onNavigate}>
        Tú
      </SectionLink>
      <SidebarItem to="/profile" icon="channel" activeIcon="channelFilled" label="Tu canal" active={active.profile} onClick={onNavigate} />
      <SidebarItem to="/?feed=history" icon="history" label="Historial" active={active.feed('history')} onClick={onNavigate} />
      <SidebarItem to="/?feed=saved" icon="watchLater" label="Ver más tarde" active={active.feed('saved')} onClick={onNavigate} />
      <SidebarItem to="/?feed=liked" icon="like" activeIcon="likeFilled" label="Videos que me gustan" active={active.feed('liked')} onClick={onNavigate} />
      <SidebarItem to="/profile" state={{ scrollTo: 'library' }} icon="myVideos" label="Tus videos" onClick={onNavigate} />

      <Divider />
      <p className="px-3 pb-1 pt-1.5 text-base font-medium">Explorar</p>
      <SidebarItem to="/?feed=trending" icon="trending" activeIcon="trendingFilled" label="Tendencias" active={active.feed('trending')} onClick={onNavigate} />
      {explore.map((item) => (
        <SidebarItem
          key={item.q}
          to={`/?q=${encodeURIComponent(item.q)}`}
          icon={item.icon}
          activeIcon={item.activeIcon}
          label={item.label}
          active={active.search(item.q)}
          onClick={onNavigate}
        />
      ))}
      <button
        type="button"
        onClick={() => setShowMore((s) => !s)}
        className="flex h-10 items-center gap-6 rounded-[10px] px-3 text-left text-sm hover:bg-soft"
      >
        <MaterialIcon name={showMore ? 'showLess' : 'showMore'} />
        {showMore ? 'Mostrar menos' : 'Mostrar más'}
      </button>

      <Divider />
      <p className="px-3 pb-2 pt-1.5 text-base font-medium">Color del tema</p>
      <ThemeSwatches compact />

      <Divider />
      <p className="px-3 text-xs font-medium leading-[18px] text-muted">
        Proyecto académico
        <br />
        React · FastAPI · Amazon S3 · EC2 · RDS
      </p>
      <p className="mt-3 px-3 text-xs leading-[18px] text-muted/80">© 2026 · UIDE</p>
    </nav>
  )
}

// Guía compacta: "Suscripciones" muestra la lista de canales al pasar el mouse
function MiniNav() {
  const active = useActive()
  const { channels, loading } = useSubscriptions()
  const [flyout, setFlyout] = useState(false)

  return (
    <>
      <SidebarItem to="/" icon="home" activeIcon="homeFilled" label="Principal" active={active.feed('')} variant="mini" />
      <SidebarItem to="/?feed=shorts" icon="shorts" activeIcon="shortsFilled" label="Shorts" active={active.feed('shorts')} variant="mini" />
      <div className="relative" onMouseEnter={() => setFlyout(true)} onMouseLeave={() => setFlyout(false)}>
        <SidebarItem
          to="/?feed=subscriptions"
          icon="subscriptions"
          activeIcon="subscriptionsFilled"
          label="Suscripciones"
          active={active.feed('subscriptions')}
          variant="mini"
        />
        {flyout && (
          <div className="absolute left-[68px] top-0 z-50 w-64 rounded-xl border border-line bg-surface py-2 shadow-[0_4px_32px_rgba(0,0,0,0.12)]">
            <p className="px-4 pb-1 pt-1 text-base font-medium">Suscripciones</p>
            <div className="px-1">
              <ChannelList channels={channels} loading={loading} onNavigate={() => setFlyout(false)} />
            </div>
          </div>
        )}
      </div>
      <SidebarItem to="/profile" icon="channel" activeIcon="channelFilled" label="Tú" active={active.profile} variant="mini" />
    </>
  )
}

/**
 * variant:
 *  - "full"   → guía expandida de 240 px (escritorio ancho)
 *  - "mini"   → guía compacta de 72 px
 *  - "drawer" → panel superpuesto que se abre con el botón de menú
 */
export default function Sidebar({ variant = 'full', open = false, onClose, className = '' }) {
  if (variant === 'mini') {
    return (
      <aside className={`fixed bottom-0 left-0 top-14 z-30 w-[72px] bg-page px-1 pt-1 ${className}`}>
        <MiniNav />
      </aside>
    )
  }

  if (variant === 'drawer') {
    return (
      <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div onClick={onClose} className={`absolute inset-0 bg-black/50 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
        <aside
          className={`absolute bottom-0 left-0 top-0 w-60 overflow-y-auto bg-page transition-transform duration-200 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-14 items-center px-4">
            <IconButton icon="menu" label="Cerrar menú" onClick={onClose} />
            <Logo className="ml-4" />
          </div>
          {open && <FullNav onNavigate={onClose} />}
        </aside>
      </div>
    )
  }

  return (
    <aside className={`fixed bottom-0 left-0 top-14 z-30 w-60 overflow-y-auto bg-page [scrollbar-width:thin] ${className}`}>
      <FullNav />
    </aside>
  )
}
