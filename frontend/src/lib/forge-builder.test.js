import {describe,it,expect} from 'vitest'
import {generateProgram,applyGeneratedProgram,BUILDER_GOALS} from './forge-builder.js'
import {EXIDX} from './exercises.js'
const base={adult:true,screen:'none',goal:'general',experience:'new',minutes:45,days:[1,3,5],equipment:['dumbbell'],exclude:[]}
describe('complete personal programs',()=>{
 it('covers all supported goals, experience levels, session times and equipment combinations',()=>{
  for(const goal of Object.keys(BUILDER_GOALS))for(const experience of ['new','returning','regular'])for(const minutes of [30,45,60])for(const days of [[1],[1,4],[1,3,5],[1,2,4,5],[1,2,3,4,5],[1,2,3,4,5,6],[0,1,2,3,4,5,6]])for(const equipment of [['dumbbell'],['band'],['cable'],['dumbbell','bench','cable','machines']]){
   const p=generateProgram({...base,goal,experience,minutes,days,equipment})
   expect(p.routines).toHaveLength(days.length)
   for(const r of p.routines){expect(r.estimatedMinutes).toBeLessThanOrEqual(minutes);expect(new Set(r.ex.map(e=>e.id)).size).toBe(r.ex.length)
    for(const e of r.ex){expect(EXIDX[e.id]).toBeTruthy();expect(e.sets).toBeGreaterThanOrEqual(1);expect(e.weight).toBeUndefined();expect(e.prog).toBe('off');if(e.mode==='cardio'){expect(e.min).toBeGreaterThan(0);expect(r.recovery).toBe(true)}else expect(e.repsMax).toBeGreaterThanOrEqual(e.repsMin);expect(e.builder.requires.every(x=>equipment.includes(x))).toBe(true)}
   }
   for(const group of ['Peito','Costas','Quadríceps','Posterior de coxa / glúteos'])expect(p.routines.filter(r=>r.ex.some(e=>e.builder.group===group)).length).toBeGreaterThanOrEqual(Math.min(2,p.strengthCount))
  }
 })
 it('rejects missing screening, minors, restrictions, unsupported schedules and equipment',()=>{
  for(const patch of [{adult:false},{screen:''},{screen:'review'},{days:[]},{days:[1,1]},{days:[1,2,3,4,5,6,0,7]},{minutes:15},{equipment:[]},{equipment:['machines']},{equipment:['x']},{exclude:['bad']},{experience:'bad'},{goal:'bad'}])expect(()=>generateProgram({...base,...patch})).toThrow()
 })
 it('honours exclusions or fails explicitly instead of inserting unavailable exercises',()=>{
  const p=generateProgram({...base,exclude:['squat']});expect(p.routines.flatMap(r=>r.ex).every(e=>e.builder.key!=='squat')).toBe(true)
  expect(()=>generateProgram({...base,exclude:['row','bandrow','cablerow']})).toThrow(/alternativa/)
 })
 it('applies without replacing current agenda, goals, loads or history by default; cannot double apply',()=>{
  const s={routines:[{id:'old',ex:[{id:'0289',weight:42}]}],week:{1:['old']},workouts:[{id:'logged',weight:41}],forgeGoal:{focus:'fatloss'},forgeYouTube:{'0289':'saved'}}
  const original=structuredClone(s),p=generateProgram(base);applyGeneratedProgram(s,p)
  expect(s.week).toEqual(original.week);expect(s.workouts).toEqual(original.workouts);expect(s.routines[0]).toEqual(original.routines[0]);expect(s.forgeGoal).toEqual(original.forgeGoal);expect(s.forgeYouTube).toEqual(original.forgeYouTube)
  expect(()=>applyGeneratedProgram(s,p)).toThrow(/já foi/)
 })
 it('revalidates eligibility at application and blocks active sessions and rotation replacement',()=>{
  const p=generateProgram(base);expect(()=>applyGeneratedProgram({active:{}},p)).toThrow(/sessão/)
  expect(()=>applyGeneratedProgram({scheduleMode:'rotation'},p,true)).toThrow(/rotação/)
  p.intake.screen='review';expect(()=>applyGeneratedProgram({},p)).toThrow(/avaliação/)
 })
 it('schedules only with explicit choice and preserves old routines and scheduling backup',()=>{
  const p=generateProgram({...base,days:[1,4]});const s={routines:[{id:'old'}],week:{3:['old']},dayPlan:{'2099-01-01':'old'},workouts:[{id:'keep'}]};applyGeneratedProgram(s,p,true)
  expect(Object.keys(s.week)).toEqual(['1','4']);expect(s.forgeScheduleBackups[0].week).toEqual({3:['old']});expect(s.forgeScheduleBackups[0].dayPlan).toEqual({'2099-01-01':'old'});expect(s.dayPlan).toEqual({});expect(s.routines[0].id).toBe('old');expect(s.workouts).toEqual([{id:'keep'}])
 })
})

it('accepts every nonempty weekday combination and avoids adjacent sessions on the same region',()=>{
 for(const experience of ['new','regular'])for(let mask=1;mask<128;mask++){
  const days=[0,1,2,3,4,5,6].filter(d=>mask&(1<<d));const p=generateProgram({...base,days,experience});expect(p.days).toHaveLength(days.length);expect(p.strengthCount+p.recoveryCount).toBe(days.length)
  const groups=p.routines.map(r=>new Set(r.ex.filter(e=>e.mode!=='cardio').map(e=>e.builder.group)));
  for(let i=0;i<p.days.length;i++){const j=p.days.indexOf((p.days[i]+1)%7);if(j>=0)expect([...groups[i]].filter(g=>groups[j].has(g))).toEqual([])}
  if(experience==='new'&&days.length>=4)expect(p.strengthCount).toBeLessThanOrEqual(3)
 }
})
it('does not count walking as strength volume and schedules all seven days when asked',()=>{
 const p=generateProgram({...base,experience:'regular',days:[0,1,2,3,4,5,6]});expect(p.strengthCount).toBe(6);expect(p.recoveryCount).toBe(1);expect(p.volume['Recuperação ativa']).toBeUndefined();const s={};applyGeneratedProgram(s,p,true);expect(Object.keys(s.week)).toHaveLength(7);expect(s.routines.some(r=>r.ex.some(e=>e.mode==='cardio'&&e.min>0))).toBe(true)
})
