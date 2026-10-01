import MaterialIcon from '../atoms/MaterialIcon'
import ShortCard, { ShortCardSkeleton } from '../molecules/ShortCard'

// Posición → a partir de qué ancho se muestra
const VISIBILITY = ['', '', 'hidden sm:block', 'hidden lg:block', 'hidden xl:block', 'hidden 2xl:block']

/**
 * Fila de Shorts (tarjetas verticales).
 * fill: completa la fila con skeletons cuando hay pocos resultados (búsqueda).
 */
export default function ShortsShelf({ shorts = [], loading = false, fill = false, title = 'Shorts', max = 6 }) {
  const items = shorts.slice(0, max)
  const placeholders = loading ? max : fill ? Math.max(0, max - items.length) : 0
  if (!loading && items.length === 0 && !fill) return null

  return (
    <section className="py-2">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white">
          <MaterialIcon name="shortsFilled" size={20} />
        </span>
        {title}
      </h2>
      {/* Una sola fila: las columnas que no caben se ocultan según el ancho */}
      <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {!loading && items.map((v, i) => (
          <div key={v.id} className={VISIBILITY[i]}>
            <ShortCard video={v} />
          </div>
        ))}
        {Array.from({ length: placeholders }, (_, i) => (
          <div key={`sk-${i}`} className={VISIBILITY[(loading ? 0 : items.length) + i]}>
            <ShortCardSkeleton animated={loading} />
          </div>
        ))}
      </div>
    </section>
  )
}
