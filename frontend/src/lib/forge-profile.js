import { TEMPLATE, LEGACY_TEMPLATE, cloneMeals } from './forge-meals.js'
import raw from './forge-plan.json' with {type:'json'}
import {parsePlan,mergePlan} from './plan-share.js'
export function ensureForgeMeals(s){
 if(!Array.isArray(s.forgeNutrition)){s.forgeNutrition=cloneMeals();s.forgeNutritionVersion=2;return true}
 if(s.forgeNutritionVersion===2)return false
 // Upgrade known rows once, preserving custom notes, removed meals, and intentionally empty options.
 s.forgeNutrition=s.forgeNutrition.map(row=>{
  const index=LEGACY_TEMPLATE.findIndex(x=>x.title===row.title)
  const base=TEMPLATE.find(x=>x.id===row.id)||TEMPLATE[index]
  if(!base||row.options!==undefined)return row
  if(index>=0&&row.text===LEGACY_TEMPLATE[index].text)return structuredClone(base)
  return {...row,id:row.id||base.id,...(base.options?{options:structuredClone(base.options)}:{})}
 });s.forgeNutritionVersion=2;return true
}
export function activateForgePlan(s){
 const existing=s.routines||[]
 const has=raw.routines.every(r=>existing.some(x=>x.name===r.name && JSON.stringify((x.ex||[]).map(e=>e.id))===JSON.stringify(r.ex.map(e=>e.id))))
 if(has||s.forgeTitanLoaded)return false
 const empty=existing.length===0;mergePlan(s,parsePlan(raw,s.unit||'kg'),{schedule:empty});s.forgeTitanLoaded=true;return true
}
