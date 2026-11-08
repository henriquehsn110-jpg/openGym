import library from './forge-library-videos.json'

const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
// Serve the licensed free clips with the app: no third-party CDN at playback time.
const safeMedia = (value, id, extension) =>
  value === './forge-media/ymove/' + id + extension ? value : null

// The two catalogues reuse IDs for different movements. Never join by ID alone.
// Match movement AND equipment, including the attachment and machine variant.
// The free pulldown uses a triangle; the free pushdown uses a rope, not a bar.
export function libraryVideoFor(ex, figure = 'male') {
  const item = library.exercises[ex?.id]
  if (!item || normalize(ex.n) !== item.expectedName || normalize(ex.eq) !== item.equipment) return null
  const video = safeMedia(item.video, ex.id, '.mp4')
  if (!video) return null
  return { video, poster: safeMedia(item.poster, ex.id, '.jpg'), sourceName: item.sourceName }
}
