// Chip de filtro (fila superior del inicio)
export default function Chip({ active = false, children, ...props }) {
  return (
    <button
      type="button"
      className={`h-8 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors ${
        active ? 'bg-ink text-white' : 'bg-soft text-ink hover:bg-soft-strong'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}
