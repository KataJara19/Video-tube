// Reproductor principal. El archivo de video (MP4 o WebM) se carga directamente desde S3 (URL prefirmada).
export default function VideoPlayer({ video, onPlay }) {
  return (
    <div className="overflow-hidden bg-black sm:rounded-xl">
      <video
        key={video.id}
        src={video.video_url}
        poster={video.thumbnail_url}
        controls
        autoPlay
        playsInline
        onPlay={onPlay}
        className="aspect-video w-full bg-black"
      />
    </div>
  )
}
