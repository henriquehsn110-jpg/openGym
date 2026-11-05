import library from './forge-library-videos.json'

const normalize = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
const host = 'pub-585d42eb1aa64a67aedf483ec328d3fe.r2.dev'
const safeMedia = (value, folder, extension) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && url.hostname === host && !url.username && !url.password &&
      url.pathname.startsWith('/' + folder + '/') && url.pathname.endsWith(extension) ? url.href : null
  } catch { return null }
}

// The two catalogues reuse IDs for different movements. Never join by ID alone.
// These twelve mappings were checked against movement, equipment and source metadata.
export function libraryVideoFor(ex, figure = 'male') {
  const item = library.exercises[ex?.id]
  if (!item || normalize(ex.n) !== item.expectedName || normalize(ex.eq) !== item.equipment) return null
  const body = figure === 'female' ? 'female' : 'male'
  const video = safeMedia(item.videos[body], 'exercise-videos', '.mp4')
  if (!video) return null
  return { video, poster: safeMedia(item.posters[body], 'exercise-posters', '.jpg'), sourceName: item.sourceName }
}
