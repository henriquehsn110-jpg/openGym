// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {expect,it,vi} from 'vitest'
import {useStore,freshState} from '../store/useStore.js'
import {parseTrainingText,applyPdfPlan} from '../lib/forge-pdf-plan.js'
import {nextForgeRoutine} from '../lib/forge-schedule.js'
import ForgeWorkouts from './ForgeWorkouts.jsx'

vi.mock('../components/Media.jsx',()=>({default:()=>null,Thumb:()=>null}))
vi.mock('../sheets.jsx',()=>({startFlow:vi.fn()}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true

it('shows imported routines beside an old schedule and activates the selected routine for a weekday',()=>{
 const active={id:'live',start:1000,entries:[{id:'0289',sets:[{w:20,r:10,done:true}]}]}
 const state={...freshState(),routines:[{id:'old',name:'Ficha antiga',ex:[]}],week:{1:['old'],4:['old']},active,workouts:[{id:'completed'}]}
 const draft=parseTrainingText('Treino A\nSupino reto com halteres 3x8-12\nTreino B\nSupino reto com halteres 2x10')
 for(const routine of draft.routines)for(const row of routine.ex)row.reviewed=true
 const ids=applyPdfPlan(state,draft)
 useStore.setState({S:state,user:null})
 const host=document.createElement('div'),root=createRoot(host)
 try{
  act(()=>root.render(<MemoryRouter initialEntries={['/my-training?routine='+ids[1]]}><ForgeWorkouts/></MemoryRouter>))
  expect(host.querySelectorAll('.forge-routine-picker button')).toHaveLength(3)
  expect(host.querySelector('.forge-workout-top h2').textContent).toBe('Treino B')
  const monday=[...host.querySelectorAll('label')].find(label=>label.textContent==='Segunda-feira').querySelector('input')
  act(()=>monday.click())
  act(()=>[...host.querySelectorAll('button')].find(button=>button.textContent==='Salvar dias desta ficha').click())
  const saved=useStore.getState().S
  expect(saved.week).toEqual({1:[ids[1]],4:['old']})
  expect(saved.active).toEqual(active)
  expect(saved.workouts).toEqual([{id:'completed'}])
  expect(nextForgeRoutine(saved,new Date(2026,10,16)).r.id).toBe(ids[1])
  const persisted=Object.keys(localStorage).map(key=>{try{return JSON.parse(localStorage.getItem(key))}catch{return null}}).find(value=>value?.routines?.some(routine=>routine.id===ids[1]))
  expect(persisted.week).toEqual(saved.week)
  expect(host.textContent).toContain('Dias salvos para Treino B.')
 }finally{act(()=>root.unmount())}
})

it('keeps the complete latest import when removing previous routines, including old duplicates',()=>{
 const active={id:'live',start:1000,entries:[{id:'0289',sets:[{w:20,r:10,done:true}]}]}
 useStore.setState({S:{...freshState(),routines:[],active,workouts:[{id:'completed'}]},user:null})
 const draft=parseTrainingText('Treino A\nSupino reto com halteres 3x10\nTreino B\nSupino reto com halteres 2x10')
 for(const routine of draft.routines)for(const row of routine.ex)row.reviewed=true
 let oldIds,newIds
 useStore.getState().update(s=>{oldIds=applyPdfPlan(s,draft)})
 useStore.getState().update(s=>{s.week={1:[oldIds[0]],4:[oldIds[1]]};s.dayPlan={'2026-12-01':oldIds[0]}})
 useStore.getState().update(s=>{newIds=applyPdfPlan(s,draft)})
 // Exercise migration for PDFs imported before the batch marker existed.
 useStore.getState().update(s=>{delete s.forgeLastPdfImport})
 const host=document.createElement('div'),root=createRoot(host)
 const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)
 try{
  act(()=>root.render(<MemoryRouter><ForgeWorkouts/></MemoryRouter>))
  act(()=>button('Excluir fichas anteriores').click())
  const checks=[...host.querySelectorAll('fieldset')].find(f=>f.textContent.startsWith('Fichas para manter')).querySelectorAll('input')
  expect([...checks].map(c=>c.checked)).toEqual([false,false,true,true])
  act(()=>button('Manter apenas as fichas marcadas').click())
  const saved=useStore.getState().S
  expect(saved.routines.map(r=>r.id)).toEqual(newIds)
  expect(saved.week).toEqual({})
  expect(saved.dayPlan).toEqual({})
  expect(saved.active).toEqual(active)
  expect(saved.workouts).toEqual([{id:'completed'}])
  expect(host.querySelectorAll('.forge-routine-picker button')).toHaveLength(2)
  expect(host.textContent).toContain('2 fichas anteriores excluídas.')
 }finally{act(()=>root.unmount())}
})
