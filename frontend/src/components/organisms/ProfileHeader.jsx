import Avatar from '../atoms/Avatar'
import Button from '../atoms/Button'
import Icon from '../atoms/Icon'
import MaterialIcon from '../atoms/MaterialIcon'
import SubscribeButton from '../molecules/SubscribeButton'
import { formatDate, formatSubscribers } from '../../services/formatters'

// Cabecera propia del perfil: banner degradado + tarjeta del usuario superpuesta.
// isOwner=false: perfil de otro usuario (sin correo ni botón de publicar)
export default function ProfileHeader({ user, videoCount, subscriberCount = 0, isOwner = true, onPublish, onSubscribeChange }) {
  return (
    <section>
      <div className="relative h-36 overflow-hidden rounded-3xl bg-gradient-to-br from-banner-1 via-banner-2 to-banner-3 sm:h-44">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/35" />
        <div className="absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand/10" />
        <div className="absolute right-8 top-6 hidden items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-ink backdrop-blur sm:flex">
          <Icon name={isOwner ? 'video' : 'user'} size={16} /> {isOwner ? 'Estudio personal' : 'Perfil público'}
        </div>
      </div>

      <div className="relative mx-3 -mt-14 flex flex-col gap-5 rounded-3xl border border-line bg-surface p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] sm:mx-6 sm:flex-row sm:items-center sm:p-6">
        <Avatar name={user.name} size={96} className="ring-4 ring-surface" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold sm:text-[28px]">{user.name}</h1>
          {isOwner && <p className="truncate text-sm text-muted">{user.email}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="user" size={18} />
              {formatSubscribers(subscriberCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="library" size={18} />
              {videoCount} {videoCount === 1 ? 'video publicado' : 'videos publicados'}
            </span>
            {user.created_at && (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="calendar" size={18} /> Miembro desde {formatDate(user.created_at)}
              </span>
            )}
          </div>
        </div>
        {isOwner ? (
          <div className="flex flex-wrap gap-2 self-start sm:self-center">
            <Button variant="brand" size="lg" onClick={() => onPublish('video')}>
              <Icon name="upload" size={20} /> Subir video
            </Button>
            <Button variant="soft" size="lg" onClick={() => onPublish('short')}>
              <MaterialIcon name="shortsFilled" size={20} /> Subir Short
            </Button>
          </div>
        ) : (
          <div className="self-start sm:self-center">
            <SubscribeButton channelId={user.id} onChange={onSubscribeChange} />
          </div>
        )}
      </div>
    </section>
  )
}
