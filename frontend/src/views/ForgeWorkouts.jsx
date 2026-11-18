import React,{useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {exOr} from '../lib/exercises.js'
import {exerciseNameFor} from '../lib/i18n.js'
import {FORGE_DEMOS} from '../lib/forge-demos.js'
import Media, {Thumb} from '../components/Media.jsx'
import {startFlow} from '../sheets.jsx'
import {nextForgeRoutine} from '../lib/forge-schedule.js'
import {scheduleModeOf} from '../lib/rotation.js'
import {latestPdfRoutineIds,keepPdfRoutines} from '../lib/forge-pdf-plan.js'
import './forge.css'
const DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export default function ForgeWorkouts(){
 const S=useStore(s=>s.S);const [params,setParams]=useSearchParams();const chosen=params.get('routine');
 const routines=S.routines||[];const scheduled=[1,2,3,4,5,6,0].flatMap(day=>[].concat(S.week?.[day]||[]).map(id=>({day,id})));const ids=[...new Set(scheduled.map(x=>x.id))];const list=[...ids.map(id=>routines.find(r=>r.id===id)).filter(Boolean),...routines.filter(r=>!ids.includes(r.id))];
 const next=nextForgeRoutine(S);const selected=list.find(r=>r.id===chosen)||list.find(r=>r.id===next?.r.id)||list[0];const stale=S.active?.start>0&&Date.now()-S.active.start>12*60*60*1000;
 const daysFor=r=>scheduled.filter(x=>x.id===r.id).map(x=>DAYS[x.day]).join(' · ');
 return <main className="forge-page forge-training">
  <div className="forge-eyebrow">FICHA E DEMONSTRAÇÕES</div><header className="forge-title"><div><h1>Meu treino.</h1><p>Escolha a sessão e toque no exercício para ver a execução.</p></div><span className="forge-mark" aria-hidden="true">F<span>↗</span></span></header>
  <div className="forge-tabs"><Link to="/home">Meu dia</Link><Link className="selected" to="/my-training">Treino</Link><Link to="/nutrition">Alimentação</Link></div>
<p><Link className="forge-btn forge-secondary" to="/training/start">Criar ou importar minha ficha →</Link></p>
  {routines.length>1&&<RoutineCleanup S={S} onSaved={ids=>setParams({routine:ids[0]},{replace:true})}/>}
  {S.active&&<aside className="forge-session-notice"><strong>{stale?'Há uma sessão antiga em aberto.':'Você tem um treino em andamento.'}</strong><p>{stale?'Ela foi preservada. Abra a sessão para conferir e finalizar, ou descartá-la pelo menu do treino.':'Retome a sessão antes de iniciar outra.'}</p><Link className="forge-btn forge-secondary" to="/workout">Retomar sessão →</Link></aside>}
  <div className="forge-routine-picker" aria-label="Escolher treino">{list.map((r,i)=><button key={r.id} aria-pressed={selected?.id===r.id} className={selected?.id===r.id?'selected':''} onClick={()=>setParams({routine:r.id},{replace:true})}><small>{daysFor(r)||'SEM DIA DEFINIDO'}</small><strong>{r.name}</strong><span>{r.ex.length} exercícios</span></button>)}</div>
  {selected ? <>
   <section className="forge-workout-top"><div><div className="forge-eyebrow">{daysFor(selected)||'SUA FICHA'}</div><h2>{selected.name}</h2>{selected.focus&&<p>Ênfase planejada: {selected.focus}.</p>}<p>{selected.ex.length} exercícios · Registre suas cargas durante a sessão</p></div>{S.active?<Link className="forge-btn forge-primary" to="/workout">Retomar →</Link>:<button className="forge-btn forge-primary" onClick={()=>{if(!useStore.getState().S.active)startFlow([selected.id])}}>Iniciar treino ▶</button>}</section>
   <p className="forge-notice"><span className="forge-dot"/>Respire continuamente e respeite a amplitude confortável. Os vídeos demonstram o movimento; a prescrição é a da sua ficha.</p>
   <div className="forge-exercises">{selected.ex.map((e,i)=><ForgeExercise key={selected.id+'-'+e.id+'-'+i} e={e} i={i} rid={selected.id} defaultRest={S.restSec}/>)}</div>
   <RoutineSchedule key={selected.id} routine={selected} S={S}/>
   <div className="forge-workout-links"><Link className="forge-btn forge-secondary" to={'/plan/r/'+selected.id}>Editar esta ficha</Link><Link className="forge-btn forge-secondary" to="/training">Objetivo e recuperação ↗</Link></div>
  </> : <section className="forge-card"><h2>Sua próxima ficha</h2><p>Importe sua ficha pronta ou responda ao questionário para criar uma proposta personalizada.</p><Link className="forge-btn forge-primary" to="/training/start">Escolher como criar minha ficha →</Link></section>}
  <aside className="forge-footnote"><h3>Seu treino, sem se perder no catálogo.</h3><p>Aqui ficam todas as suas fichas. Escolha uma e defina os dias para usá-la na agenda. O catálogo completo continua disponível em Explorar, para buscar outros movimentos e montar novas fichas.</p><div className="forge-quick-links"><Link to="/plan">Agenda e todas as fichas ↗</Link><Link to="/library">Explorar exercícios ↗</Link><Link to="/family">Compartilhar aplicativo ↗</Link></div></aside>
 </main>
}

function RoutineCleanup({S,onSaved}){
 const update=useStore(s=>s.update)
 const [open,setOpen]=useState(false),[keep,setKeep]=useState([]),[message,setMessage]=useState('')
 const begin=()=>{setKeep(latestPdfRoutineIds(S));setMessage('');setOpen(true)}
 const apply=()=>{
  try{
   let count
   update(s=>{count=keepPdfRoutines(s,keep)})
   setMessage(count+' fichas anteriores excluídas.')
   setOpen(false)
   onSaved(keep)
  }catch(error){setMessage(error.message)}
 }
 return <section className="forge-card forge-editor">
  {!open?<button className="forge-btn forge-secondary" onClick={begin}>Excluir fichas anteriores</button>:<>
   <h2>Quais fichas deseja manter?</h2>
   <p>Confira os treinos marcados. Ao aplicar, as fichas desmarcadas serão excluídas e retiradas da agenda. O histórico de treinos permanece disponível.</p>
   <fieldset><legend>Fichas para manter</legend>{S.routines.map(r=><label className="forge-check" key={r.id}><input type="checkbox" checked={keep.includes(r.id)} onChange={event=>{const checked=event.target.checked;setKeep(current=>checked?[...current,r.id]:current.filter(id=>id!==r.id))}}/>{r.name} · {r.ex.length} exercícios</label>)}</fieldset>
   <button className="forge-btn forge-primary" disabled={!keep.length} onClick={apply}>Manter apenas as fichas marcadas</button>
   <button className="forge-btn forge-secondary" onClick={()=>setOpen(false)}>Cancelar</button>
  </>}
  {message&&<p role="status">{message}</p>}
 </section>
}

function RoutineSchedule({routine,S}){
 const update=useStore(s=>s.update)
 const [days,setDays]=useState(()=>[0,1,2,3,4,5,6].filter(day=>[].concat(S.week?.[day]||[]).includes(routine.id)))
 const [saved,setSaved]=useState(false)
 if(scheduleModeOf(S)==='rotation')return <p><Link className="forge-btn forge-secondary" to="/plan">Organizar esta ficha no Plano →</Link></p>
 const apply=()=>{
  update(s=>{
   s.week={...s.week}
   for(const day of [0,1,2,3,4,5,6]){
    if(days.includes(day))s.week[day]=[routine.id]
    else{
     const remaining=[].concat(s.week[day]||[]).filter(id=>id!==routine.id)
     if(remaining.length)s.week[day]=remaining
     else delete s.week[day]
    }
   }
  })
  setSaved(true)
 }
 return <section className="forge-card forge-editor" aria-label="Dias desta ficha">
  <h2>Dias desta ficha</h2>
  <p>Escolha quando usar {routine.name}. Ao salvar, esta ficha passa a ser o treino dos dias marcados.</p>
  <fieldset><legend>Dias da semana</legend>{[1,2,3,4,5,6,0].map(day=><label className="forge-check" key={day}><input type="checkbox" checked={days.includes(day)} onChange={event=>{setSaved(false);setDays(current=>event.target.checked?[...current,day]:current.filter(d=>d!==day))}}/>{['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'][day]}</label>)}</fieldset>
  <button className="forge-btn forge-primary" onClick={apply}>Salvar dias desta ficha</button>
  {saved&&<p role="status">Dias salvos para {routine.name}.</p>}
 </section>
}

function ForgeExercise({e,i,rid,defaultRest}){
 const [open,setOpen]=useState(false);const ex=exOr(e.id),meta=FORGE_DEMOS[e.id],planned=e.builder?.id===e.id?e.builder:null;const reps=e.pyramid?.length?e.pyramid.join(' / '):e.repsMin&&e.repsMax?(e.repsMin===e.repsMax?e.repsMin:e.repsMin+'–'+e.repsMax):e.reps||'—';
 return <details className="forge-exercise" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary><span className="forge-ex-number">{String(i+1).padStart(2,'0')}</span><Thumb ex={ex}/><span className="forge-ex-body"><strong>{planned?.label||meta?.name||exerciseNameFor(ex)}</strong><small>{planned?'Principal: '+planned.group:meta?.variant||'Consulte a execução'}</small><span className="forge-prescription"><b>{e.mode==='cardio'?e.min+' min de atividade':e.mode==='time'?<>{e.sets} séries × {e.sec} s</>:<>{e.sets} séries × {reps}{e.side?' / lado':''}</>}</b>{e.mode!=='cardio'&&<span>{e.restSec??defaultRest??90}s de descanso</span>}</span></span><span className="forge-expand" aria-hidden="true">＋</span></summary>
  {open&&<div className="forge-exercise-inside"><Media ex={ex}/>{e.note&&<p className="forge-ex-note"><strong>Na sua ficha</strong>{e.note}</p>}<Link className="forge-text-btn" to={'/plan/r/'+rid}>Ajustar prescrição →</Link></div>}
 </details>
}
