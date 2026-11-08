// Download only the seven publicly licensed free clips, then serve them with FORGE.
// A changed source fails the build rather than silently showing another movement.
import {readFile, writeFile, mkdir, rename} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {fileURLToPath} from 'node:url'

const root = new URL('../', import.meta.url)
const library = JSON.parse(await readFile(new URL('src/lib/forge-library-videos.json', root)))
const hash = data => createHash('sha256').update(data).digest('hex')
await mkdir(new URL('public/forge-media/ymove/', root), {recursive:true})

async function stage(id, item, poster = false) {
  const destination = new URL('public/forge-media/ymove/' + id + (poster ? '.jpg' : '.mp4'), root)
  if (!poster) {
    try { if (hash(await readFile(destination)) === item.sha256) return } catch {}
  }
  const source = new URL(poster ? item.posterSourceUrl : item.sourceUrl)
  if (source.origin !== 'https://ymove.app' || !source.pathname.startsWith('/api/free/')) throw new Error('Unapproved media source')
  let lastError
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(source, {signal:AbortSignal.timeout(60000)})
      if (!response.ok) throw new Error('HTTP ' + response.status)
      const type = response.headers.get('content-type') || ''
      if (!type.startsWith(poster ? 'image/' : 'video/')) throw new Error('Unexpected media type: ' + type)
      const data = Buffer.from(await response.arrayBuffer())
      if (data.length > 30 * 1024 * 1024) throw new Error('Unexpected media size')
      if (!poster && (data.length !== item.bytes || hash(data) !== item.sha256)) throw new Error('Media digest mismatch for ' + id)
      const temp = fileURLToPath(destination) + '.tmp'
      await writeFile(temp, data)
      await rename(temp, destination)
      return
    } catch (error) { lastError = error }
  }
  throw lastError
}

// Limit simultaneous downloads on the build machine.
const pending = Object.entries(library.exercises)
await Promise.all(Array.from({length:3}, async () => {
  while (pending.length) {
    const [id, item] = pending.shift()
    await stage(id, item)
    await stage(id, item, true)
  }
}))
console.log('FORGE: seven verified Your Move clips staged for same-origin playback.')
