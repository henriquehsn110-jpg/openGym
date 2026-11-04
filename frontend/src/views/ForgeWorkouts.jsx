import React,{useEffect,useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {exOr} from '../lib/exercises.js'
import {exerciseNameFor} from '../lib/i18n.js'
import {FORGE_DEMOS} from '../lib/forge-demos.js'
import {activateForgePlan} from '../lib/forge-profile.js'
import {Thumb} from '../components/Media.jsx'
import YouTubeDemo from '../components/YouTubeDemo.jsx'
import {startFlow} from '../sheets.jsx'
import {nextForgeRoutine} from '../lib/forge-schedule.js'
import './forge.css'
const DAYS=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
export default function ForgeWorkouts(){
 const S=useStore(s=>s.S),update=useStore(s=>s.update);const [params,setParams]=useSearchParams();const chosen=params.get('routine');
 useEffect(()=>{if(!S.routines?.length&&!S.forgeTitanLoaded)update(activateForgePlan)},[S.routines?.length,S.forgeTitanLoaded,update]);
 const routines=S.routines||[];const scheduled=[1,2,3,4,5,6,0].flatMap(day=>[].concat(S.week?.[day]||[]).map(id=>({day,id})));const ids=[...new Set(scheduled.map(x=>x.id))];const list=ids.length?ids.map(id=>routines.find(r=>r.id===id)).filter(Boolean):routines;
 const next=nextForgeRoutine(S);const selected=list.find(r=>r.id===chosen)||list.find(r=>r.id===next?.r.id)||list[0];const stale=S.active?.start>0&&Date.now()-S.active.start>12*60*60*1000;
 const daysFor=r=>scheduled.filter(x=>x.id===r.id).map(x=>DAYS[x.day]).join(' · ');
 return <main className="forge-page forge-training">
  <div className="forge-eyebrow">FICHA E DEMONSTRAÇÕES</div><header className="forge-title"><div><h1>Meu treino.</h1><p>Escolha a sessão e toque no exercício para ver a execução.</p></div><span className="forge-mark" aria-hidden="true">F<span>↗</span></span></header>
  <div className="forge-tabs"><Link to="/home">Meu dia</Link><Link className="selected" to="/my-training">Treino</Link><Link to="/nutrition">Alimentação</Link></div>
  {S.active&&<aside className="forge-session-notice"><strong>{stale?'Há uma sessão antiga em aberto.':'Você tem um treino em andamento.'}</strong><p>{stale?'Ela foi preservada. Abra a sessão para conferir e finalizar, ou descartá-la pelo menu do treino.':'Retome a sessão antes de iniciar outra.'}</p><Link className="forge-btn forge-secondary" to="/workout">Retomar sessão →</Link></aside>}
  <div className="forge-routine-picker" aria-label="Escolher treino">{list.map((r,i)=><button key={r.id} aria-pressed={selected?.id===r.id} className={selected?.id===r.id?'selected':''} onClick={()=>setParams({routine:r.id},{replace:true})}><small>{daysFor(r)||'ROTINA '+(i+1)}</small><strong>{r.name}</strong><span>{r.ex.length} exercícios</span></button>)}</div>
  {selected ? <>
   <section className="forge-workout-top"><div><div className="forge-eyebrow">{daysFor(selected)||'SUA FICHA'}</div><h2>{selected.name}</h2><p>{selected.ex.length} exercícios · Registre suas cargas durante a sessão</p></div>{S.active?<Link className="forge-btn forge-primary" to="/workout">Retomar →</Link>:<button className="forge-btn forge-primary" onClick={()=>{if(!useStore.getState().S.active)startFlow([selected.id])}}>Iniciar treino ▶</button>}</section>
   <p className="forge-notice"><span className="forge-dot"/>Respire continuamente e respeite a amplitude confortável. Os vídeos demonstram o movimento; a prescrição é a da sua ficha.</p>
   <div className="forge-exercises">{selected.ex.map((e,i)=><ForgeExercise key={selected.id+'-'+e.id+'-'+i} e={e} i={i} rid={selected.id} defaultRest={S.restSec}/>)}</div>
   <div className="forge-workout-links"><Link className="forge-btn forge-secondary" to={'/plan/r/'+selected.id}>Editar esta ficha</Link><Link className="forge-btn forge-secondary" to="/training">Objetivo e recuperação ↗</Link></div>
  </> : <section className="forge-card"><h2>Sua próxima ficha</h2><p>Não há rotinas na sua agenda. Organize suas sessões ou crie uma ficha com seus exercícios.</p><Link className="forge-btn forge-primary" to="/plan">Organizar meus treinos →</Link></section>}
  <aside className="forge-footnote"><h3>Seu treino, sem se perder no catálogo.</h3><p>Aqui ficam as sessões da sua agenda. O catálogo completo continua disponível em Explorar, para buscar outros movimentos e montar novas fichas.</p><div className="forge-quick-links"><Link to="/plan">Agenda e todas as fichas ↗</Link><Link to="/library">Explorar exercícios ↗</Link><Link to="/family">Compartilhar aplicativo ↗</Link></div></aside>
 </main>
}

function ForgeExercise({e,i,rid,defaultRest}){
 const [open,setOpen]=useState(false);const ex=exOr(e.id),meta=FORGE_DEMOS[e.id];const reps=e.repsMin&&e.repsMax?e.repsMin+'–'+e.repsMax:e.reps||'—';
 return <details className="forge-exercise" onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary><span className="forge-ex-number">{String(i+1).padStart(2,'0')}</span><Thumb ex={ex}/><span className="forge-ex-body"><strong>{meta?.name||exerciseNameFor(ex)}</strong><small>{meta?.variant||'Consulte a execução'}</small><span className="forge-prescription"><b>{e.sets} séries × {reps}{e.side?' / lado':''}</b><span>{e.restSec||defaultRest||90}s de descanso</span></span></span><span className="forge-expand" aria-hidden="true">＋</span></summary>
  {open&&<div className="forge-exercise-inside"><YouTubeDemo ex={ex}/>{e.note&&<p className="forge-ex-note"><strong>Na sua ficha</strong>{e.note}</p>}<Link className="forge-text-btn" to={'/plan/r/'+rid}>Ajustar prescrição →</Link></div>}
 </details>
}
