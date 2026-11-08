// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Media from './Media.jsx'
import { EXIDX, gifSrc, imgSrc } from '../lib/exercises.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
const state = vi.hoisted(() => ({ S: { gifSize: 'full' }, update: () => {} }))
vi.mock('../store/useStore.js', () => ({ useStore: selector => selector(state) }))
let host, root, fetchSpy, playSpy, pauseSpy
beforeEach(() => {
  state.S = { gifSize: 'full' }
  host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host)
  fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Blob(['clip'], { type: 'video/mp4' })))
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:catalogue-demo')
  playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
  pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
})
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks() })
const ex = id => ({ id, n: 'test movement', img: id + '.webp', gif: id + '.mp4' })
const mount = exercise => act(() => root.render(<Media ex={exercise} />))
const tap = () => act(() => host.querySelector('.forge-loop-button').click())
const settle = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)) })

it('shows a local still first without fetching a clip or loading YouTube', () => {
  mount(ex('idle'))
  expect(host.querySelector('.forge-loop-still').getAttribute('src')).toBe('exercise-media/still/idle.webp')
  expect(fetchSpy).not.toHaveBeenCalled()
  expect(host.querySelector('video')).toBeNull()
  expect(host.querySelector('iframe')).toBeNull()
  expect(host.querySelector('.forge-video-cover')).toBeNull()
})

it('buffers on tap, loops inline, and pauses/resumes without downloading again', async () => {
  mount(ex('loop-test')); tap()
  expect(host.textContent).toContain('Carregando movimento')
  await settle()
  const video = host.querySelector('video')
  expect(video.src).toContain('blob:catalogue-demo')
  expect(video.loop).toBe(true)
  expect(video.hasAttribute('playsinline')).toBe(true)
  expect(video.muted).toBe(true)
  expect(playSpy).toHaveBeenCalled()
  expect(video.classList.contains('visible')).toBe(false)
  act(() => video.dispatchEvent(new Event('playing')))
  expect(video.classList.contains('visible')).toBe(true)
  tap(); expect(pauseSpy).toHaveBeenCalled()
  expect(host.querySelector('.forge-loop-button').getAttribute('aria-pressed')).toBe('false')
  tap(); await settle(); expect(fetchSpy).toHaveBeenCalledTimes(1)
  expect(host.querySelector('iframe')).toBeNull()
})

it('keeps the same exercise and selected figure in still and animation', async () => {
  state.S.exFigure = 'female'
  const exercise = EXIDX['0001']
  mount(exercise)
  expect(host.querySelector('.forge-loop-still').getAttribute('src')).toBe(imgSrc(exercise, 'female'))
  tap(); await settle()
  expect(fetchSpy).toHaveBeenCalledWith(gifSrc(exercise, 'female'))
})

it('keeps the still when a clip fails and offers retry and optional YouTube', async () => {
  mount(ex('failure-test')); tap(); await settle()
  act(() => host.querySelector('video').dispatchEvent(new Event('error')))
  expect(host.querySelector('video')).toBeNull()
  expect(host.querySelector('.forge-loop-still')).toBeTruthy()
  expect(host.textContent).toContain('Não foi possível carregar')
  expect(host.querySelector('iframe')).toBeNull()
  tap(); await settle(); expect(host.querySelector('video')).toBeTruthy()
  act(() => { const details = host.querySelector('.forge-video-alternative'); details.open = true; details.dispatchEvent(new Event('toggle')) })
  expect(host.textContent).toContain('Buscar no YouTube')
})

it('resets to the new still when switching exercises and stops playback when hidden', async () => {
  mount(ex('switch-test')); tap(); await settle()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(host.querySelector('.forge-loop-button').getAttribute('aria-pressed')).toBe('false')
  mount(ex('next-test'))
  expect(host.querySelector('video')).toBeNull()
  expect(host.querySelector('.forge-loop-still').src).toContain('next-test.webp')
  expect(fetchSpy).toHaveBeenCalledTimes(1)
})

it('handles a rejected browser playback request without leaving a false playing state', async () => {
  playSpy.mockRejectedValue(new Error('NotAllowedError'))
  mount(ex('refusal-test')); tap(); await settle()
  expect(host.querySelector('.forge-loop-button').getAttribute('aria-pressed')).toBe('false')
  expect(host.textContent).toContain('Toque em Ver movimento')
  expect(host.querySelector('.forge-loop-still')).toBeTruthy()
})
