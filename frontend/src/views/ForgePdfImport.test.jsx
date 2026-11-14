// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import ForgePdfImport from './ForgePdfImport.jsx'
import ForgeStart from './ForgeStart.jsx'
const store=vi.hoisted(()=>({S:{},update:vi.fn()}))
vi.mock('../store/useStore.js',()=>({useStore:fn=>fn(store)}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
let host,root
beforeEach(()=>{store.S={routines:[{id:'old',ex:[{weight:25}]}],week:{2:['old']},workouts:[{id:'done'}],forgeMeals:[{name:'keep'}]};store.update=vi.fn(fn=>fn(store.S));host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);act(()=>root.render(<MemoryRouter><ForgePdfImport/></MemoryRouter>))})
afterEach(()=>{act(()=>root.unmount());host.remove()})
const label=text=>[...host.querySelectorAll('label')].find(l=>l.textContent.includes(text))
const click=text=>act(()=>label(text).querySelector('input').click())
const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent===text)
const input=(el,value)=>act(()=>{Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}))})
const prepare=text=>{input(label('Texto extraído do PDF').querySelector('textarea'),text);act(()=>button('Preparar revisão do texto').click())}
it('offers both entry paths',()=>{act(()=>root.render(<MemoryRouter><ForgeStart/></MemoryRouter>));expect(host.querySelector('a[href="/training/import"]')).not.toBeNull();expect(host.querySelector('a[href="/training/new"]')).not.toBeNull()})
it('requires exercise review, invalidates it on edits, saves once without replacing existing records',()=>{
 const before=structuredClone(store.S);prepare('Treino A\nSupino reto com halteres 3x8-12 descanso 90s');expect(store.S).toEqual(before);expect(button('Importar ficha revisada').disabled).toBe(true)
 click('Conferi este exercício');expect(button('Importar ficha revisada').disabled).toBe(false)
 input(label('Séries').querySelector('input'),'4');expect(button('Importar ficha revisada').disabled).toBe(true);click('Conferi este exercício');act(()=>button('Importar ficha revisada').click())
 expect(store.S.routines).toHaveLength(2);expect(store.S.routines[1].ex[0].sets).toBe(4);for(const k of ['week','workouts','forgeMeals'])expect(store.S[k]).toEqual(before[k]);expect(host.textContent).toContain('Ficha importada.');expect(button('Importar ficha revisada')).toBeUndefined()
})
it('keeps unknown names unresolved until a person maps them or explicitly chooses custom',()=>{
 prepare('Movimento da família 3x10');click('Conferi este exercício');act(()=>button('Importar ficha revisada').click());expect(host.querySelector('[role=alert]').textContent).toContain('correspondência');expect(store.S.routines).toHaveLength(1)
 click('Manter como exercício personalizado');click('Conferi este exercício');act(()=>button('Importar ficha revisada').click());expect(store.S.customEx).toHaveLength(1);expect(store.S.customEx[0].n).toBe('Movimento da família')
})
it('blocks imports during a session',()=>{
 store.S.active={};act(()=>root.render(<MemoryRouter><ForgePdfImport/></MemoryRouter>));prepare('Supino reto com halteres 3x10');click('Conferi este exercício');expect(button('Importar ficha revisada').disabled).toBe(true)
})

it('reviews a complete table in bulk and explicitly keeps unmatched exercises as custom',()=>{
 prepare('SEXTA · INFERIORES B | 5 séries\nExercício | Séries × reps | Descanso | Carga\nAgachamento goblet | 3 × 8–12 | 120 s | ____\nMovimento especial | 2 × 12–15 / perna | 75 s | ____')
 act(()=>button('Marcar todos como conferidos').click())
 expect(button('Importar ficha revisada').disabled).toBe(true)
 click('Manter exercícios sem correspondência como personalizados')
 act(()=>button('Marcar todos como conferidos').click())
 act(()=>button('Importar ficha revisada').click())
 expect(store.S.routines.at(-1).name).toBe('INFERIORES B')
 expect(store.S.routines.at(-1).ex[1]).toMatchObject({side:true,restSec:75,sets:2,repsMin:12,repsMax:15})
 expect(store.S.customEx).toHaveLength(1)
})
