import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Avatar from '../components/atoms/Avatar'
import Button from '../components/atoms/Button'
import Chip from '../components/atoms/Chip'
import MaterialIcon from '../components/atoms/MaterialIcon'
import EmptyState from '../components/molecules/EmptyState'
import ShortCard, { ShortCardSkeleton } from '../components/molecules/ShortCard'
import UserResultCard from '../components/molecules/UserResultCard'
import AppLayout from '../components/organisms/AppLayout'
import ShortsShelf from '../components/organisms/ShortsShelf'
import VideoGrid from '../components/organisms/VideoGrid'
import { useAuth } from '../context/useAuth'
import { useSubscriptions } from '../context/useSubscriptions'
import { historyService } from '../services/historyService'
import { videoService } from '../services/videoService'

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'recent', label: 'Recientes' },
  { key: 'popular', label: 'Más vistos' },
]

// Vistas de la página principal (?feed=...). Todas usan esta misma página.
const FEEDS = {
  '': { title: null, load: () => Promise.all([videoService.list({ short: false, limit: 100 }), videoService.list({ short: true, limit: 12 })]) },
  shorts: { title: 'Shorts', icon: 'shortsFilled', load: () => Promise.all([[], videoService.list({ short: true, limit: 100 })]) },
  subscriptions: { title: 'Suscripciones', icon: 'subscriptionsFilled', load: () => Promise.all([videoService.feed({ short: false }), videoService.feed({ short: true })]) },
  trending: {
    title: 'Tendencias',
    icon: 'trendingFilled',
    load: () => Promise.all([videoService.list({ short: false, sort: 'views', limit: 50 }), videoService.list({ short: true, sort: 'views', limit: 12 })]),
  },
  history: { title: 'Historial', icon: 'history', load: () => Promise.all([videoService.list({ ids: historyService.ids(), limit: 100 }), []]) },
  saved: { title: 'Ver más tarde', icon: 'watchLater', load: () => Promise.all([videoService.saved(), []]) },
  liked: { title: 'Videos que me gustan', icon: 'likeFilled', load: () => Promise.all([videoService.liked(), []]) },
}

// Listas que dependen de la cuenta del usuario
const PRIVATE_FEEDS = new Set(['subscriptions', 'saved', 'liked'])

const EMPTY = {
  subscriptions: ['subscriptions', 'Aún no tienes suscripciones', 'Pulsa "Suscribirse" en el canal de un creador para ver aquí sus videos y Shorts.'],
  history: ['history', 'Tu historial está vacío', 'Los videos que reproduzcas en este navegador aparecerán aquí.'],
  saved: ['watchLater', 'No tienes videos guardados', 'Usa el botón "Guardar" de un video para verlo más tarde.'],
  liked: ['like', 'Aún no te gusta ningún video', 'Pulsa "Me gusta" en un video para encontrarlo aquí.'],
  shorts: ['shorts', 'Todavía no hay Shorts', 'Publica un video vertical y marca la opción "Es un Short".'],
}

