import Icon from '../atoms/Icon'

export default function StatCard({ icon, label, value, hint, accent = 'bg-brand/10 text-brand' }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="truncate text-xl font-bold text-ink">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  )
}
