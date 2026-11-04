// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {expect,it,vi} from 'vitest'
vi.mock('../lib/api.js',()=>({api:vi.fn()}))
vi.mock('../sheets.jsx',()=>({startFlow:vi.fn()}))
import {startFlow} from '../sheets.jsx'
import {useStore,freshState} from '../store/useStore.js'
import {activateForgePlan} from '../lib/forge-profile.js'
import raw from '../lib/forge-plan.json' with {type:'json'}
import {FORGE_DEMOS} from '../lib/forge-demos.js'
import {demoFor,youtubeId,thumbnailFor} from '../lib/forge-video.js'
import ForgeWorkouts from './ForgeWorkouts.jsx'
import YouTubeDemo from '../components/YouTubeDemo.jsx'
import {Thumb} from '../components/Media.jsx'
import ForgeFamily,{familyAppUrl} from './ForgeFamily.jsx'
globalThis.IS_REACT_ACT_ENVIRONMENT=true
function mount(node){const host=document.createElement('div'),root=createRoot(host);act(()=>root.render(<MemoryRouter>{node}</MemoryRouter>));return {host,close:()=>act(()=>root.unmount())}}
it('has a specific video for all starter variants; IDs and equipment are kept distinct',()=>{
 const ids=[...new Set(raw.routines.flatMap(r=>r.ex.map(e=>e.id)))];expect(ids).toHaveLength(17)
 for(const id of ids){const demo=FORGE_DEMOS[id];expect(demo).toBeTruthy();expect(youtubeId(demo.source)).toBe(demo.videoId);expect(demo.tips).toHaveLength(2)}
 expect(FORGE_DEMOS['0334'].variant).toContain('Halteres');expect(FORGE_DEMOS['0599'].variant).toContain('Sentado');expect(FORGE_DEMOS['1047'].videoId).not.toBe(FORGE_DEMOS['2291'].videoId)
})
it('gives saved overrides priority and shows exactly the same video identity in cover and player',()=>{
 const url='https://youtu.be/dQw4w9WgXcQ';useStore.setState({S:{...freshState(),forgeYouTube:{'0289':url}}})
 expect(demoFor(useStore.getState().S,'0289').custom).toBe(true)
 const app=mount(<><Thumb ex={{id:'0289'}}/><YouTubeDemo ex={{id:'0289'}}/></>);
 expect([...app.host.querySelectorAll('img')].map(img=>img.src)).toEqual([thumbnailFor('dQw4w9WgXcQ'),thumbnailFor('dQw4w9WgXcQ')]);expect(app.host.querySelector('iframe')).toBe(null)
 act(()=>app.host.querySelector('.forge-video-cover').click());expect(app.host.querySelector('iframe').src).toContain('/embed/dQw4w9WgXcQ?');expect(app.host.textContent).toContain('Vídeo escolhido por você');app.close()
 expect(youtubeId('https://youtube.com.attacker.test/watch?v=dQw4w9WgXcQ')).toBe(null)
 expect(demoFor({forgeYouTube:{'0289':'javascript:alert(1)'}},'0289')).toBe(FORGE_DEMOS['0289'])
})
it('initializes an empty personal schedule and changes selected routine without changing saved records',()=>{
 useStore.setState({S:freshState()});const app=mount(<ForgeWorkouts/>);expect(useStore.getState().S.routines).toHaveLength(4);expect(app.host.querySelectorAll('.forge-exercise')).toHaveLength(5)
 const buttons=[...app.host.querySelectorAll('.forge-routine-picker button')];expect(buttons).toHaveLength(4);act(()=>buttons[1].click());expect(app.host.querySelector('.forge-workout-top h2').textContent).toBe('Pernas A')
 act(()=>[...app.host.querySelectorAll('button')].find(x=>x.textContent.includes('Iniciar treino')).click());expect(startFlow).toHaveBeenCalledWith([useStore.getState().S.routines[1].id]);app.close()
})
it('preserves existing schedules and old active sessions while offering resume',()=>{
 const s=freshState();activateForgePlan(s);s.workouts=[{id:'logged'}];s.active={start:Date.now()-24*60*60*1000,name:'old',entries:[]};const before=JSON.stringify(s);useStore.setState({S:s});const app=mount(<ForgeWorkouts/>);
 expect(app.host.textContent).toContain('sessão antiga');expect(app.host.textContent).not.toContain('Iniciar treino');expect(JSON.stringify(useStore.getState().S)).toBe(before);app.close()
})
it('shares a clean URL without profile or workout data',()=>{
 useStore.setState({S:{...freshState(),workouts:[{id:'private'}],forgeNutrition:[{text:'private meal'}]}});const app=mount(<ForgeFamily/>);expect(familyAppUrl()).toBe(window.location.origin+window.location.pathname+'#/family');expect(app.host.textContent).toContain('não tem contas');expect(app.host.textContent).not.toContain('private');app.close()
})
