import { Link } from 'react-router-dom'

// ─── Identidad de la plataforma ────────────────────────────────────────────
// Cambiar nombre o logotipo AQUÍ (y el <title> de index.html).
const APP_NAME = 'VideoTube'

function LogoMark({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25z"
        className="fill-brand stroke-brand"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M13 11v10l8.5-5z" fill="#fff" />
    </svg>
  )
}

export default function Logo({ to = '/', size = 26, showName = true, className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-1.5 ${className}`} aria-label={`${APP_NAME} - Inicio`}>
      <LogoMark size={size} />
      {showName && <span className="text-[19px] font-bold tracking-[-0.04em] text-ink">{APP_NAME}</span>}
    </Link>
  )
}
