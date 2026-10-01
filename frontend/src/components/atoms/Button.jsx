const VARIANTS = {
  primary: 'bg-ink text-white hover:bg-ink/85',
  brand: 'bg-brand text-white hover:bg-brand-dark',
  soft: 'bg-soft text-ink hover:bg-soft-strong',
  ghost: 'bg-transparent text-ink hover:bg-soft',
  outline: 'border border-line bg-surface text-ink hover:bg-soft',
  link: 'bg-transparent text-link hover:bg-link/10',
  'link-solid': 'bg-link text-white hover:bg-link/90',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-[15px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
