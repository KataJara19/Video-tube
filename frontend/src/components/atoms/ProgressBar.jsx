export default function ProgressBar({ value = 0, className = '' }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-soft ${className}`}>
      <div className="h-full rounded-full bg-brand transition-[width] duration-200" style={{ width: `${value}%` }} />
    </div>
  )
}
