// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

// A still that will not load (offline and never cached, a lapsed session on a gated instance)
// gets the neutral tile an exercise without media has, not the browser's broken-image glyph (#281).
const state = vi.hoisted(() => ({ S: {} }))
vi.mock('../store/useStore.js', () => ({ useStore: selector => selector(state) }))
const { Thumb } = await import('./Media.jsx')
const { EXDB } = await import('../lib/exercises.js')
const { thumbnailFor } = await import('../lib/forge-video.js')

const mounted = []
function mount(el) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push({ root, host })
  act(() => root.render(el))
  return { host, root }
}
afterEach(() => { act(() => { mounted.splice(0).forEach(({ root, host }) => { root.unmount(); host.remove() }) }); state.S = {} })

describe('Thumb', () => {
  it('shows the still, and the neutral tile once it fails to load', () => {
    const { host } = mount(<Thumb ex={{ id: 'a', img: 'a.jpg' }} />)
    const img = host.querySelector('img.thumb')
    expect(img.getAttribute('src')).toMatch(/a\.jpg$/)
    act(() => { img.dispatchEvent(new Event('error')) })
    expect(host.querySelector('img')).toBeNull()
    expect(host.querySelector('.thumb.thumb-x')).toBeTruthy()
  })

  it('another exercise in the same place tries its own still', () => {
    const { host, root } = mount(<Thumb ex={{ id: 'a', img: 'a.jpg' }} />)
    act(() => { host.querySelector('img').dispatchEvent(new Event('error')) })
    act(() => root.render(<Thumb ex={{ id: 'b', img: 'b.jpg' }} />))
    expect(host.querySelector('img.thumb').getAttribute('src')).toMatch(/b\.jpg$/)
  })

  it('an exercise without media has the tile from the start', () => {
    const { host } = mount(<Thumb ex={{ id: 'c' }} />)
    expect(host.querySelector('.thumb-x')).toBeTruthy()
  })

  it('shows the catalogue illustrations for the first exercises in Explore without a linked video', () => {
    for (const ex of EXDB.slice(0, 4)) {
      const { host } = mount(<Thumb ex={ex} />)
      expect(host.querySelector('img').getAttribute('src')).toBe('exercise-media/still/' + ex.img)
      expect(host.querySelector('.thumb-x')).toBeNull()
      expect(host.querySelector('.forge-thumb-wrap')).toBeNull()
    }
  })

  it('falls back from a failed YouTube cover to the actual exercise illustration', () => {
    const { host } = mount(<Thumb ex={{ id: '0289', img: '0289.webp' }} />)
    expect(host.querySelector('img').src).toContain('img.youtube.com')
    act(() => host.querySelector('img').dispatchEvent(new Event('error')))
    expect(host.querySelector('img').getAttribute('src')).toBe('exercise-media/still/0289.webp')
    expect(host.querySelector('.forge-thumb-wrap')).toBeNull()
    act(() => host.querySelector('img').dispatchEvent(new Event('error')))
    expect(host.querySelector('img')).toBeNull()
    expect(host.querySelector('.thumb-x')).toBeTruthy()
  })

  it('uses the selected figure and retries a newly linked video after an old cover fails', () => {
    state.S = { exFigure: 'female', forgeYouTube: { a: 'https://youtu.be/dQw4w9WgXcQ' } }
    const ex = { id: 'a', img: '1234.webp', fv: '5678' }
    const { host, root } = mount(<Thumb ex={ex} />)
    act(() => host.querySelector('img').dispatchEvent(new Event('error')))
    expect(host.querySelector('img').getAttribute('src')).toBe('exercise-media/still/5678.webp')
    state.S.forgeYouTube.a = 'https://youtu.be/abcdefghijk'
    act(() => root.render(<Thumb ex={ex} />))
    expect(host.querySelector('img').getAttribute('src')).toBe(thumbnailFor('abcdefghijk'))
  })
})
