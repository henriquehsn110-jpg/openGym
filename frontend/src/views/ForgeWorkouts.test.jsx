// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {it,expect,vi} from 'vitest'
import ForgeWorkouts from './ForgeWorkouts.jsx'
const store=vi.hoisted(()=>({S:{}}))
vi.mock('../store/useStore.js',()=>({useStore:fn=>fn(store)}))
vi.mock('../sheets.jsx',()=>({startFlow:vi.fn()}))
vi.mock('../components/Media.jsx',()=>({default:()=>null,Thumb:()=>null}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
it('shows and opens an unscheduled imported routine when an old plan already exists',()=>{
 store.S={routines:[{id:'old',name:'Plano antigo',ex:[]},{id:'pdf',name:'Ficha nova do PDF',ex:[]}],week:{1:['old']}}
 const host=document.createElement('div'),root=createRoot(host)
 act(()=>root.render(<MemoryRouter initialEntries={['/my-training?routine=pdf']}><ForgeWorkouts/></MemoryRouter>))
 const buttons=[...host.querySelectorAll('[aria-label="Escolher treino"] button')]
 expect(buttons).toHaveLength(2)
 expect(buttons[1].textContent).toContain('SEM DIA DEFINIDO')
 expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
 expect(host.querySelector('.forge-workout-top h2').textContent).toBe('Ficha nova do PDF')
 act(()=>root.unmount())
})
