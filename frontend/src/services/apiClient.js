// Cliente HTTP único hacia FastAPI. La URL llega desde VITE_API_URL (build time).
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

const TOKEN_KEY = 'vt_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// Evento que escucha AuthContext para cerrar sesión si el token expiró
export const SESSION_EXPIRED_EVENT = 'vt:session-expired'

function readError(status, data) {
  const detail = data?.detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('. ')
  return detail || `Error ${status}`
}

function handleUnauthorized(status) {
  if (status === 401 && tokenStorage.get()) window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
}

export async function request(path, { method = 'GET', body } = {}) {
  const token = tokenStorage.get()
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('No se pudo conectar con la API')
  }
  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    handleUnauthorized(response.status)
    throw new Error(readError(response.status, data))
  }
  return data
}

// Subida multipart con progreso (fetch no informa el progreso de subida; XMLHttpRequest sí)
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}${path}`)
    const token = tokenStorage.get()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText)
      } catch {
        data = null
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data)
      handleUnauthorized(xhr.status)
      reject(new Error(readError(xhr.status, data)))
    }
    xhr.onerror = () => reject(new Error('No se pudo conectar con la API'))
    xhr.send(formData)
  })
}
