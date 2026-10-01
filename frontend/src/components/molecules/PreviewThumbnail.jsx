import { useEffect, useRef, useState } from 'react'
import Thumbnail from '../atoms/Thumbnail'
import { formatDuration } from '../../services/formatters'
import { probeDuration } from '../../services/mediaService'

/**
 * Miniatura con la duración en la esquina y vista previa (sin sonido) solo mientras el mouse está encima.
 * duration: segundos guardados en la API. Si falta (videos antiguos), se leen los metadatos del archivo.
 */
export default function PreviewThumbnail({ src, videoSrc, videoId, duration = null, alt, shape = 'video', rounded, className = '', children }) {
  const [playing, setPlaying] = useState(false)
  const [probed, setProbed] = useState({ id: null, value: null })
  const timer = useRef(null)

  useEffect(() => {
    if (duration != null || !videoSrc || videoId == null) return
    let active = true
    probeDuration(videoId, videoSrc).then((value) => active && setProbed({ id: videoId, value }))
    return () => {
      active = false
    }
  }, [duration, videoSrc, videoId])

  const seconds = duration ?? (probed.id === videoId ? probed.value : null)
  const label = formatDuration(seconds)

  const start = () => {
    // Solo con mouse (en pantallas táctiles no hay "pasar por encima")
    if (!window.matchMedia('(hover: hover)').matches) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPlaying(true), 350) // pequeña espera para no cargar al pasar rápido
  }
  const stop = () => {
    clearTimeout(timer.current)
    setPlaying(false)
  }

  return (
    <div onMouseEnter={start} onMouseLeave={stop}>
      <Thumbnail src={src} alt={alt} shape={shape} rounded={rounded} className={className}>
        {playing && videoSrc && (
          <video
            src={videoSrc}
            muted
            autoPlay
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full bg-black object-cover"
          />
        )}
        {label && !playing && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1 py-px text-xs font-medium leading-4 text-white">
            <span className="sr-only">Duración: </span>
            {label}
          </span>
        )}
        {children}
      </Thumbnail>
    </div>
  )
}
