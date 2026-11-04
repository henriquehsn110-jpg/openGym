import {uid} from './format.js'
export const GOALS={restart:'Retomar com constância',fatloss:'Reduzir gordura',strength:'Ganhar força',muscle:'Ganhar massa muscular'}
export function scheduledRoutines(s){const ids=new Set(Object.values(s.week||{}).flatMap(x=>[].concat(x)));return (s.routines||[]).filter(r=>ids.has(r.id))}
export function adaptationFingerprint(s){return JSON.stringify([scheduledRoutines(s),s.week,s.forgeGoal,s.forgeCheckins,s.scheduleMode,s.rotation,s.queue,s.workouts])}
const goalWorkouts=s=>(s.workouts||[]).filter(w=>String(w.date||w.d||'')>=s.forgeGoal.since.slice(0,10))
export function goalStatus(s){
 const goal=s.forgeGoal;if(!goal)return {label:'Defina um objetivo',reached:false}
 if(goal.metric==='sessions'){const count=goalWorkouts(s).length;return {reached:count>=goal.target,value:count,label:`${count} de ${goal.target} treinos registrados`}}
 const values=(s.forgeCheckins||[]).filter(x=>x.goalId===goal.id).map(x=>Number(x.value)).filter(x=>Number.isFinite(x)&&x>0).slice(-3)
 if(values.length<3)return {reached:false,label:'Registre pelo menos 3 avaliações deste objetivo para comparar a tendência.'}
 const value=values.reduce((a,b)=>a+b,0)/values.length
 return {reached:goal.direction==='up'?value>=goal.target:value<=goal.target,value,label:`Média das 3 últimas avaliações: ${value.toFixed(1)} ${goal.metric==='waist'?'cm':goal.metric==='load'?(s.unit||'kg'):'kg'} · meta ${goal.target}`}
}
export function createAdaptation(s,nextGoal){
 if(!GOALS[nextGoal])throw new Error('Selecione o foco da próxima etapa.')
 if(s.active)throw new Error('Finalize o treino em andamento antes de preparar uma nova etapa.')
 if(s.scheduleMode==='rotation'||s.queue)throw new Error('Esta revisão usa a agenda semanal fixa. Ajuste sua rotação no Plano antes de gerar uma etapa.')
 const routines=scheduledRoutines(s)
 if(!routines.length)throw new Error('Ative ou agende sua ficha no Plano primeiro.')
 const last=(s.forgeCheckins||[]).filter(x=>x.goalId===s.forgeGoal?.id).at(-1)
 if(!s.forgeGoal||!last)throw new Error('Salve o objetivo e uma avaliação de recuperação antes de preparar a próxima etapa.')
 if(last.pain)throw new Error('Você relatou dor que limita o treino. Procure avaliação profissional antes de aplicar mudanças automáticas na ficha.')
 const low=last.recovery==='low',reason=low?'Recuperação baixa: proposta de uma semana mais leve, seguida de nova avaliação.':`Novo foco escolhido: ${GOALS[nextGoal]}. Mantemos os exercícios conhecidos e adaptamos a organização do esforço.`
 const observed=goalWorkouts(s).length,changes=[]
 const achieved=goalStatus(s).reached||last.reached===true
 if(!low&&!achieved&&nextGoal===s.forgeGoal.focus)throw new Error('O objetivo ainda está em andamento. Mantenha a ficha e registre sua evolução; você também pode escolher um novo foco se sua prioridade mudou.')
 const next=routines.map(r=>({...structuredClone(r),ex:r.ex.map((e,i)=>{
  const cfg={...structuredClone(e)}
  if((e.mode&&e.mode!=='reps')||e.pyramid?.length||e.id==='0276')return cfg
  if(low){cfg.sets=Math.max(1,Math.min(2,e.sets||2));cfg.note='Semana de recuperação: escolha carga confortável e termine com 4 ou mais repetições possíveis. Reavalie em uma semana.';cfg.prog='off'}
  else{
   if(nextGoal==='strength'&&i===0){cfg.repsMin=6;cfg.repsMax=8;cfg.reps=6;cfg.restSec=Math.max(150,e.restSec||90)}
   if(nextGoal==='muscle'&&observed>=8){cfg.sets=(e.sets||2)<3?Math.min(3,(e.sets||2)+1):e.sets}
   cfg.note=`${GOALS[nextGoal]}. Escolha carga que permita execução controlada e cerca de 2–3 repetições ainda possíveis. Ajuste ao seu desempenho; sem troca obrigatória de exercício.`
  }
  if(JSON.stringify(cfg)!==JSON.stringify(e))changes.push({routine:r.name,id:e.id,before:{sets:e.sets,repsMin:e.repsMin||e.reps,repsMax:e.repsMax||e.reps,restSec:e.restSec},after:{sets:cfg.sets,repsMin:cfg.repsMin||cfg.reps,repsMax:cfg.repsMax||cfg.reps,restSec:cfg.restSec}})
  return cfg
 })}))
 return {achieved,id:uid(),createdAt:new Date().toISOString(),fingerprint:adaptationFingerprint(s),goal:nextGoal,reason,low,observed,changes,routines:next,applied:false}
}
export function applyAdaptation(s,p){
 if(!p||p.applied||s.forgeStages?.some(x=>x.id===p.id))throw new Error('Esta etapa já foi aplicada ou não está disponível.')
 if(s.active)throw new Error('Finalize o treino em andamento antes de aplicar a proposta.')
 if(p.fingerprint!==adaptationFingerprint(s))throw new Error('Seus dados ou sua ficha mudaram. Gere uma proposta atualizada antes de aplicar.')
 const map=new Map(),stage=(s.forgeStages||[]).length+1
 const added=p.routines.map(r=>{const id=uid();map.set(r.id,id);return {...structuredClone(r),id,name:`${r.name.replace(/ · Etapa \d+$/,'')} · Etapa ${stage}`,forgeStage:p.id}})
 s.routines.push(...added)
 for(const day of Object.keys(s.week||{}))s.week[day]=[].concat(s.week[day]).map(id=>map.get(id)||id)
 s.forgeStages=[...(s.forgeStages||[]),{id:p.id,at:new Date().toISOString(),goal:p.goal,reason:p.reason,previousIds:p.routines.map(x=>x.id),routineIds:added.map(x=>x.id)}]
 s.forgeGoalHistory=[...(s.forgeGoalHistory||[]),{...structuredClone(s.forgeGoal),endedAt:new Date().toISOString()}];s.forgeGoal=null
 s.forgeProposal={...p,applied:true};s.forgeNextGoal=p.goal
 return true
}
