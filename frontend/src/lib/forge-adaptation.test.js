import {expect,it} from 'vitest'
import {goalStatus,createAdaptation,applyAdaptation} from './forge-adaptation.js'
import {ensureForgeMeals} from './forge-profile.js'
const base=()=>({unit:'kg',routines:[{id:'a',name:'Superiores A',ex:[{id:'0289',sets:2,reps:8,repsMin:8,repsMax:12,restSec:120,weight:20}]}],week:{1:['a']},workouts:[],forgeGoal:{id:'g',focus:'fatloss',metric:'weight',direction:'down',target:88,since:'2026-11-01T12:00:00.000Z'},forgeCheckins:[{id:'c',goalId:'g',value:90,recovery:'good',pain:false,reached:true}]})
it('preserves existing meals verbatim and initializes new profiles empty',()=>{
 const meal={title:'Refeição pessoal',text:'Minha porção personalizada',options:[]};const s={forgeNutrition:[structuredClone(meal)],forgeNutritionVersion:1};ensureForgeMeals(s);expect(s.forgeNutrition).toEqual([meal]);ensureForgeMeals(s);expect(s.forgeNutrition).toEqual([meal]);const empty={};ensureForgeMeals(empty);expect(empty.forgeNutrition).toEqual([])
})
it('requires a trend, ignores checkins from previous goals, and handles both directions',()=>{
 const s=base();expect(goalStatus(s).reached).toBe(false)
 s.forgeCheckins=[{goalId:'old',value:70},...[88,87,88].map(value=>({goalId:'g',value}))]
 expect(goalStatus(s).reached).toBe(true);s.forgeGoal.direction='up';s.forgeGoal.target=90;expect(goalStatus(s).reached).toBe(false)
})
it('previews without mutation, then changes future schedule while retaining prior routines and logs',()=>{
 const s=base();s.workouts=[{id:'done',date:'2026-11-02',routineId:'a',sets:[{weight:20,reps:9}]}]
 const before=structuredClone(s),p=createAdaptation(s,'strength');expect(s).toEqual(before)
 expect(p.routines[0].ex[0]).toMatchObject({repsMin:6,repsMax:8,weight:20})
 applyAdaptation(s,p);expect(s.routines[0]).toEqual(before.routines[0]);expect(s.workouts).toEqual(before.workouts);expect(s.week[1][0]).not.toBe('a');expect(s.forgeGoal).toBe(null);expect(s.forgeGoalHistory).toHaveLength(1)
 expect(()=>applyAdaptation(s,p)).toThrow('já foi aplicada')
})
it('rejects stale proposals, changed histories, pain and active sessions',()=>{
 for(const modify of [s=>s.routines[0].ex[0].sets=3,s=>s.workouts.push({id:'new',date:'2026-11-03'})]){const s=base(),p=createAdaptation(s,'strength');modify(s);expect(()=>applyAdaptation(s,p)).toThrow('mudaram')}
 const s=base();s.forgeCheckins[0].pain=true;expect(()=>createAdaptation(s,'strength')).toThrow('dor');s.forgeCheckins[0].pain=false;s.active={};expect(()=>createAdaptation(s,'strength')).toThrow('andamento')
})
it('keeps muscle volume with insufficient observations, and lowers stimulus when recovery is low',()=>{
 const s=base();expect(createAdaptation(s,'muscle').routines[0].ex[0].sets).toBe(2)
 s.forgeCheckins[0].recovery='low';expect(createAdaptation(s,'strength').routines[0].ex[0]).toMatchObject({sets:2,prog:'off',repsMin:8})
 s.forgeCheckins[0].recovery='good';s.forgeCheckins[0].reached=false;expect(()=>createAdaptation(s,'fatloss')).toThrow('andamento')
})
