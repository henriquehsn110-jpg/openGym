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
const mount=(id='0334')=>act(()=>root.render(<Media ex={EXIDX[id]}/>));
const play=()=>act(()=>host.querySelector('.forge-library-cover').click());

it('rejects shared ID collisions, unknown exercises and equipment changes',()=>{
 expect(libraryVideoFor(EXIDX['0289'])).toBeNull();
 expect(libraryVideoFor({id:'0334',n:'seated shoulder press',eq:'dumbbell'})).toBeNull();
 expect(libraryVideoFor({...EXIDX['0334'],eq:'barbell'})).toBeNull();
 for(const id of Object.keys(library.exercises))expect(libraryVideoFor(EXIDX[id])?.video).toBe('./forge-media/ymove/'+id+'.mp4');
 expect(libraryVideoFor(EXIDX['2291'])).toBeNull(); // wide grip is not the triangle clip
 expect(libraryVideoFor(EXIDX['0201'])).toBeNull(); // bar pushdown is not rope pushdown
 expect(Object.keys(library.exercises)).toHaveLength(7);
})

it('loads no video before a tap, then streams inline with native controls',()=>{
 mount();expect(host.querySelector('video')).toBeNull();expect(host.querySelector('iframe')).toBeNull();
 expect(fetchSpy).not.toHaveBeenCalled();play();
 const video=host.querySelector('video');
 expect(video.getAttribute('src')).toBe(libraryVideoFor(EXIDX['0334']).video);
 expect(video.controls).toBe(true);expect(video.loop).toBe(true);expect(video.muted).toBe(true);
 expect(video.hasAttribute('playsinline')).toBe(true);expect(fetchSpy).not.toHaveBeenCalled();
})

it('uses the real clip model and resets playback when the figure changes',()=>{
 state.S.exFigure='female';mount();play();expect(host.querySelector('video').src).toContain('/ymove/');
 state.S.exFigure='male';mount();expect(host.querySelector('video')).toBeNull();play();
 expect(host.querySelector('video').src).toContain('/ymove/');
})

it('offers the matching YouTube explanation and retry when media fails',()=>{
 mount();play();act(()=>host.querySelector('video').dispatchEvent(new Event('error')));
 expect(host.querySelector('.forge-video-cover')).toBeTruthy();expect(host.querySelector('video')).toBeNull();
 expect(host.textContent).toContain('O vídeo não carregou');
 expect(host.textContent).toContain('YouTube');
 act(()=>host.querySelector('.forge-media-minimize').click());
 expect(host.querySelector('.forge-library-cover')).toBeTruthy();
})

it('pauses media when the application goes into the background',()=>{
 mount();play();pauseSpy.mockClear();vi.spyOn(document,'hidden','get').mockReturnValue(true);
 act(()=>document.dispatchEvent(new Event('visibilitychange')));expect(pauseSpy).toHaveBeenCalled();
})

// These exercise variants intentionally have no matching free clip.
it('shows the exact YouTube variant for wide pulldown and bar pushdown',()=>{
 for(const id of ['2291','0201']){
  mount(id);expect(host.querySelector('.forge-library-cover')).toBeNull();
  expect(host.querySelector('.forge-video-cover')).toBeTruthy();
  expect(host.querySelector('.forge-loop-button')).toBeNull();
 }
})
