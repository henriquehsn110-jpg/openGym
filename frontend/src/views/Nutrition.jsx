import React,{useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {TEMPLATE} from '../lib/forge-meals.js'
import {ensureForgeMeals} from '../lib/forge-profile.js'
import './forge.css'
export default function Nutrition(){
 const saved=useStore(s=>s.S.forgeNutrition);const update=useStore(s=>s.update);const [editing,setEditing]=useState(null);const plan=Array.isArray(saved)?saved:TEMPLATE
 useEffect(()=>{if(!Array.isArray(saved))update(ensureForgeMeals)},[saved,update])
 const save=next=>update(s=>{s.forgeNutrition=next})
 const edit=(i,key,value)=>save(plan.map((row,j)=>i===j?{...row,[key]:value}:row))
 return <main className="forge-page"><div className="forge-eyebrow">ROTINA QUE CABE NO SEU DIA</div><header className="forge-title"><div><h1>Comer bem.<br/><span>Seguir em frente.</span></h1><p>Seu cardápio em medidas caseiras, pronto para consultar.</p></div><span className="forge-tag">PLANO FLEXÍVEL</span></header>
 <div className="forge-tabs"><Link to="/home">Meu dia</Link><Link to="/plan">Treino</Link><Link className="selected" to="/nutrition">Alimentação</Link></div>
 <div className="forge-notice"><span className="forge-dot"/>Salvo neste navegador · Ajuste as porções pela sua evolução.</div>
 <div className="forge-meals">{plan.map((row,i)=><article className="forge-meal" key={i}><div className="forge-meal-number">{String(i+1).padStart(2,'0')}</div><div className="forge-meal-body"><header><h2>{row.title}</h2><button aria-label={'Editar '+row.title} className="forge-text-btn" onClick={()=>setEditing(editing===i?null:i)}>{editing===i?'Concluir':'Editar'}</button></header>{editing===i?<div className="forge-editor"><label>Horário / refeição<input value={row.title} onChange={e=>edit(i,'title',e.target.value)}/></label><label>Alimentos e porções<textarea value={row.text} onChange={e=>edit(i,'text',e.target.value)}/></label><button className="forge-text-btn" onClick={()=>{save(plan.filter((_,j)=>j!==i));setEditing(null)}}>Remover esta refeição</button></div>:<p>{row.text}</p>}</div></article>)}</div>
 <button className="forge-btn forge-secondary" onClick={()=>{save([...plan,{title:'Nova refeição',text:''}]);setEditing(plan.length)}}>+ Adicionar refeição</button>
 <aside className="forge-footnote"><h3>Constância antes de perfeição</h3><p>O modelo é um ponto de partida. Observe fome, disposição no treino e evolução por duas semanas. Faça um backup nas configurações antes de trocar de aparelho ou limpar o navegador.</p><Link to="/settings">Abrir configurações →</Link></aside></main>
}
