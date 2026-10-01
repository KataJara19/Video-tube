// Formatos en español, al estilo de las plataformas de video.

const compact = new Intl.NumberFormat('es', { notation: 'compact', maximumFractionDigits: 1 })
const full = new Intl.NumberFormat('es')
const relative = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

// FastAPI devuelve fechas ISO; si no traen zona horaria se interpretan como UTC
export const toDate = (iso) => new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`)

/** 1234 → "1,2 mil vistas" */
export function formatViews(n) {
  return `${compact.format(n)} ${n === 1 ? 'vista' : 'vistas'}`
}

/** 1234 → "1.234 vistas" */
export function formatViewsFull(n) {
  return `${full.format(n)} ${n === 1 ? 'vista' : 'vistas'}`
}

export const formatNumber = (n) => full.format(n)

/** Fecha ISO → "hace 3 días" */
export function timeAgo(iso) {
  const seconds = Math.round((toDate(iso).getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.trunc(seconds / size), unit)
  }
  return 'hace un momento'
}

/** Fecha ISO → "29 sept 2026" */
export function formatDate(iso) {
  return toDate(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** 1234 → "1,2 mil" (suscriptores, me gusta) */
export const formatCompact = (n) => compact.format(n)

export function formatSubscribers(n) {
  return `${compact.format(n)} ${n === 1 ? 'suscriptor' : 'suscriptores'}`
}

/** 83 → "1:23" · 3725 → "1:02:05" (como la etiqueta de duración de las miniaturas) */
export function formatDuration(seconds) {
  if (seconds == null || !Number.isFinite(seconds)) return ''
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = String(total % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
