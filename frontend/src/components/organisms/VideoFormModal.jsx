import { useEffect, useRef, useState } from 'react'
import Button from '../atoms/Button'
import Input from '../atoms/Input'
import MaterialIcon from '../atoms/MaterialIcon'
import ProgressBar from '../atoms/ProgressBar'
import TextArea from '../atoms/TextArea'
import Thumbnail from '../atoms/Thumbnail'
import FileDropzone from '../molecules/FileDropzone'
import FormField from '../molecules/FormField'
import Modal from '../molecules/Modal'
import { formatDuration } from '../../services/formatters'
import { readVideoMeta } from '../../services/mediaService'

const MAX_VIDEO_MB = 100
const MAX_THUMBNAIL_MB = 5

function validateFiles(video, thumbnail) {
  if (!video) return 'Selecciona el archivo de video'
  if (!/\.(mp4|webm)$/i.test(video.name)) return 'El video debe estar en formato MP4 o WebM'
  if (video.size > MAX_VIDEO_MB * 1024 * 1024) return `El video supera ${MAX_VIDEO_MB} MB`
  if (!thumbnail) return 'Selecciona una miniatura'
  if (!/\.(jpe?g|png)$/i.test(thumbnail.name)) return 'La miniatura debe ser JPG, JPEG o PNG'
  if (thumbnail.size > MAX_THUMBNAIL_MB * 1024 * 1024) return `La miniatura supera ${MAX_THUMBNAIL_MB} MB`
  return ''
}

/**
 * mode "create": título, descripción, video (MP4 o WebM) y miniatura (con progreso de subida).
 * mode "edit"  : actualiza título y descripción de un video existente.
 */
export default function VideoFormModal({ mode, video, initialShort = false, onClose, onCreate, onUpdate }) {
  const [title, setTitle] = useState(video?.title ?? '')
  const [description, setDescription] = useState(video?.description ?? '')
  const [videoFile, setVideoFile] = useState(null)
  const [isShort, setIsShort] = useState(initialShort)
  const [duration, setDuration] = useState(null)
  const [thumb, setThumb] = useState({ file: null, url: '' })
  const [progress, setProgress] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const previewRef = useRef('')

  // Libera la URL temporal de la vista previa al cerrar el modal
  useEffect(() => () => previewRef.current && URL.revokeObjectURL(previewRef.current), [])

  // Al elegir el archivo se leen su duración y orientación (un video vertical se marca como Short)
  const pickVideo = async (file) => {
    setVideoFile(file)
    setDuration(null)
    const meta = await readVideoMeta(file)
    setDuration(meta.duration)
    if (meta.vertical) setIsShort(true)
  }

  const pickThumbnail = (file) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = URL.createObjectURL(file)
    setThumb({ file, url: previewRef.current })
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('El título es obligatorio')

    if (mode === 'create') {
      const fileError = validateFiles(videoFile, thumb.file)
      if (fileError) return setError(fileError)
    }

    setSaving(true)
    try {
      if (mode === 'create') {
        const data = new FormData()
        data.append('title', title.trim())
        data.append('description', description.trim())
        data.append('video', videoFile)
        data.append('thumbnail', thumb.file)
        data.append('is_short', isShort ? 'true' : 'false')
        if (duration) data.append('duration', String(duration))
        setProgress(0)
        await onCreate(data, setProgress)
      } else {
        await onUpdate({ title: title.trim(), description: description.trim() })
      }
      onClose()
    } catch (err) {
      setError(err.message)
      setSaving(false)
      setProgress(null)
    }
  }

  return (
    <Modal
      open
      title={mode === 'create' ? (isShort ? 'Subir Short' : 'Subir video') : 'Editar video'}
      onClose={saving ? () => {} : onClose}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="video-form" variant="brand" disabled={saving}>
            {saving ? (mode === 'create' ? 'Publicando…' : 'Guardando…') : mode === 'create' ? 'Publicar' : 'Guardar cambios'}
          </Button>
        </>
      }
    >
      <form id="video-form" onSubmit={submit} className="space-y-5">
        {mode === 'create' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FileDropzone
              id="video-file"
              accept="video/mp4,video/webm,.mp4,.webm"
              icon="upload"
              title="Archivo de video"
              hint={`MP4 o WebM · máximo ${MAX_VIDEO_MB} MB`}
              file={videoFile}
              onFile={pickVideo}
            />
            <FileDropzone
              id="thumbnail-file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              icon="image"
              title="Miniatura"
              hint="JPG, JPEG o PNG · 16:9 recomendado"
              file={thumb.file}
              previewUrl={thumb.url}
              onFile={pickThumbnail}
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl bg-soft p-3">
            <div className="w-40 shrink-0">
              <Thumbnail src={video.thumbnail_url} alt={video.title} rounded="rounded-lg" />
            </div>
            <p className="text-sm text-muted">El archivo de video y la miniatura se mantienen. Puedes cambiar el título y la descripción.</p>
          </div>
        )}

        {mode === 'create' && videoFile && duration && (
          <p className="-mt-2 flex items-center gap-1.5 text-sm text-muted">
            <MaterialIcon name="history" size={18} /> Duración: {formatDuration(duration)}
          </p>
        )}

        {mode === 'create' && (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line p-3">
            <span>
              <span className="flex items-center gap-2 text-sm font-medium">
                <MaterialIcon name="shortsFilled" size={20} className="text-brand" /> Es un Short
              </span>
              <span className="block text-xs text-muted">Video vertical (9:16) que aparece en la sección Shorts</span>
            </span>
            <input type="checkbox" checked={isShort} onChange={(e) => setIsShort(e.target.checked)} className="peer sr-only" />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-soft-strong transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-surface after:shadow after:transition-transform peer-checked:bg-link peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-link" />
          </label>
        )}

        <FormField label="Título" htmlFor="video-title" hint={`${title.length}/200`}>
          <Input id="video-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
        </FormField>
        <FormField label="Descripción" htmlFor="video-description">
          <TextArea
            id="video-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            placeholder="Cuéntales a los espectadores de qué trata tu video"
          />
        </FormField>

        {progress !== null && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted">
              <span>{progress < 100 ? 'Subiendo archivos…' : 'Procesando en el servidor…'}</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Modal>
  )
}
