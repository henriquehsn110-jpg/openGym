import raw from './forge-plan.json' with {type:'json'}
import {parsePlan,mergePlan} from './plan-share.js'
export const NUTRITION_VERSION=3
export function ensureForgeMeals(s){
 const changed=!Array.isArray(s.forgeNutrition)||s.forgeNutritionVersion!==NUTRITION_VERSION
 if(!Array.isArray(s.forgeNutrition))s.forgeNutrition=[]
 // Never infer ownership from meal contents or erase a previously saved plan.
 s.forgeNutritionVersion=NUTRITION_VERSION
 return changed
}
export function startEmptyNutrition(s){
 if(!Array.isArray(s.forgeNutrition)||!s.forgeNutrition.length)return ensureForgeMeals(s)
 s.forgeNutritionPrevious=structuredClone(s.forgeNutrition)
 s.forgeNutrition=[];s.forgeNutritionVersion=NUTRITION_VERSION
 return true
}
export function restorePreviousNutrition(s){
 if(!Array.isArray(s.forgeNutritionPrevious)||!s.forgeNutritionPrevious.length)return false
 const current=structuredClone(s.forgeNutrition||[])
 s.forgeNutrition=structuredClone(s.forgeNutritionPrevious)
 s.forgeNutritionPrevious=current;s.forgeNutritionVersion=NUTRITION_VERSION
 return true
}
export function activateForgePlan(s){
 const existing=s.routines||[]
 const has=raw.routines.every(r=>existing.some(x=>x.name===r.name && JSON.stringify((x.ex||[]).map(e=>e.id))===JSON.stringify(r.ex.map(e=>e.id))))
 if(has||s.forgeTitanLoaded)return false
 const empty=existing.length===0;mergePlan(s,parsePlan(raw,s.unit||'kg'),{schedule:empty});s.forgeTitanLoaded=true;return true
}
