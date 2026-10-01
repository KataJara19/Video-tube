// Historial de reproducción guardado en este navegador (ids de los últimos 50 videos vistos)
const KEY = 'vt_history'
const MAX = 50

function read() {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export const historyService = {
  ids: read,
  add(id) {
    const ids = [Number(id), ...read().filter((x) => x !== Number(id))].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(ids))
  },
  clear: () => localStorage.removeItem(KEY),
}
