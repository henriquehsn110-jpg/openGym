// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import ForgeWorkouts from './ForgeWorkouts.jsx'
import ForgeHome from './ForgeHome.jsx'
const store=vi.hoisted(()=>({S:{},update:vi.fn()}))
vi.mock('../store/useStore.js',()=>({useStore:fn=>fn(store)}))
vi.mock('../components/Media.jsx',()=>({default:()=>null,Thumb:()=>null}))
vi.mock('../components/InstallApp.jsx',()=>({default:()=>null}))
vi.mock('../sheets.jsx',()=>({startFlow:vi.fn()}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
let host,root
beforeEach(()=>{store.S={routines:[],week:{},forgeNutrition:[],forgeNutritionVersion:3};store.update=vi.fn();host=document.createElement('div');document.body.appendChild(host);root=createRoot(host)})
afterEach(()=>{act(()=>root.unmount());host.remove()})
const render=Component=>act(()=>root.render(<MemoryRouter><Component/></MemoryRouter>))
it('starts empty profiles with a choice, without installing the default four-day plan',()=>{
 render(ForgeWorkouts);expect(store.update).not.toHaveBeenCalled();expect(host.querySelector('a[href="/training/start"]')).not.toBeNull();expect(host.textContent).not.toContain('Superiores A')
 render(ForgeHome);expect(host.querySelector('.forge-hero-actions a').getAttribute('href')).toBe('/training/start');expect(host.textContent).not.toContain('Quatro dias.');expect(store.update).not.toHaveBeenCalled()
})
it('shows imported timed holds, per-set repetitions and zero rest accurately',()=>{
 store.S.routines=[{id:'imported',name:'Treino PDF',ex:[{id:'0289',mode:'time',sets:3,sec:30,restSec:0},{id:'0294',sets:3,pyramid:[12,10,8],restSec:60}]}]
 render(ForgeWorkouts);expect(host.textContent).toContain('3 séries × 30 s');expect(host.textContent).toContain('0s de descanso');expect(host.textContent).toContain('3 séries × 12 / 10 / 8')
})
