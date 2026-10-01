// Avatar con la inicial del usuario y un color estable calculado a partir del nombre.
const COLORS = ['#e8453c', '#0b8043', '#1a73e8', '#8e24aa', '#f4511e', '#00897b', '#3949ab', '#d81b60', '#6d4c41']

function colorFor(name = '') {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return COLORS[hash % COLORS.length]
}

export default function Avatar({ name = '?', size = 36, className = '' }) {
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-medium text-white ${className}`}
      style={{ width: size, height: size, backgroundColor: colorFor(name), fontSize: size * 0.45 }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
