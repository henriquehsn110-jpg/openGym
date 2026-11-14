import React,{useEffect,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import {useStore} from '../store/useStore.js'
import {parseTrainingText,exerciseSuggestions,newImportRow,applyPdfPlan,catalogExerciseName,validateImportedRow} from '../lib/forge-pdf-plan.js'
import './forge.css'
export default function ForgePdfImport(){
 const update=useStore(s=>s.update),active=useStore(s=>!!s.S.active)
 const [file,setFile]=useState(null),[ocr,setOcr]=useState(false),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState(''),[text,setText]=useState(''),[draft,setDraft]=useState(null),[saved,setSaved]=useState(false)
 const abort=useRef(null);useEffect(()=>()=>abort.current?.abort(),[])
 const parse=source=>{try{const p=parseTrainingText(source);setDraft(p);setSaved(false);setError(p.routines.length?'':'Nenhum exercício reconhecido. Confira o texto ou adicione um treino e os exercícios manualmente.')}catch(e){setError(e.message)}}
 const read=async()=>{if(!file){setError('Selecione um PDF.');return}setBusy(true);setError('');setDraft(null);setText('');setSaved(false);abort.current=new AbortController();try{const {readTrainingPdf}=await import('../lib/forge-pdf-read.js');const value=await readTrainingPdf(file,{ocr,signal:abort.current.signal,onProgress:setStatus});setText(value);parse(value)}catch(e){setError(e.message)}finally{setBusy(false);setStatus('')}}
 const edit=(ri,ei,key,value)=>{setSaved(false);setDraft(d=>({...d,routines:d.routines.map((r,i)=>i!==ri?r:{...r,ex:r.ex.map((e,j)=>j!==ei?e:{...e,[key]:value,...(key==='reviewed'?{}:{reviewed:false})})})}))}
 const changeRoutine=(ri,name)=>setDraft(d=>({...d,routines:d.routines.map((r,i)=>i===ri?{...r,name}:r)}))
 const addRoutine=()=>{setSaved(false);setDraft(d=>({ignored:d?.ignored||[],routines:[...(d?.routines||[]),{key:Date.now()+'',name:'Novo treino',ex:[newImportRow()]}]}))}
 const [useCustomForUnmatched,setUseCustomForUnmatched]=useState(false)
 const reviewAll=()=>{
  setError('')
  setDraft(current=>({...current,routines:current.routines.map(routine=>({...routine,ex:routine.ex.map(row=>{
   const candidate={...row,reviewed:true,custom:row.custom||(useCustomForUnmatched&&!row.exerciseId)}
   try{validateImportedRow(candidate);return candidate}catch{return {...row,reviewed:false}}
  })}))}))
 }
 const pending=draft?.routines.reduce((count,routine)=>count+routine.ex.filter(row=>!row.reviewed).length,0)??0
 const save=()=>{try{update(s=>applyPdfPlan(s,draft));setSaved(true);setError('')}catch(e){setError(e.message)}}
 return <main className="forge-page"><div className="forge-eyebrow">APROVEITE SUA FICHA PRONTA</div><header className="forge-title"><div><h1>Do PDF<br/><span>para seu treino.</span></h1><p>Confira cada exercício e os números antes de importar. A prescrição original fica nas observações.</p></div></header><div className="forge-tabs"><Link to="/training/start">Escolher outra opção</Link><Link to="/training/new">Gerar pelo questionário</Link></div>
 <section className="forge-card forge-editor"><h2>1. Ler minha ficha</h2><p>O arquivo é processado no aparelho e não é enviado a um servidor. Até 10 MB e 20 páginas de texto; com reconhecimento de imagens, até 8 páginas.</p><label>Arquivo PDF<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e=>{setFile(e.target.files?.[0]||null);setText('');setDraft(null);setSaved(false);setError('')}}/></label><label className="forge-check"><input type="checkbox" checked={ocr} disabled={busy} onChange={e=>setOcr(e.target.checked)}/>PDF digitalizado: usar reconhecimento de texto (OCR)</label><p>OCR pode demorar no celular e confundir letras e números. A primeira utilização carrega os recursos de leitura do próprio FORGE.</p><button className="forge-btn forge-primary" disabled={busy||!file} onClick={read}>Ler PDF e preparar revisão</button>{busy&&<button className="forge-btn forge-secondary" onClick={()=>abort.current?.abort()}>Cancelar leitura</button>}<p role="status" aria-live="polite">{status}</p>
 <details><summary style={{padding:'14px 0',cursor:'pointer'}}>Conferir ou colar o texto da ficha</summary><label>Texto extraído do PDF<textarea maxLength={150000} value={text} onChange={e=>{setText(e.target.value);setDraft(null);setSaved(false)}} placeholder={'Treino A\nSupino reto com halteres 3x8-12 descanso 90s\nAgachamento goblet 3x10'}/></label><p>Tabelas podem usar | entre colunas. Ex.: Exercício | Séries | Repetições | Descanso (s). Preserve observações como bi-set, drop-set e carga por halter para revisar.</p><button className="forge-btn forge-secondary" disabled={busy||!text.trim()} onClick={()=>parse(text)}>Preparar revisão do texto</button></details>
 </section>
 {error&&(!draft||busy)&&<p className="forge-notice" role="alert">{error}</p>}
 {draft&&<section aria-label="Revisão da ficha importada"><h2>2. Revisar os treinos</h2><p>Correspondências sugeridas não alteram o PDF. Confirme variação, equipamento, séries, repetições, descanso e se a carga é total ou por halter. Dados ausentes ficam em branco. Métodos especiais permanecem nas observações e precisam ser conferidos no editor.</p>
 {!saved&&draft.routines.length>0&&<div className="forge-card">
  <label className="forge-check"><input type="checkbox" checked={useCustomForUnmatched} onChange={e=>setUseCustomForUnmatched(e.target.checked)}/>Manter exercícios sem correspondência como personalizados</label>
  <p>Depois de conferir a ficha, marque em lote. Exercícios com dados pendentes ficam destacados para correção.</p>
  <button className="forge-btn forge-secondary" onClick={reviewAll}>Marcar todos como conferidos</button>
  <p aria-live="polite">{pending} {pending===1?'exercício pendente':'exercícios pendentes'}</p>
 </div>}
 {draft.routines.map((r,ri)=><section className="forge-card forge-editor" key={r.key} style={{marginBottom:16}}><label>Nome do treino {ri+1}<input value={r.name} maxLength={80} disabled={saved} onChange={e=>changeRoutine(ri,e.target.value)}/></label>
 {r.ex.map((row,ei)=><ImportRow key={row.key} row={row} disabled={saved} onChange={(k,v)=>edit(ri,ei,k,v)} onRemove={()=>setDraft(d=>({...d,routines:d.routines.map((x,i)=>i===ri?{...x,ex:x.ex.filter((_,j)=>j!==ei)}:x)}))}/>)}
 {!saved&&<><button className="forge-text-btn" onClick={()=>setDraft(d=>({...d,routines:d.routines.map((x,i)=>i===ri?{...x,ex:[...x.ex,newImportRow()]}:x)}))}>+ Adicionar exercício a este treino</button><br/><button className="forge-text-btn" onClick={()=>setDraft(d=>({...d,routines:d.routines.filter((_,i)=>i!==ri)}))}>Remover este treino da importação</button></>}</section>)}
 {draft.ignored.length>0&&<details className="forge-card"><summary>Texto não convertido em exercícios ({draft.ignored.length} linhas): conferir</summary><p>Confira se alguma prescrição ficou aqui. Adicione manualmente o que precisar; a importação não interpreta toda diagramação.</p><pre style={{whiteSpace:'pre-wrap',font:'13px/1.6 system-ui'}}>{draft.ignored.join('\n')}</pre></details>}
 </section>}
 {!saved&&<p><button className="forge-btn forge-secondary" disabled={busy} onClick={addRoutine}>+ Adicionar treino manualmente</button></p>}
 {draft&&!saved&&<section className="forge-card"><h2>3. Adicionar ao meu plano</h2><p>A importação acrescenta novas fichas. Sua agenda, cargas anteriores, alimentação e histórico não serão substituídos. Depois de importar, escolha os dias em Plano.</p>{error&&<p className="forge-notice" role="alert">{error}</p>}{pending>0&&<p>{pending} exercícios ainda precisam de conferência.</p>}<button className="forge-btn forge-primary" disabled={busy||active||!draft.routines.length||draft.routines.some(r=>!r.ex.length||r.ex.some(e=>!e.reviewed))} onClick={save}>Importar ficha revisada</button>{active&&<p>Finalize a sessão em andamento para importar.</p>}</section>}
 {saved&&<section className="forge-card" role="status"><h2>Ficha importada.</h2><p>Abra o Plano para consultar, ajustar a agenda e conferir métodos especiais antes de iniciar.</p><Link className="forge-btn forge-primary" to="/plan">Abrir meu plano →</Link></section>}
 </main>
}
function ImportRow({row,disabled,onChange,onRemove}){
 const [query,setQuery]=useState(row.name),matches=exerciseSuggestions(query)
 let issue=''
 try{validateImportedRow({...row,reviewed:true})}catch(error){issue=error.message}
 const candidates=matches.items.some(x=>x.id===row.exerciseId)?matches.items:[...(row.exerciseId?[{id:row.exerciseId,name:catalogExerciseName(row.exerciseId)}]:[]),...matches.items]
 return <fieldset style={{border:'1px solid #cbd6c1',borderRadius:12,padding:16,margin:'18px 0'}}><legend>{row.name||'Exercício a conferir'}</legend>
 {!disabled&&issue&&<p className="forge-notice">{issue}</p>}
 {row.source&&<details><summary>Linha original do PDF</summary><p>{row.source}</p></details>}
 <label>Nome no PDF<input value={row.name} maxLength={160} disabled={disabled} onChange={e=>onChange('name',e.target.value)}/></label>
 <label className="forge-check"><input type="checkbox" checked={row.custom} disabled={disabled} onChange={e=>onChange('custom',e.target.checked)}/>Manter como exercício personalizado, sem vídeo automático</label>
 {!row.custom&&<><label>Buscar exercício no catálogo<input value={query} disabled={disabled} onChange={e=>setQuery(e.target.value)}/></label><label>Correspondência no catálogo<select value={row.exerciseId} disabled={disabled} onChange={e=>onChange('exerciseId',e.target.value)}><option value="">Selecione e confira a variação</option>{candidates.map(m=><option value={m.id} key={m.id}>{m.name}</option>)}</select></label><p>{matches.exact&&matches.items.length===1?'Correspondência exata de nome: confira a execução.':'Nome ambíguo ou sem correspondência exata. Escolha manualmente ou mantenha personalizado.'}</p></>}
 <label>Tipo de prescrição<select value={row.mode} disabled={disabled} onChange={e=>onChange('mode',e.target.value)}><option value="reps">Repetições</option><option value="time">Tempo por série (segundos)</option><option value="cardio">Atividade contínua (segundos)</option></select></label>
 <label>Séries<input type="number" min={1} max={20} value={row.sets} disabled={disabled} onChange={e=>onChange('sets',e.target.value)}/></label>
 {row.mode==='reps'?<label>Repetições (10, 8-12 ou 12/10/8)<input value={row.reps} disabled={disabled} onChange={e=>onChange('reps',e.target.value)}/></label>:<label>Duração em segundos<input type="number" min={1} value={row.duration} disabled={disabled} onChange={e=>onChange('duration',e.target.value)}/></label>}
 {row.mode==='reps'&&<label className="forge-check"><input type="checkbox" checked={!!row.side} disabled={disabled} onChange={e=>onChange('side',e.target.checked)}/>Repetições por lado</label>}
 <label>Descanso em segundos (opcional)<input type="number" min={0} value={row.rest} disabled={disabled} onChange={e=>onChange('rest',e.target.value)}/></label>
 <label>Carga (opcional; confirme total ou por halter)<input type="number" min={0} step="any" value={row.weight} disabled={disabled} onChange={e=>onChange('weight',e.target.value)}/></label><label>Unidade da carga do PDF<select value={row.unit} disabled={disabled} onChange={e=>onChange('unit',e.target.value)}><option value="kg">kg</option><option value="lb">lb</option></select></label>
 <label>Observações e métodos originais<textarea value={row.note} disabled={disabled} onChange={e=>onChange('note',e.target.value)}/></label>
 <label className="forge-check"><input type="checkbox" checked={row.reviewed} disabled={disabled} onChange={e=>onChange('reviewed',e.target.checked)}/>Conferi este exercício e todos os valores com a ficha original</label>{!disabled&&<button className="forge-text-btn" onClick={onRemove}>Não importar este exercício</button>}
 </fieldset>
}
