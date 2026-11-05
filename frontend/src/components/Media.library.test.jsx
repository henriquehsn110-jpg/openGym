// @vitest-environment happy-dom
import React, {act} from 'react'
import {createRoot} from 'react-dom/client'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import Media from './Media.jsx'
import {EXIDX} from '../lib/exercises.js'
import {libraryVideoFor} from '../lib/forge-library-video.js'
import library from '../lib/forge-library-videos.json'

globalThis.IS_REACT_ACT_ENVIRONMENT=true
const state=vi.hoisted(()=>({S:{gifSize:'full'},update:()=>{}}))
vi.mock('../store/useStore.js',()=>({useStore:selector=>selector(state)}))
let host,root,pauseSpy,fetchSpy
beforeEach(()=>{
 state.S={gifSize:'full'};
 host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);
 vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 pauseSpy=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 fetchSpy=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('should not fetch entire HD clip'));
})
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks()})
const mount=(id='0314')=>act(()=>root.render(<Media ex={EXIDX[id]}/>));
const play=()=>act(()=>host.querySelector('.forge-library-cover').click());

it('rejects shared ID collisions, unknown exercises and equipment changes',()=>{
 expect(libraryVideoFor(EXIDX['0289'])).toBeNull();
 expect(libraryVideoFor({id:'0314',n:'seated shoulder press',eq:'dumbbell'})).toBeNull();
 expect(libraryVideoFor({...EXIDX['0314'],eq:'barbell'})).toBeNull();
 for(const id of Object.keys(library.exercises))expect(libraryVideoFor(EXIDX[id])?.video).toContain('/male/');
 expect(Object.keys(library.exercises)).toHaveLength(12);
})

it('loads no video before a tap, then streams inline with native controls',()=>{
 mount();expect(host.querySelector('video')).toBeNull();expect(host.querySelector('iframe')).toBeNull();
 expect(fetchSpy).not.toHaveBeenCalled();play();
 const video=host.querySelector('video');
 expect(video.src).toBe(libraryVideoFor(EXIDX['0314']).video);
 expect(video.controls).toBe(true);expect(video.loop).toBe(true);expect(video.muted).toBe(true);
 expect(video.hasAttribute('playsinline')).toBe(true);expect(fetchSpy).not.toHaveBeenCalled();
})

it('uses the selected figure and resets playback when the figure changes',()=>{
 state.S.exFigure='female';mount();play();expect(host.querySelector('video').src).toContain('/female/');
 state.S.exFigure='male';mount();expect(host.querySelector('video')).toBeNull();play();
 expect(host.querySelector('video').src).toContain('/male/');
})

it('falls back to the original drawing and offers retry when remote media fails',()=>{
 mount();play();act(()=>host.querySelector('video').dispatchEvent(new Event('error')));
 expect(host.querySelector('.forge-loop-still')).toBeTruthy();expect(host.querySelector('video')).toBeNull();
 expect(host.textContent).toContain('O vídeo externo não carregou');
 expect(host.textContent).toContain('YouTube');
 act(()=>host.querySelector('.forge-media-minimize').click());
 expect(host.querySelector('.forge-library-cover')).toBeTruthy();
})

it('pauses media when the application goes into the background',()=>{
 mount();play();pauseSpy.mockClear();vi.spyOn(document,'hidden','get').mockReturnValue(true);
 act(()=>document.dispatchEvent(new Event('visibilitychange')));expect(pauseSpy).toHaveBeenCalled();
})
