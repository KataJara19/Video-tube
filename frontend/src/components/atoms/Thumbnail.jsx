import { useState } from 'react'
import Icon from './Icon'

// Miniatura con respaldo si la imagen no carga. shape "video" = 16:9 · "short" = 9:16 (vertical)
export default function Thumbnail({ src, alt = '', rounded = 'rounded-xl', shape = 'video', className = '', children }) {
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = !src || failedSrc === src

  return (
    <div
      className={`relative w-full overflow-hidden bg-soft ${shape === 'short' ? 'aspect-[9/16]' : 'aspect-video'} ${rounded} ${className}`}
    >
      {failed ? (
        <div className="flex h-full w-full items-center justify-center text-muted/60">
          <Icon name="image" size={32} />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover"
        />
      )}
      {children}
    </div>
  )
}
