import React,{useEffect,useState} from 'react'
import {Link} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {ensureForgeMeals,startEmptyNutrition,restorePreviousNutrition,NUTRITION_VERSION} from '../lib/forge-profile.js'
import './forge.css'
export default function Nutrition(){
 const saved=useStore(s=>s.S.forgeNutrition),version=useStore(s=>s.S.forgeNutritionVersion),update=useStore(s=>s.update)
 const previous=useStore(s=>s.S.forgeNutritionPrevious)
 const [editing,setEditing]=useState(null);const plan=Array.isArray(saved)?saved:[]
 useEffect(()=>{if(!Array.isArray(saved)||version!==NUTRITION_VERSION)update(ensureForgeMeals)},[saved,version,update])
 const save=next=>update(s=>{s.forgeNutrition=next})
 const edit=(i,key,value)=>save(plan.map((row,j)=>i===j?{...row,[key]:value}:row))
 const editOption=(i,n,key,value)=>edit(i,'options',(plan[i].options||[]).map((x,j)=>j===n?{...x,[key]:value}:x))
 return <main className="forge-page"><div className="forge-eyebrow">VARIEDADE PARA MANTER A ROTINA</div><header className="forge-title"><div><h1>Seu prato.<br/><span>Suas escolhas.</span></h1><p>Organize suas próprias refeições, horários e observações neste aparelho.</p></div><span className="forge-tag">SEU PLANO</span></header>
 <div className="forge-tabs"><Link to="/home">Meu dia</Link><Link to="/my-training">Treino</Link><Link className="selected" to="/nutrition">Alimentação</Link></div>
 <div className="forge-notice"><span className="forge-dot"/>Os novos perfis começam sem cardápio. Cadastre suas refeições ou registre o plano orientado para você.</div>
 {!plan.length&&<section className="forge-card"><h2>Sua alimentação começa aqui.</h2><p>Nenhuma refeição cadastrada. O aplicativo não preenche o cardápio de outra pessoa.</p></section>}
 {plan.length>0&&<section className="forge-card"><h2>Quer começar outro plano alimentar?</h2><p>Se este aparelho recebeu o cardápio da versão anterior, comece uma alimentação vazia. A última alimentação deste navegador ficará disponível para restaurar.</p><button className="forge-btn forge-secondary" onClick={()=>{update(startEmptyNutrition);setEditing(null)}}>Começar alimentação vazia</button></section>}
 {Array.isArray(previous)&&previous.length>0&&<button className="forge-btn forge-secondary" onClick={()=>{update(restorePreviousNutrition);setEditing(null)}}>Restaurar alimentação anterior</button>}
 <div className="forge-meals">{plan.map((row,i)=><article className="forge-meal" key={row.id||i}><div className="forge-meal-number">{String(i+1).padStart(2,'0')}</div><div className="forge-meal-body"><header><h2>{row.title}</h2><button aria-label={'Editar '+row.title} className="forge-text-btn" onClick={()=>setEditing(editing===i?null:i)}>{editing===i?'Concluir':'Editar'}</button></header>{editing===i?<div className="forge-editor"><label>Horário / refeição<input value={row.title} onChange={e=>edit(i,'title',e.target.value)}/></label><label>Observações e porções<textarea value={row.text||''} onChange={e=>edit(i,'text',e.target.value)}/></label>{(row.options||[]).map((option,n)=><fieldset key={n}><legend>Opção {n+1}</legend><label>Nome<input value={option.name} onChange={e=>editOption(i,n,'name',e.target.value)}/></label><label>Alimentos e porções<textarea value={option.text} onChange={e=>editOption(i,n,'text',e.target.value)}/></label><button className="forge-text-btn" onClick={()=>edit(i,'options',row.options.filter((_,j)=>j!==n))}>Remover opção {n+1}</button></fieldset>)}<button className="forge-text-btn" onClick={()=>edit(i,'options',[...(row.options||[]),{name:'Nova opção',text:''}])}>+ Adicionar opção</button><br/><button className="forge-text-btn" onClick={()=>{save(plan.filter((_,j)=>j!==i));setEditing(null)}}>Remover esta refeição</button></div>:<><p>{row.text}</p>{row.options?.length>0&&<ol className="forge-options">{row.options.map((option,n)=><li key={n}><h3>{option.name}</h3><p>{option.text}</p></li>)}</ol>}</>}</div></article>)}</div>
 <button className="forge-btn forge-secondary" onClick={()=>{save([...plan,{title:'Nova refeição',text:'',options:[]}]);setEditing(plan.length)}}>+ Adicionar refeição</button>
 <aside className="forge-footnote"><h3>Seus registros ficam neste navegador</h3><p>Use este espaço para organizar seu próprio plano alimentar. Alterações feitas aqui ficam neste aparelho e não são incluídas no link de compartilhamento. Faça backup antes de trocar de aparelho.</p><Link to="/settings">Backup e configurações →</Link></aside></main>
}
