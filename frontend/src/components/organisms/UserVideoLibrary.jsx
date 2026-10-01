import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../atoms/Button'
import Icon from '../atoms/Icon'
import IconButton from '../atoms/IconButton'
import MaterialIcon from '../atoms/MaterialIcon'
import PreviewThumbnail from '../molecules/PreviewThumbnail'
import EmptyState from '../molecules/EmptyState'
import VideoMeta from '../molecules/VideoMeta'

const SORTS = {
  recent: { label: 'Más recientes', fn: (a, b) => b.created_at.localeCompare(a.created_at) },
  popular: { label: 'Más vistos', fn: (a, b) => b.views - a.views },
  title: { label: 'Título (A-Z)', fn: (a, b) => a.title.localeCompare(b.title, 'es') },
}

function ShortBadge() {
  return (
    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
      <MaterialIcon name="shortsFilled" size={14} /> Short
    </span>
  )
}

function Actions({ video, onEdit, onDelete, floating = false }) {
  const base = floating ? 'bg-surface/95 shadow-sm hover:bg-surface' : ''
  return (
    <div className="flex gap-1">
      <IconButton icon="edit" label={`Editar ${video.title}`} size={36} iconSize={20} className={base} onClick={() => onEdit(video)} />
      <IconButton
        icon="trash"
        label={`Eliminar ${video.title}`}
        size={36}
        iconSize={20}
        className={`${base} hover:!text-red-600`}
        onClick={() => onDelete(video)}
      />
    </div>
  )
}

function GridItem({ video, onEdit, onDelete, readOnly }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
      <div className="relative">
        <Link to={`/watch/${video.id}`}>
          <PreviewThumbnail src={video.thumbnail_url} videoSrc={video.video_url} videoId={video.id} duration={video.duration} alt={video.title} rounded="rounded-none">
            {video.is_short && <ShortBadge />}
          </PreviewThumbnail>
        </Link>
        {!readOnly && (
          <div className="absolute right-2 top-2 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <Actions video={video} onEdit={onEdit} onDelete={onDelete} floating />
          </div>
        )}
      </div>
      <div className="p-3">
        <Link to={`/watch/${video.id}`} className="line-clamp-2 text-[15px] font-medium leading-5 hover:underline">
          {video.title}
        </Link>
        <VideoMeta views={video.views} createdAt={video.created_at} className="mt-1 text-xs" />
      </div>
    </article>
  )
}

function ListItem({ video, onEdit, onDelete, readOnly }) {
  return (
    <li className="flex items-start gap-4 rounded-2xl p-2 hover:bg-soft/70">
      <Link to={`/watch/${video.id}`} className="w-36 shrink-0 sm:w-44">
        <PreviewThumbnail src={video.thumbnail_url} videoSrc={video.video_url} videoId={video.id} duration={video.duration} alt={video.title} rounded="rounded-lg">
          {video.is_short && <ShortBadge />}
        </PreviewThumbnail>
      </Link>
      <div className="min-w-0 flex-1 py-0.5">
        <Link to={`/watch/${video.id}`} className="line-clamp-2 font-medium leading-5 hover:underline">
          {video.title}
        </Link>
        <VideoMeta views={video.views} createdAt={video.created_at} className="mt-1 text-xs" />
        {video.description && <p className="mt-1 line-clamp-2 text-sm text-muted max-sm:hidden">{video.description}</p>}
      </div>
      {!readOnly && <Actions video={video} onEdit={onEdit} onDelete={onDelete} />}
    </li>
  )
}

// Biblioteca de videos: búsqueda interna, orden y vista cuadrícula/lista.
// readOnly=true cuando se visita el perfil de otro usuario (sin editar ni eliminar).
export default function UserVideoLibrary({ videos, loading, onEdit, onDelete, onPublish, readOnly = false, ownerName }) {
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('recent')
  const [view, setView] = useState('grid')
  const [kind, setKind] = useState('all')
  const shortCount = videos.filter((v) => v.is_short).length

  const shown = useMemo(() => {
    const text = filter.trim().toLowerCase()
    return videos
      .filter((v) => (kind === 'all' ? true : kind === 'short' ? v.is_short : !v.is_short))
      .filter((v) => v.title.toLowerCase().includes(text))
      .sort(SORTS[sort].fn)
  }, [videos, filter, sort, kind])

  return (
    <section id="mis-videos" className="scroll-mt-20 rounded-3xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">{readOnly ? `Videos de ${ownerName}` : 'Mis videos'}</h2>
          <p className="text-sm text-muted">
            {readOnly ? 'Todo el contenido publicado por este usuario' : 'Consulta, edita o elimina tu contenido'}
          </p>
          <div className="mt-3 flex gap-2" role="tablist" aria-label="Tipo de contenido">
            {[
              ['all', `Todo · ${videos.length}`],
              ['video', `Videos · ${videos.length - shortCount}`],
              ['short', `Shorts · ${shortCount}`],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={kind === key}
                onClick={() => setKind(key)}
                className={`h-8 rounded-lg px-3 text-sm font-medium transition-colors ${kind === key ? 'bg-ink text-white' : 'bg-soft hover:bg-soft-strong'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative w-full sm:w-auto">
            <Icon name="search" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar en mis videos"
              aria-label="Buscar en mis videos"
              className="h-9 w-full rounded-full bg-soft sm:w-52 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-link/40"
            />
          </label>
          <label className="relative">
            <span className="sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-9 appearance-none rounded-full bg-soft pl-4 pr-9 text-sm font-medium outline-none"
            >
              {Object.entries(SORTS).map(([key, s]) => (
                <option key={key} value={key}>
                  {s.label}
                </option>
              ))}
            </select>
            <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
          </label>
          <div className="flex rounded-full bg-soft p-0.5" role="group" aria-label="Tipo de vista">
            {['grid', 'list'].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                aria-label={v === 'grid' ? 'Vista en cuadrícula' : 'Vista en lista'}
                className={`flex h-8 w-9 items-center justify-center rounded-full ${view === v ? 'bg-surface shadow-sm' : 'text-muted'}`}
              >
                <Icon name={v} size={18} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted">Cargando tus videos…</p>
        ) : videos.length === 0 && readOnly ? (
          <EmptyState icon="video" title="Este usuario aún no ha publicado videos" />
        ) : videos.length === 0 ? (
          <EmptyState
            icon="upload"
            title="Aún no has publicado videos"
            description="Sube tu primer video o Short (MP4 o WebM) con su miniatura y aparecerá aquí y en el inicio."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="brand" onClick={() => onPublish('video')}>
                  <Icon name="upload" size={20} /> Subir video
                </Button>
                <Button variant="soft" onClick={() => onPublish('short')}>
                  <MaterialIcon name="shortsFilled" size={20} /> Subir Short
                </Button>
              </div>
            }
          />
        ) : shown.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Ningún video coincide con “{filter}”.</p>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {shown.map((v) => (
              <GridItem key={v.id} video={v} onEdit={onEdit} onDelete={onDelete} readOnly={readOnly} />
            ))}
          </div>
        ) : (
          <ul className="space-y-1">
            {shown.map((v) => (
              <ListItem key={v.id} video={v} onEdit={onEdit} onDelete={onDelete} readOnly={readOnly} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
