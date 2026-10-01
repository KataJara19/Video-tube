// Lee los metadatos de un video en el navegador (sin subirlo): duración y orientación.
export function readVideoMeta(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const el = document.createElement('video')
    el.preload = 'metadata'
    el.muted = true
    const done = (meta) => {
      URL.revokeObjectURL(url)
      el.removeAttribute('src')
      resolve(meta)
    }
    el.onloadedmetadata = () =>
      done({
        duration: Number.isFinite(el.duration) ? Math.round(el.duration * 100) / 100 : null,
        vertical: el.videoHeight > el.videoWidth,
      })
    el.onerror = () => done({ duration: null, vertical: false })
    el.src = url
  })
}

// Duración de videos ya publicados que no la tienen guardada (subidos antes de esta versión).
// Lee solo los metadatos, guarda el resultado en memoria y limita las descargas simultáneas.
const cache = new Map()
const queue = []
let running = 0
const MAX_PARALLEL = 3

function runNext() {
  if (running >= MAX_PARALLEL || queue.length === 0) return
  const { src, resolve } = queue.shift()
  running += 1
  const el = document.createElement('video')
  el.preload = 'metadata'
  el.muted = true
  const finish = (value) => {
    el.removeAttribute('src')
    el.load()
    running -= 1
    resolve(value)
    runNext()
  }
  el.onloadedmetadata = () => finish(Number.isFinite(el.duration) ? el.duration : null)
  el.onerror = () => finish(null)
  el.src = src
}

export function probeDuration(key, src) {
  if (!cache.has(key)) {
    cache.set(
      key,
      new Promise((resolve) => {
        queue.push({ src, resolve })
        runNext()
      }),
    )
  }
  return cache.get(key)
}
