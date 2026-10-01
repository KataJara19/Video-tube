export default function TextArea({ className = '', ...props }) {
  return (
    <textarea
      className={`w-full resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-link focus:ring-1 focus:ring-link ${className}`}
      {...props}
    />
  )
}
