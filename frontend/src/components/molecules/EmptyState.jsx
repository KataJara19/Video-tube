import Icon from '../atoms/Icon'

export default function EmptyState({ icon = 'video', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-soft text-muted">
        <Icon name={icon} size={36} />
      </span>
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
