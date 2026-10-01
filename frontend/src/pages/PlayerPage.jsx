import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Spinner from '../components/atoms/Spinner'
import EmptyState from '../components/molecules/EmptyState'
import AppLayout from '../components/organisms/AppLayout'
import CommentsSection from '../components/organisms/CommentsSection'
import RecommendedList from '../components/organisms/RecommendedList'
import ShortsPlayer from '../components/organisms/ShortsPlayer'
import VideoDetails from '../components/organisms/VideoDetails'
import VideoPlayer from '../components/organisms/VideoPlayer'
import { useAuth } from '../context/useAuth'
import { historyService } from '../services/historyService'
import { videoService } from '../services/videoService'

// Página 3 · Reproductor: videos normales y Shorts (formato vertical)
export default function PlayerPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [detail, setDetail] = useState({ id: null, video: null, error: '' })
  const [recommended, setRecommended] = useState({ id: null, list: [] })
  const [liveViews, setLiveViews] = useState({ id: null, views: 0 })
  const [commentDelta, setCommentDelta] = useState({ id: null, delta: 0 })

  useEffect(() => {
    let active = true
    window.scrollTo(0, 0)
    historyService.add(id)

    // GET /videos/{id} incluye me gusta, guardado, suscriptores y número de comentarios
    videoService
      .get(id)
      .then((video) => active && setDetail({ id, video, error: '' }))
      .catch((err) => active && setDetail({ id, video: null, error: err.message }))

    videoService
      .recommended(id)
      .then((list) => active && setRecommended({ id, list }))
      .catch(() => active && setRecommended({ id, list: [] }))

    return () => {
      active = false
    }
  }, [id])

  // La vista se registra al empezar la reproducción (una vez por video y sesión)
  const handlePlay = () => {
    videoService.registerViewOnce(id).then((views) => views !== null && setLiveViews({ id, views }))
  }

  const loading = detail.id !== id
  const video = loading ? null : detail.video
  const views = liveViews.id === id ? liveViews.views : video?.views ?? 0
  const recs = recommended.id === id ? recommended.list : []
  const commentTotal = (video?.comment_count ?? 0) + (commentDelta.id === id ? commentDelta.delta : 0)

  if (loading || !video) {
    return (
      <AppLayout sidebar="drawer">
        {loading ? (
          <div className="flex justify-center py-24">
            <Spinner size={40} />
          </div>
        ) : (
          <EmptyState
            icon="alert"
            title="Este video no está disponible"
            description={detail.error}
            action={
              <Link to="/" className="font-medium text-link">
                Volver al inicio
              </Link>
            }
          />
        )}
      </AppLayout>
    )
  }

  if (video.is_short) {
    return (
      <AppLayout sidebar="auto">
        <ShortsPlayer key={video.id} video={{ ...video, views }} next={recs[0]} userName={user?.name} onPlay={handlePlay} />
      </AppLayout>
    )
  }

  return (
    <AppLayout sidebar="drawer">
      <div className="mx-auto grid max-w-[1754px] gap-x-6 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_402px] lg:grid-rows-[auto_auto_1fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <VideoPlayer video={video} onPlay={handlePlay} />
        </div>
        <div className="lg:col-start-1 lg:row-start-2">
          <VideoDetails key={video.id} video={video} views={views} />
        </div>
        <aside className="mt-6 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0">
          <RecommendedList videos={recs} loading={recommended.id !== id} />
        </aside>
        <div className="lg:col-start-1 lg:row-start-3">
          <CommentsSection
            videoId={video.id}
            creatorId={video.user_id}
            total={commentTotal}
            userName={user?.name}
            onCountChange={(d) => setCommentDelta((c) => ({ id, delta: (c.id === id ? c.delta : 0) + d }))}
          />
        </div>
      </div>
    </AppLayout>
  )
}
