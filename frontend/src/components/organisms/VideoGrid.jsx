import VideoCard from './VideoCard'

function SkeletonCard({ animated = true }) {
  return (
    <div className={animated ? 'animate-pulse' : ''} aria-hidden="true">
      <div className="aspect-video rounded-xl bg-soft" />
      <div className="mt-3 flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-soft" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-11/12 rounded bg-soft" />
          <div className="h-4 w-2/3 rounded bg-soft" />
        </div>
      </div>
    </div>
  )
}

// Cuadrícula adaptable: las columnas dependen del ancho disponible (container queries),
// así se ajusta tanto al tamaño de pantalla como a la guía lateral abierta o cerrada.
// fill: completa la cuadrícula con skeletons hasta "fill" celdas (resultados de búsqueda)
export default function VideoGrid({ videos = [], loading = false, fill = 0 }) {
  const placeholders = loading ? 12 : Math.max(0, fill - videos.length)
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-x-4 gap-y-10 @min-[560px]:grid-cols-2 @min-[880px]:grid-cols-3 @min-[1240px]:grid-cols-4 @min-[1720px]:grid-cols-5">
        {!loading && videos.map((video) => <VideoCard key={video.id} video={video} />)}
        {Array.from({ length: placeholders }, (_, i) => (
          <SkeletonCard key={`sk-${i}`} animated={loading} />
        ))}
      </div>
    </div>
  )
}
