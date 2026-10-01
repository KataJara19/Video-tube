import { useRef, useState } from 'react'
import Icon from '../atoms/Icon'
import { formatBytes } from '../../services/formatters'

// Zona para arrastrar o seleccionar un archivo. Si es imagen muestra vista previa.
export default function FileDropzone({ id, accept, icon, title, hint, file, previewUrl, onFile }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.[0]) onFile(e.dataTransfer.files[0])
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`group relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        dragging ? 'border-brand bg-brand/5' : file ? 'border-line bg-soft/60' : 'border-line hover:border-muted/50 hover:bg-soft/60'
      }`}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {previewUrl ? (
        <img src={previewUrl} alt="Vista previa" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm">
          <Icon name={file ? 'check' : icon} size={22} />
        </span>
      )}
      <div className={previewUrl ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-3 text-left text-white' : ''}>
        <p className="text-sm font-medium">{file ? file.name : title}</p>
        <p className={`text-xs ${previewUrl ? 'text-white/80' : 'text-muted'}`}>
          {file ? `${formatBytes(file.size)} · clic para cambiar` : hint}
        </p>
      </div>
    </div>
  )
}
