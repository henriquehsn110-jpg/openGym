import React,{useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {TEMPLATE} from '../lib/forge-meals.js'
import {ensureForgeMeals,activateForgePlan} from '../lib/forge-profile.js'
import './forge.css'
export default function ForgeHome(){
 const S=useStore(s=>s.S),update=useStore(s=>s.update);const [message,setMessage]=useState('')
 useEffect(()=>{if(!Array.isArray(S.forgeNutrition))update(ensureForgeMeals)},[S.forgeNutrition,update])
 const now=new Date(),day=now.getDay();let next=null
 for(let i=0;i<7&&!next;i++){const d=(day+i)%7;const ids=[].concat(S.week?.[d]||[]);const r=(S.routines||[]).find(r=>ids.includes(r.id));if(r)next={r,d,offset:i}}
 const days=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];const meals=S.forgeNutrition||TEMPLATE;const hr=now.getHours();const index=hr<9?0:hr<12?1:hr<15?2:hr<17?3:hr<19?4:5;const meal=meals[Math.min(index,meals.length-1)]
 const loaded=S.forgeTitanLoaded||(S.routines||[]).some(r=>r.name==='Superiores A');
 return <main className="forge-page"><div className="forge-eyebrow">{now.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}</div><header className="forge-title"><div><h1>Seu ritmo.<br/><span>Seu próximo passo.</span></h1><p>Treino e alimentação no mesmo lugar, sem complicar.</p></div><span className="forge-mark">F<span>↗</span></span></header>
 <div className="forge-tabs"><Link className="selected" to="/home">Meu dia</Link><Link to="/plan">Treino</Link><Link to="/nutrition">Alimentação</Link></div>
 <section className="forge-hero"><div className="forge-hero-label"><span className="forge-dot"/>{S.active?'TREINO EM ANDAMENTO':next?(next.offset===0?'NA SUA AGENDA HOJE':'PRÓXIMA SESSÃO'):'SUA RETOMADA COMEÇA AQUI'}</div><h2>{S.active?'Vamos continuar?':next?next.r.name:<>Quatro dias.<br/>Uma nova rotina.</>}</h2><p>{next?days[next.d]+' · '+next.r.ex.length+' exercícios · Consulte as séries na ficha':'Segunda, terça, quinta e sexta. Duas séries por exercício na primeira quinzena.'}</p><div className="forge-hero-actions"><Link className="forge-btn forge-primary" to={S.active?'/workout':next?.offset===0?'/tracker':'/plan'}>{S.active?'Continuar treino':next?.offset===0?'Abrir treino':next?'Ver próxima ficha':'Ver meus treinos'} <span>↗</span></Link>{!loaded&&<button className="forge-btn forge-outline" onClick={()=>{update(activateForgePlan);setMessage('Ficha adicionada. Se já havia treinos, sua agenda foi preservada.')}}>Ativar ficha de 4 dias</button>}</div>{message&&<p role="status">{message}</p>}</section>
 <section className="forge-week" aria-label="Sua semana">{[1,2,3,4,5,6,0].map(i=>{const name=days[i];const ids=[].concat(S.week?.[i]||[]);const on=ids.length>0;return <div key={i} className={(i===day?'today ':'')+(on?'on':'')}><span>{name}</span><b>{on?'●':'—'}</b><small>{on?'Treino':'Livre'}</small></div>})}</section>
 <div className="forge-card-grid"><Link to="/nutrition" className="forge-card"><div className="forge-card-top"><span>À MESA</span><span>↗</span></div><h2>{meal?.title||'Seu cardápio'}</h2><p>{meal?.text||'Adicione suas refeições na área de alimentação.'}</p><strong>Ver alimentação →</strong></Link><section className="forge-card forge-dark-card"><div className="forge-card-top"><span>LEMBRETE DE TREINO</span><span>✦</span></div><h2>Termine com<br/>algo na reserva.</h2><p>Comece com duas séries e cerca de três repetições ainda possíveis. Anote suas cargas e progrida com controle.</p><Link to="/plan">Consultar minha ficha →</Link></section></div>
 <aside className="forge-footnote"><h3>Um dia de cada vez.</h3><p>Seu modelo alimentar já está disponível. A ficha de treino pode ser ativada sem baixar arquivos. Se você já tem rotinas, elas serão preservadas.</p><div className="forge-quick-links"><Link to="/stats">Evolução ↗</Link><Link to="/history">Histórico ↗</Link><Link to="/settings">Backup e ajustes ↗</Link></div></aside></main>
}
