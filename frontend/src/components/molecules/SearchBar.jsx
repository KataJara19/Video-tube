import { useState } from 'react'
import Icon from '../atoms/Icon'

// Buscador central estilo plataforma de video: campo redondeado + botón de lupa.
export default function SearchBar({ initialValue = '', onSearch, autoFocus = false, className = '' }) {
  const [value, setValue] = useState(initialValue)
  const [focused, setFocused] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    onSearch(value.trim())
  }

  return (
    <form role="search" onSubmit={submit} className={`flex h-10 w-full items-center ${className}`}>
      <div
        className={`relative flex h-full flex-1 items-center rounded-l-full border bg-surface ${
          focused ? 'ml-0 border-link shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]' : 'ml-0 border-line md:ml-8'
        }`}
      >
        {focused && <Icon name="search" size={20} className="ml-4 text-ink" />}
        <input
          type="search"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Buscar"
          aria-label="Buscar videos"
          className="h-full w-full min-w-0 rounded-l-full bg-transparent px-4 text-base outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            aria-label="Borrar búsqueda"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setValue('')}
            className="mr-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft"
          >
            <Icon name="close" size={20} />
          </button>
        )}
      </div>
      <button
        type="submit"
        aria-label="Buscar"
        title="Buscar"
        className="flex h-full w-16 items-center justify-center rounded-r-full border border-l-0 border-line bg-field hover:bg-soft-strong"
      >
        <Icon name="search" size={22} />
      </button>
    </form>
  )
}
