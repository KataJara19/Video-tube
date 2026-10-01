import VideoCard from './VideoCard'

function SkeletonRow() {
  return (
    <div className="flex animate-pulse gap-2">
      <div className="aspect-video w-[168px] shrink-0 rounded-lg bg-soft max-sm:w-[42%]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 w-full rounded bg-soft" />
        <div className="h-3.5 w-2/3 rounded bg-soft" />
        <div className="h-3 w-1/2 rounded bg-soft" />
      </div>
    </div>
  )
}

// Columna lateral de videos recomendados (debajo del video en pantallas pequeñas)
export default function RecommendedList({ videos, loading }) {
  return (
    <section aria-label="Videos recomendados" className="px-4 sm:px-0">
      <h2 className="mb-3 text-base font-bold lg:sr-only">Videos recomendados</h2>
      <div className="flex flex-col gap-2">
        {loading && Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}
        {!loading && videos.length === 0 && <p className="py-4 text-sm text-muted">No hay más videos por ahora.</p>}
        {!loading && videos.map((v) => <VideoCard key={v.id} video={v} variant="compact" />)}
      </div>
    </section>
  )
}
