import Avatar from '../atoms/Avatar'

// Avatar + nombre del usuario que publicó + línea secundaria (p. ej. "4 videos")
export default function ChannelInfo({ name, subtitle, size = 40 }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate text-base font-medium leading-5 text-ink">{name}</p>
        {subtitle && <p className="truncate text-xs leading-5 text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}
