import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

const WIDE = '(min-width: 1280px)'

/**
 * Estructura común: Navbar fijo + guía lateral + contenido.
 * sidebar="auto"   → Inicio / Perfil: guía completa (≥1280 px), mini (≥768 px) u oculta.
 * sidebar="drawer" → Reproductor: sin guía fija; el menú abre un panel superpuesto.
 */
export default function AppLayout({ sidebar = 'auto', children }) {
  const [expanded, setExpanded] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const toggleMenu = () => {
    if (sidebar === 'auto' && window.matchMedia(WIDE).matches) setExpanded((e) => !e)
    else setDrawerOpen((o) => !o)
  }

  const padding = sidebar === 'drawer' ? '' : expanded ? 'md:pl-[72px] xl:pl-60' : 'md:pl-[72px]'

  return (
    <div className="min-h-screen bg-page">
      <Navbar onToggleMenu={toggleMenu} />

      {sidebar === 'auto' && (
        <>
          {expanded && <Sidebar variant="full" className="hidden xl:block" />}
          <Sidebar variant="mini" className={expanded ? 'hidden md:block xl:hidden' : 'hidden md:block'} />
        </>
      )}
      <Sidebar variant="drawer" open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className={`pt-14 ${padding}`}>{children}</main>
    </div>
  )
}
