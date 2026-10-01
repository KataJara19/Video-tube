import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Spinner from '../components/atoms/Spinner'
import EmptyState from '../components/molecules/EmptyState'
import AppLayout from '../components/organisms/AppLayout'
import ConfirmDialog from '../components/organisms/ConfirmDialog'
import ProfileHeader from '../components/organisms/ProfileHeader'
import ProfileStats from '../components/organisms/ProfileStats'
import UserVideoLibrary from '../components/organisms/UserVideoLibrary'
import VideoFormModal from '../components/organisms/VideoFormModal'
import { useAuth } from '../context/useAuth'
import { authService } from '../services/authService'
import { videoService } from '../services/videoService'

/**
 * Página 4 · Perfil
 *  /profile      → tu perfil: información, estadísticas, publicar, editar y eliminar
 *  /profile/:id  → perfil de otro usuario en modo solo lectura
 */
export default function ProfilePage() {
  const { user } = useAuth()
  const { userId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  // /profile (tu estudio) exige sesión; /profile/:id es público
  const targetId = userId ? Number(userId) : user.id
  const isOwner = Boolean(user) && targetId === user.id

  // Los datos guardan el id al que pertenecen: si cambia el perfil visitado, se muestra "cargando"
  const [profile, setProfile] = useState({ id: null, data: null, error: '' })
  const [library, setLibrary] = useState({ id: null, videos: [] })
  const [form, setForm] = useState(null) // { mode: 'create', short } | { mode: 'edit', video }
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // El menú "Crear" de la barra superior llega aquí con state.openUpload = 'video' | 'short'
  const openedFromNavbar = isOwner && Boolean(location.state?.openUpload)
  const navbarForm = openedFromNavbar ? { mode: 'create', short: location.state.openUpload === 'short' } : null
  const activeForm = isOwner ? (form ?? navbarForm) : null
  const openCreate = (kind) => setForm({ mode: 'create', short: kind === 'short' })

  useEffect(() => {
    let active = true
    window.scrollTo(0, 0)
    authService
      .getUser(targetId)
      .then((data) => active && setProfile({ id: targetId, data, error: '' }))
      .catch((err) => active && setProfile({ id: targetId, data: null, error: err.message }))
    videoService
      .list({ userId: targetId, limit: 100 })
      .then((videos) => active && setLibrary({ id: targetId, videos }))
      .catch(() => active && setLibrary({ id: targetId, videos: [] }))
    return () => {
      active = false
    }
  }, [targetId])

  // "Mis videos" en la guía lateral: bajar hasta la biblioteca cuando cargue
  const scrollToLibrary = isOwner && location.state?.scrollTo === 'library'
  useEffect(() => {
    if (scrollToLibrary && library.id === targetId) {
      document.getElementById('mis-videos')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [scrollToLibrary, library.id, targetId, location.key])

  const closeForm = () => {
    setForm(null)
    if (openedFromNavbar) navigate('/profile', { replace: true, state: null })
  }

  const changeCount = (delta) =>
    setProfile((p) => (p.data ? { ...p, data: { ...p.data, video_count: Math.max(0, p.data.video_count + delta) } } : p))

  const createVideo = async (formData, onProgress) => {
    const created = await videoService.create(formData, onProgress)
    setLibrary((l) => ({ ...l, videos: [created, ...l.videos] }))
    changeCount(1)
  }

  const updateVideo = async (data) => {
    const updated = await videoService.update(activeForm.video.id, data)
    setLibrary((l) => ({ ...l, videos: l.videos.map((v) => (v.id === updated.id ? updated : v)) }))
  }

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await videoService.remove(toDelete.id)
      setLibrary((l) => ({ ...l, videos: l.videos.filter((v) => v.id !== toDelete.id) }))
      changeCount(-1)
      setToDelete(null)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const profileLoaded = profile.id === targetId
  const libraryLoaded = library.id === targetId
  const videos = libraryLoaded ? library.videos : []

  if (profileLoaded && !profile.data) {
    return (
      <AppLayout>
        <EmptyState
          icon="user"
          title="Este usuario no existe"
          description={profile.error}
          action={
            <Link to="/" className="font-medium text-link">
              Volver al inicio
            </Link>
          }
        />
      </AppLayout>
    )
  }

  const info = profileLoaded ? profile.data : isOwner ? user : null

  return (
    <AppLayout>
      <div className="mx-auto max-w-[1280px] space-y-6 px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
        {info ? (
          <ProfileHeader
            user={info}
            videoCount={profileLoaded ? profile.data.video_count : videos.length}
            subscriberCount={profileLoaded ? profile.data.subscriber_count : 0}
            isOwner={isOwner}
            onSubscribeChange={(r) =>
              setProfile((p) => (p.data ? { ...p, data: { ...p.data, subscriber_count: r.subscriber_count } } : p))
            }
            onPublish={openCreate}
          />
        ) : (
          <div className="flex justify-center py-20">
            <Spinner size={40} />
          </div>
        )}
        <ProfileStats videos={videos} />
        <UserVideoLibrary
          videos={videos}
          loading={!libraryLoaded}
          readOnly={!isOwner}
          ownerName={info?.name ?? ''}
          onPublish={openCreate}
          onEdit={(video) => setForm({ mode: 'edit', video })}
          onDelete={(video) => {
            setDeleteError('')
            setToDelete(video)
          }}
        />
      </div>

      {activeForm && (
        <VideoFormModal
          key={activeForm.mode === 'edit' ? `edit-${activeForm.video.id}` : `create-${activeForm.short}`}
          mode={activeForm.mode}
          video={activeForm.video}
          initialShort={activeForm.short}
          onClose={closeForm}
          onCreate={createVideo}
          onUpdate={updateVideo}
        />
      )}

      <ConfirmDialog
        open={isOwner && Boolean(toDelete)}
        title="¿Eliminar video?"
        message={
          toDelete &&
          `Se eliminará “${toDelete.title}” junto con su archivo, su miniatura y sus comentarios. Esta acción no se puede deshacer.`
        }
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setToDelete(null)}
      />
    </AppLayout>
  )
}
