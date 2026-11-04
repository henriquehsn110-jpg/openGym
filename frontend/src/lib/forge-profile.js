import { TEMPLATE } from './forge-meals.js'
import raw from './forge-plan.json' with {type:'json'}
import {parsePlan,mergePlan} from './plan-share.js'
export function ensureForgeMeals(s){if(!Array.isArray(s.forgeNutrition)){s.forgeNutrition=TEMPLATE.map(x=>({...x}));return true}return false}
export function activateForgePlan(s){
 const existing=s.routines||[]
 const has=raw.routines.every(r=>existing.some(x=>x.name===r.name && JSON.stringify((x.ex||[]).map(e=>e.id))===JSON.stringify(r.ex.map(e=>e.id))))
 if(has||s.forgeTitanLoaded)return false
 const empty=existing.length===0;mergePlan(s,parsePlan(raw,s.unit||'kg'),{schedule:empty});s.forgeTitanLoaded=true;return true
}
