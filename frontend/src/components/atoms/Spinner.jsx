export default function Spinner({ size = 32, className = '' }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      style={{ width: size, height: size }}
      className={`inline-block animate-spin rounded-full border-[3px] border-soft-strong border-t-ink ${className}`}
    />
  )
}
