export default function Input({ className = '', ...props }) {
  return (
    <input
      className={`h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-link focus:ring-1 focus:ring-link ${className}`}
      {...props}
    />
  )
}
