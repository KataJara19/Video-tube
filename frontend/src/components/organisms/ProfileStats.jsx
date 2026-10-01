import StatCard from '../molecules/StatCard'
import { formatNumber } from '../../services/formatters'

export default function ProfileStats({ videos }) {
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0)
  const average = videos.length ? Math.round(totalViews / videos.length) : 0
  const top = videos.reduce((best, v) => (!best || v.views > best.views ? v : best), null)

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Estadísticas">
      <StatCard icon="video" label="Videos" value={formatNumber(videos.length)} hint="publicados en la plataforma" />
      <StatCard
        icon="eye"
        label="Vistas totales"
        value={formatNumber(totalViews)}
        hint="suma de todos tus videos"
        accent="bg-sky-100 text-sky-700"
      />
      <StatCard
        icon="trending"
        label="Promedio"
        value={formatNumber(average)}
        hint="vistas por video"
        accent="bg-emerald-100 text-emerald-700"
      />
      <StatCard
        icon="play"
        label="Más visto"
        value={top ? formatNumber(top.views) : '—'}
        hint={top ? top.title : 'aún sin videos'}
        accent="bg-amber-100 text-amber-700"
      />
    </section>
  )
}