// Página 2 · Principal: catálogo, Shorts, suscripciones, listas personales y búsqueda
export default function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const feed = q ? 'search' : FEEDS[searchParams.get('feed') ?? ''] ? (searchParams.get('feed') ?? '') : ''
  const key = `${feed}|${q}`
  const { channels } = useSubscriptions()
  const { user } = useAuth()
  const needsLogin = !user && PRIVATE_FEEDS.has(feed)

  const [result, setResult] = useState({ key: null, videos: [], shorts: [], error: '' })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (needsLogin) return undefined
    let active = true
    const load =
      feed === 'search'
        ? () => Promise.all([videoService.list({ q, short: false, limit: 100 }), videoService.list({ q, short: true, limit: 12 })])
        : FEEDS[feed].load
    load()
      .then(([videos, shorts]) => active && setResult({ key, videos, shorts, error: '' }))
      .catch((err) => active && setResult({ key, videos: [], shorts: [], error: err.message }))
    return () => {
      active = false
    }
  }, [feed, q, key, needsLogin])

  const loading = result.key !== key

  const videos = useMemo(() => {
    const list = [...result.videos]
    if (filter === 'popular') list.sort((a, b) => b.views - a.views)
    if (filter === 'recent') list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    return list
  }, [result.videos, filter])

  // Creadores cuyo nombre coincide con la búsqueda
  const matchingUsers = useMemo(() => {
    if (!q) return []
    const text = q.toLowerCase()
    const users = new Map()
    for (const v of [...result.videos, ...result.shorts]) {
      if (!v.user.name.toLowerCase().includes(text)) continue
      const u = users.get(v.user_id) ?? { id: v.user_id, name: v.user.name, count: 0, views: 0 }
      u.count += 1
      u.views += v.views
      users.set(v.user_id, u)
    }
    return [...users.values()]
  }, [q, result.videos, result.shorts])

  const showChips = feed === '' || feed === 'search'
  const config = FEEDS[feed]
  const isEmpty = !loading && !result.error && videos.length === 0 && result.shorts.length === 0

  return (
    <AppLayout>
      {showChips && (
        <div className="sticky top-14 z-20 flex gap-3 overflow-x-auto bg-page px-4 py-3 sm:px-6">
          {FILTERS.map((f) => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="space-y-8 px-4 pb-12 pt-3 sm:px-6">
        {/* Encabezado de la vista */}
        {config?.title && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-[28px]">
              <MaterialIcon name={config.icon} size={32} /> {config.title}
            </h1>
            {feed === 'history' && result.videos.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  historyService.clear()
                  setResult((r) => ({ ...r, videos: [] }))
                }}
              >
                <MaterialIcon name="history" size={20} /> Borrar historial
              </Button>
            )}
          </div>
        )}

        {feed === 'subscriptions' && channels.length > 0 && (
          <div className="scrollbar-none flex gap-5 overflow-x-auto pb-1">
            {channels.map((c) => (
              <Link key={c.id} to={`/profile/${c.id}`} className="flex w-20 shrink-0 flex-col items-center gap-2 text-center text-xs">
                <span className="relative">
                  <Avatar name={c.name} size={64} />
                  {c.has_new && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-page bg-link" />}
                </span>
                <span className="line-clamp-2">{c.name}</span>
              </Link>
            ))}
          </div>
        )}

        {q && (
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold">Resultados para “{q}”</h1>
            <button type="button" onClick={() => navigate('/')} className="text-sm font-medium text-link">
              Ver todos los videos
            </button>
          </div>
        )}

        {needsLogin ? (
          <EmptyState
            icon={EMPTY[feed][0]}
            title="Inicia sesión para ver esta sección"
            description="Tus suscripciones, videos guardados y Me gusta se guardan en tu cuenta."
            action={
              <Link to="/login" state={{ from: `/?feed=${feed}` }}>
                <Button variant="brand">Iniciar sesión</Button>
              </Link>
            }
          />
        ) : result.error && !loading ? (
          <EmptyState icon="alert" title="No se pudieron cargar los videos" description={result.error} />
        ) : feed === 'search' ? (
          <>
            {matchingUsers.length > 0 && (
              <div className="border-b border-line pb-3">
                {matchingUsers.map((u) => (
                  <UserResultCard key={u.id} user={u} />
                ))}
              </div>
            )}
            {/* Aunque haya pocos resultados, los skeletons completan las filas */}
            <ShortsShelf shorts={result.shorts} loading={loading} fill />
            <section>
              <h2 className="mb-4 text-xl font-bold">Coincidencias</h2>
              {!loading && result.videos.length === 0 && (
                <p className="mb-4 text-sm text-muted">No hay videos que coincidan con “{q}”. Prueba con otras palabras.</p>
              )}
              <VideoGrid videos={videos} loading={loading} fill={12} />
            </section>
          </>
        ) : isEmpty && EMPTY[feed] ? (
          <EmptyState icon={EMPTY[feed][0]} title={EMPTY[feed][1]} description={EMPTY[feed][2]} />
        ) : isEmpty ? (
          <EmptyState
            icon="video"
            title="Todavía no hay videos"
            description="Sé la primera persona en publicar un video en la plataforma."
            action={
              <Link to="/profile" state={{ openUpload: 'video' }}>
                <Button variant="brand">Publicar video</Button>
              </Link>
            }
          />
        ) : feed === 'shorts' ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {loading
              ? Array.from({ length: 12 }, (_, i) => <ShortCardSkeleton key={i} />)
              : result.shorts.map((v) => <ShortCard key={v.id} video={v} />)}
          </div>
        ) : (
          <>
            {/* Primera fila de videos, luego Shorts, luego el resto (como la portada de las plataformas de video) */}
            <VideoGrid videos={videos.slice(0, 8)} loading={loading} />
            {(loading || result.shorts.length > 0) && <ShortsShelf shorts={result.shorts} loading={loading} />}
            {videos.length > 8 && <VideoGrid videos={videos.slice(8)} />}
          </>
        )}
      </div>
    </AppLayout>
  )
}
