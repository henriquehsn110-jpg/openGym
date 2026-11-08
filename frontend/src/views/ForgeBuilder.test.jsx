// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import ForgeBuilder from './ForgeBuilder.jsx'
const store=vi.hoisted(()=>({S:{},update:vi.fn()}))
vi.mock('../store/useStore.js',()=>({useStore:fn=>fn(store)}))
globalThis.IS_REACT_ACT_ENVIRONMENT=true
let host,root
beforeEach(()=>{store.S={routines:[{id:'old',name:'Existing',ex:[{weight:25}]}],week:{2:['old']},workouts:[{id:'done'}],forgeYouTube:{'0289':'custom'}};store.update=vi.fn(fn=>fn(store.S));host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);act(()=>root.render(<MemoryRouter><ForgeBuilder/></MemoryRouter>))})
afterEach(()=>{act(()=>root.unmount());host.remove()})
const label=text=>[...host.querySelectorAll('label')].find(l=>l.textContent.includes(text))
const click=text=>act(()=>label(text).querySelector('input').click())
const select=(text,value)=>act(()=>{const e=label(text).querySelector('select');e.value=value;e.dispatchEvent(new Event('change',{bubbles:true}))})
const generate=()=>act(()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
const complete=()=>{click('Tenho 18');select('Condição atual','none');click('Halteres');generate()}
it('does not mutate records when generating; applies only after explicit review without changing schedule',()=>{
 const before=JSON.stringify(store.S);complete();expect(host.querySelectorAll('table[aria-label^="Exercícios de "]')).toHaveLength(3);expect(JSON.stringify(store.S)).toBe(before)
 const apply=[...host.querySelectorAll('button')].find(b=>b.textContent==='Adicionar esta ficha ao meu plano');expect(apply.disabled).toBe(true)
 click('Revisei os exercícios');expect(apply.disabled).toBe(false);act(()=>apply.click());expect(store.S.routines).toHaveLength(4);expect(store.S.week).toEqual({2:['old']});expect(store.S.workouts).toEqual([{id:'done'}]);expect(store.S.routines[0].ex[0].weight).toBe(25);expect(host.textContent).toContain('Ficha adicionada.')
})
it('invalidates the proposal and review when answers change',()=>{
 complete();click('Revisei os exercícios');select('Tempo por sessão','30');expect(host.querySelector('table')).toBeNull();generate();expect([...host.querySelectorAll('button')].find(b=>b.textContent==='Adicionar esta ficha ao meu plano').disabled).toBe(true)
})
it('refuses automatic generation for restrictions and missing equipment',()=>{
 click('Tenho 18');select('Condição atual','review');click('Halteres');generate();expect(host.querySelector('table')).toBeNull();expect(host.querySelector('[role=alert]').textContent).toContain('avaliação profissional')
 select('Condição atual','none');click('Halteres');generate();expect(host.querySelector('[role=alert]').textContent).toContain('halteres, elástico ou polia')
})
it('generates seven selected days with separate strength and recovery prescriptions',()=>{
 click('Tenho 18');select('Condição atual','none');select('Experiência atual','regular');click('Halteres')
 for(const day of ['Ter','Qui','Sáb','Dom'])click(day)
 generate();expect(host.querySelectorAll('table[aria-label^="Exercícios de "]')).toHaveLength(7);expect(host.textContent).toContain('6 de musculação e 1 de recuperação ativa');expect(host.textContent).toContain('Caminhada leve');expect(host.textContent).not.toContain('undefined');expect(host.textContent).not.toContain('NaN')
})

it('lets a person request five strength sessions and explains muscle coverage and effort before saving',()=>{
 click('Tenho 18');select('Condição atual','none');select('Experiência atual','regular');click('Halteres');for(const day of ['Ter','Qui'])click(day)
 select('Sessões de musculação por semana','5');generate();expect(host.textContent).toContain('5 de musculação e 0 de recuperação ativa');expect(host.querySelector('[aria-label="Cobertura muscular semanal"]')).not.toBeNull();expect(host.textContent).toContain('Séries secundárias');expect(host.textContent).toContain('Tríceps');expect(host.textContent).toContain('Glúteos');expect(host.textContent).toContain('2–3');expect(store.update).not.toHaveBeenCalled()
})
it('invalidates the proposal when the requested strength count changes',()=>{
 complete();select('Sessões de musculação por semana','2');expect(host.querySelector('table')).toBeNull();generate();expect(host.textContent).toContain('2 de musculação e 1 de recuperação ativa')
})
it('reuses a previous intake for review without silently accepting current health screening or altering the saved plan',()=>{
 store.S.forgeGeneratedPlans=[{version:2,intake:{name:'Anterior',adult:true,screen:'none',goal:'fatloss',experience:'regular',minutes:45,days:[1,2,3,4,5],equipment:['dumbbell'],exclude:[]}}];act(()=>root.render(<MemoryRouter><ForgeBuilder/></MemoryRouter>));const before=JSON.stringify(store.S)
 act(()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Usar respostas da última ficha').click());expect(label('Tenho 18').querySelector('input').checked).toBe(false);expect(label('Condição atual').querySelector('select').value).toBe('');expect(label('Objetivo principal').querySelector('select').value).toBe('fatloss');expect(JSON.stringify(store.S)).toBe(before)
})
