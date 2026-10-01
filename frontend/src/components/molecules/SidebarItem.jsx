import { Link } from 'react-router-dom'
import MaterialIcon from '../atoms/MaterialIcon'

/**
 * Elemento de la guía lateral.
 * variant "full": icono + texto en fila (guía de 240 px).
 * variant "mini": icono sobre el texto (guía de 72 px).
 * El estado "active" lo calcula Sidebar (ruta + búsqueda actual).
 */
export default function SidebarItem({ to, state, icon, activeIcon, label, active = false, variant = 'full', onClick }) {
  const iconName = active && activeIcon ? activeIcon : icon

  if (variant === 'mini') {
    return (
      <Link
        to={to}
        state={state}
        onClick={onClick}
        aria-current={active ? 'page' : undefined}
        className={`flex h-[74px] w-16 flex-col items-center justify-center gap-1.5 rounded-[10px] text-[10px] hover:bg-soft ${active ? '[&_svg]:text-icon-active' : ''}`}
      >
        <MaterialIcon name={iconName} />
        <span className="w-full truncate text-center">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex h-10 items-center gap-6 rounded-[10px] px-3 text-sm ${
        active ? 'bg-soft font-medium hover:bg-soft-strong [&_svg]:text-icon-active' : 'hover:bg-soft'
      }`}
    >
      <MaterialIcon name={iconName} />
      <span className="truncate">{label}</span>
    </Link>
  )
}
