// @vitest-environment happy-dom
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {it,expect,vi} from 'vitest'
vi.mock('../lib/api.js',()=>({api:vi.fn()}))
import Nutrition from './Nutrition.jsx'
import ForgeHome from './ForgeHome.jsx'
import {useStore,freshState} from '../store/useStore.js'
import {ensureForgeMeals,startEmptyNutrition,restorePreviousNutrition} from '../lib/forge-profile.js'
import {TEMPLATE,LEGACY_TEMPLATE,cloneMeals} from '../lib/forge-meals.js'
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const mount=component=>{const host=document.createElement('div'),root=createRoot(host);act(()=>root.render(<MemoryRouter>{component}</MemoryRouter>));return {host,close:()=>act(()=>root.unmount())}}
it('ships no personal dietary template and initializes new profiles independently',()=>{
 expect(TEMPLATE).toEqual([]);expect(LEGACY_TEMPLATE).toEqual([]);expect(cloneMeals()).toEqual([])
 const owner={forgeNutrition:[{title:'PRIVATE meal',text:'PRIVATE food'}],forgeNutritionVersion:2};const guest={};ensureForgeMeals(owner);ensureForgeMeals(guest);expect(guest.forgeNutrition).toEqual([]);expect(owner.forgeNutrition[0].text).toBe('PRIVATE food')
 guest.forgeNutrition.push({title:'guest'});expect(owner.forgeNutrition).toHaveLength(1)
})
it('opens both the dashboard and nutrition empty for a fresh family browser',()=>{
 for(const page of [<Nutrition/>,<ForgeHome/>]){useStore.setState({S:freshState(),user:null});const app=mount(page);expect(useStore.getState().S.forgeNutrition).toEqual([]);expect(app.host.querySelectorAll('.forge-meal')).toHaveLength(0);expect(app.host.textContent).not.toContain('11h40');expect(app.host.textContent).not.toContain('frango desfiado');app.close()}
})
it('preserves all existing records on upgrade, and provides reversible empty nutrition only on request',()=>{
 const s={forgeNutrition:[{title:'Mine',text:'private',options:[{name:'option',text:'food'}]}],forgeNutritionVersion:2,workouts:[{id:'done'}],routines:[{id:'keep'}]};const before=structuredClone(s);ensureForgeMeals(s);expect(s.forgeNutrition).toEqual(before.forgeNutrition);startEmptyNutrition(s);expect(s.forgeNutrition).toEqual([]);startEmptyNutrition(s);expect(s.forgeNutritionPrevious).toEqual(before.forgeNutrition);restorePreviousNutrition(s);expect(s.forgeNutrition).toEqual(before.forgeNutrition);expect(s.workouts).toEqual(before.workouts);expect(s.routines).toEqual(before.routines)
})
it('lets an existing family device clear its copied plan and undo through the UI',()=>{
 const original=[{title:'Existing meal',text:'Existing portions',options:[]}];useStore.setState({S:{...freshState(),forgeNutrition:original,forgeNutritionVersion:2},user:null});const app=mount(<Nutrition/>);expect(app.host.textContent).toContain('Existing portions');act(()=>[...app.host.querySelectorAll('button')].find(b=>b.textContent==='Começar alimentação vazia').click());expect(app.host.querySelectorAll('.forge-meal')).toHaveLength(0);expect(app.host.textContent).not.toContain('Existing portions');act(()=>[...app.host.querySelectorAll('button')].find(b=>b.textContent==='Restaurar alimentação anterior').click());expect(useStore.getState().S.forgeNutrition).toEqual(original);app.close()
})
