// Temas de color de la interfaz clara. Los colores viven en styles/index.css (:root[data-theme=...]);
// aquí solo se elige cuál aplicar y se recuerda en este navegador.
export const THEMES = [
  { key: 'clasico', label: 'Clásico', page: '#ffffff', accent: '#e8453c' },
  { key: 'rosa', label: 'Rosa', page: '#fff5f9', accent: '#e64980' },
  { key: 'morado', label: 'Morado', page: '#faf6ff', accent: '#8b5cf6' },
  { key: 'azul', label: 'Azul', page: '#f4f8ff', accent: '#2f7de1' },
  { key: 'menta', label: 'Menta', page: '#f3fbf7', accent: '#12a36f' },
  { key: 'durazno', label: 'Durazno', page: '#fff8f2', accent: '#f07a32' },
]

const KEY = 'vt_theme'
export const THEME_EVENT = 'vt-theme-change'

export const themeService = {
  current() {
    const applied = document.documentElement.dataset.theme
    if (applied) return applied
    if (this.initialized) return 'clasico'
    try {
      const saved = localStorage.getItem(KEY)
      return THEMES.some((t) => t.key === saved) ? saved : 'clasico'
    } catch {
      return 'clasico'
    }
  },
  apply(key) {
    this.initialized = true
    const root = document.documentElement
    if (key === 'clasico') delete root.dataset.theme
    else root.dataset.theme = key
    window.dispatchEvent(new Event(THEME_EVENT))
    try {
      localStorage.setItem(KEY, key)
    } catch {
      // Sin almacenamiento (modo privado): el tema dura solo esta visita
    }
  },
}
