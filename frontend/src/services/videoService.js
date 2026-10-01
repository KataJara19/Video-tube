import { request, uploadWithProgress } from './apiClient'

// Vistas: se registran UNA vez por video y por sesión del navegador.
// - viewedInMemory evita dobles llamadas por re-renders o por StrictMode.
// - sessionStorage evita sumar otra vista al recargar la página en la misma pestaña.
const viewedInMemory = new Set()
const viewKey = (id) => `vt_viewed_${id}`

function query(params) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && search.set(k, v))
  const s = search.toString()
  return s ? `?${s}` : ''
}

export const videoService = {
  /** short: true = solo Shorts · false = solo videos · undefined = ambos. sort: 'recent' | 'views' */
  list: ({ q, userId, limit, short, sort, ids } = {}) =>
    request(`/videos${query({ q, user_id: userId, limit, short, sort, ids: ids?.join(',') })}`),

  get: (id) => request(`/videos/${id}`),

  recommended: (id) => request(`/videos/${id}/recommended`),

  create: (formData, onProgress) => uploadWithProgress('/videos', formData, onProgress),

  update: (id, data) => request(`/videos/${id}`, { method: 'PUT', body: data }),

  remove: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  /** value: 1 me gusta · -1 no me gusta · 0 quitar */
  react: (id, value) => request(`/videos/${id}/reaction`, { method: 'POST', body: { value } }),

  save: (id) => request(`/videos/${id}/save`, { method: 'POST' }),
  unsave: (id) => request(`/videos/${id}/save`, { method: 'DELETE' }),

  // Listas personales
  feed: ({ short } = {}) => request(`/me/feed${query({ short })}`),
  saved: () => request('/me/saved'),
  liked: () => request('/me/liked'),

  /** Devuelve el nuevo total de vistas, o null si esta sesión ya contó el video. */
  async registerViewOnce(id) {
    const key = String(id)
    if (viewedInMemory.has(key) || sessionStorage.getItem(viewKey(key))) return null
    viewedInMemory.add(key)
    sessionStorage.setItem(viewKey(key), '1')
    try {
      const { views } = await request(`/videos/${id}/views`, { method: 'POST' })
      return views
    } catch {
      viewedInMemory.delete(key)
      sessionStorage.removeItem(viewKey(key))
      return null
    }
  },
}
