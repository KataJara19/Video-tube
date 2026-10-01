import Icon from './Icon'

export default function IconButton({ icon, label, size = 40, iconSize = 24, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{ width: size, height: size }}
      className={`inline-flex items-center justify-center rounded-full text-ink transition-colors hover:bg-soft active:bg-soft-strong ${className}`}
      {...props}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  )
}
