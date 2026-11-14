import {EXDB,EXIDX} from './exercises.js'
import pt from '../exercise-names/pt-BR.js'
import {FORGE_DEMOS} from './forge-demos.js'
import {uid} from './format.js'
import {convertWeight} from './units.js'
export const normalizeExercise=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()
const aliases=new Map()
function alias(name,id){const key=normalizeExercise(name);if(!key)return;const ids=aliases.get(key)||new Set();ids.add(id);aliases.set(key,ids)}
for(const e of EXDB){alias(e.n,e.id);alias(pt[e.id],e.id);alias(FORGE_DEMOS[e.id]?.name,e.id)}
export const catalogExerciseName=id=>FORGE_DEMOS[id]?.name||pt[id]||EXIDX[id]?.n||id
export function exerciseSuggestions(name){
 const normalized=normalizeExercise(name),exact=[...(aliases.get(normalized)||[])]
 if(exact.length)return {exact:true,items:exact.map(id=>({id,name:FORGE_DEMOS[id]?.name||pt[id]||EXIDX[id].n}))}
 const tokens=normalized.split(' ').filter(t=>t.length>2);if(!tokens.length)return {exact:false,items:[]}
 const scores=new Map()
 for(const [key,ids] of aliases){const words=key.split(' '),hits=tokens.filter(t=>words.includes(t)).length;if(hits<Math.min(2,tokens.length))continue;const score=hits/Math.max(tokens.length,words.length);for(const id of ids)if(score>(scores.get(id)||0))scores.set(id,score)}
 return {exact:false,items:[...scores].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id])=>({id,name:FORGE_DEMOS[id]?.name||pt[id]||EXIDX[id].n}))}
}
const blankRow=(name,source='')=>({key:uid(),name,source,exerciseId:'',custom:false,sets:'',reps:'',rest:'',weight:'',unit:'kg',mode:'reps',duration:'',note:source,reviewed:false})
export const newImportRow=()=>blankRow('')
const num=s=>Number(String(s).replace(',','.'))
function parsePrescription(row,fields,columns){
 const all=fields.join(' | ')
 const scheme=all.match(/(?:^|\s)(\d{1,2})\s*[x×]\s*(\d{1,3}(?:\s*[-–a/]\s*\d{1,3})*)(?!\d)/i)
 if(scheme){row.sets=scheme[1];row.reps=scheme[2].replace(/\s*a\s*/g,'-')}
 if(columns){
  const value=key=>fields[columns[key]]||''
  if(/^\d{1,2}$/.test(value('sets')))row.sets=value('sets')
  if(/^\d+(?:\s*[-–a/]\s*\d+)*$/.test(value('reps')))row.reps=value('reps').replace(/\s*a\s*/g,'-')
  if(/^\d+(?:[.,]\d+)?$/.test(value('weight'))){if(columns.weightUnit){row.weight=String(num(value('weight')));row.unit=columns.weightUnit}else row.note+='\nCarga sem unidade no PDF: '+value('weight')+' (confira antes de preencher a carga).'}
  if(/^\d+(?:[.,]\d+)?$/.test(value('rest'))){if(columns.restUnit)row.rest=String(num(value('rest'))*columns.restUnit);else row.note+='\nDescanso sem unidade no PDF: '+value('rest')+' (confira antes de preencher segundos).'}
  const duration=value('reps').match(/^(\d+)\s*(s|seg(?:undos)?|min(?:utos)?)$/i)
  if(duration){row.mode='time';row.reps='';row.duration=String(Number(duration[1])*(duration[2].toLowerCase().startsWith('min')?60:1))}
 }
 const weight=all.match(/(?:^|[\s|])(\d+(?:[.,]\d+)?)\s*(kg|lb|lbs)\b/i);if(weight){row.weight=String(num(weight[1]));row.unit=weight[2].toLowerCase()==='kg'?'kg':'lb'}
 const restSource=columns?.rest!=null?'descanso '+fields[columns.rest]:all
 const rest=restSource.match(/(?:descanso|intervalo|pausa)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(s|seg(?:undos)?|min(?:utos)?)\b/i)
 if(rest)row.rest=String(num(rest[1])*(rest[2].toLowerCase().startsWith('min')?60:1))
 else if(scheme&&!columns){
  const afterReps=all.slice(scheme.index+scheme[0].length)
  const inlineRest=afterReps.match(/^(?:\s*\/\s*(?:perna|lado|braço))?[\s|]+(\d+)\s*(s|seg(?:undos)?|min(?:utos)?)\b/i)
  if(inlineRest)row.rest=String(Number(inlineRest[1])*(inlineRest[2].toLowerCase().startsWith('min')?60:1))
 }
 row.side=!!scheme&&/^\s*\/\s*(?:perna|lado|braço)\b/i.test(all.slice(scheme.index+scheme[0].length))

 // Time prescriptions are never silently turned into repetitions.
 const timed=all.match(/(\d{1,2})\s*[x×]\s*(\d+)\s*(s|seg(?:undos)?|min(?:utos)?)\b/i)
 if(timed){row.sets=timed[1];row.mode='time';row.duration=String(Number(timed[2])*(timed[3].toLowerCase().startsWith('min')?60:1));row.reps=''}
 const matches=exerciseSuggestions(row.name);if(matches.exact&&matches.items.length===1)row.exerciseId=matches.items[0].id
 return row
}
export function parseTrainingText(text){
 if(String(text).length>150000)throw Error('Texto muito grande. Importe uma ficha menor.')
 const routines=[],ignored=[];let current=null,columns=null
 const routine=name=>{current=routines.find(r=>r.name===name);if(!current){current={key:uid(),name,ex:[]};routines.push(current)}}
 for(const raw of String(text).split(/\r?\n/)){
  const line=raw.trim();if(!line)continue
  const dayHeading=line.match(/^(?:segunda|terça|quarta|quinta|sexta|sábado|domingo)(?:-feira)?[\s|·–—:-]+((?:superiores|inferiores|corpo inteiro)\s+[A-G])\b/i)
  if(dayHeading){routine(dayHeading[1]);columns=null;continue}
  if(/^(?:treino|ficha|dia)\s*(?:[A-G]|\d{1,2})(?:\b|\s*[-:])/i.test(line)&&line.length<100&&!/\d\s*[x×]\s*\d/i.test(line)){routine(line);columns=null;continue}
  const fields=line.split(/\s*\|\s*|\t+| {2,}/).map(s=>s.trim())
  const normalized=fields.map(normalizeExercise)
  if(normalized.some(x=>/^(exercicio|exercicios|exercise)$/.test(x))&&normalized.some(x=>/series|sets|repeticoes|reps/.test(x))){columns={};for(let i=0;i<normalized.length;i++){const h=normalized[i];if(/exercicio|exercise/.test(h))columns.name=i;else if(/series|sets/.test(h))columns.sets=i;else if(/repet|reps/.test(h))columns.reps=i;else if(/carga|peso|weight/.test(h)){columns.weight=i;if(/\bkg\b/.test(h))columns.weightUnit='kg';else if(/\blbs?\b/.test(h))columns.weightUnit='lb'}else if(/descanso|intervalo|rest/.test(h)){columns.rest=i;if(/\bmin(?:utos)?\b/.test(h))columns.restUnit=60;else if(/\bs\b|\bseg(?:undos)?\b/.test(h))columns.restUnit=1}}continue}
  if(/^pagina\s+\d|^page\s+\d|^\d+\s*\/\s*\d+$|^--- pagina/i.test(normalizeExercise(line)))continue
  const scheme=line.match(/(?:^|\s)\d{1,2}\s*[x×]\s*\d/i)
  let name=columns&&fields.length>1?fields[columns.name??0]:fields[0].split(/\s+\d{1,2}\s*[x×]\s*\d/i)[0]
  name=(name||'').replace(/^\d+[.)-]\s*/,'').trim()
  const exact=exerciseSuggestions(name)
  const looksLikeRow=scheme||columns&&fields.length>1&&[columns.sets,columns.reps].some(i=>/^\d+(?:\s*[-–a/]\s*\d+)*$/.test(fields[i]||''))||exact.exact
  if(!name||!looksLikeRow){ignored.push(line);continue}
  if(!current)routine('Ficha importada')
  if(routines.length>14||routines.reduce((n,r)=>n+r.ex.length,0)>=200)throw Error('Limite de 14 treinos e 200 exercícios por importação.')
  current.ex.push(parsePrescription(blankRow(name,line),fields,columns))
 }
 return {routines:routines.filter(r=>r.ex.length),ignored}
}
export function validateImportedRow(e){
 if(!e.name.trim()||e.name.length>160)throw Error('Informe o nome de cada exercício (até 160 caracteres).')
 if(!e.reviewed)throw Error('Confirme a revisão de cada exercício.')
 if(!e.custom&&!EXIDX[e.exerciseId])throw Error('Escolha a correspondência ou marque exercício personalizado: '+e.name)
 if(!Number.isInteger(Number(e.sets))||Number(e.sets)<1||Number(e.sets)>20)throw Error('Confira as séries de '+e.name+' (1 a 20).')
 if(!['reps','time','cardio'].includes(e.mode))throw Error('Tipo de exercício inválido.')
 if(e.mode==='reps'&&!/^\d{1,3}(?:\s*[-–/]\s*\d{1,3})*$/.test(e.reps))throw Error('Confira as repetições de '+e.name+' (ex.: 10, 8-12 ou 12/10/8).')
 if(e.mode==='reps'){
 const parts=e.reps.split(/[-–/]/).map(Number);if(parts.some(n=>n<1||n>500)||(/[-–]/.test(e.reps)&&(parts.length!==2||parts[0]>parts[1]))||e.reps.includes('/')&&(parts.length!==Number(e.sets)||parts.length>10||/[-–]/.test(e.reps)))throw Error('Faixa ou sequência de repetições inconsistente em '+e.name)
 }
 if(e.mode!=='reps'&&(!(Number(e.duration)>0)||Number(e.duration)>7200))throw Error('Confira a duração em segundos de '+e.name)
 if(e.rest!==''&&(!Number.isFinite(Number(e.rest))||Number(e.rest)<0||Number(e.rest)>3600))throw Error('Confira o descanso em segundos de '+e.name)
 if(e.weight!==''&&(!Number.isFinite(Number(e.weight))||Number(e.weight)<0||Number(e.weight)>2000))throw Error('Confira a carga de '+e.name)
 if(!['kg','lb'].includes(e.unit))throw Error('Unidade da carga inválida.')
}
export function applyPdfPlan(s,draft){
 if(s.active)throw Error('Finalize a sessão em andamento antes de importar.')
 if(!draft.routines?.length||draft.routines.length>14||draft.routines.some(r=>!r.name.trim()||!r.ex.length)||draft.routines.reduce((n,r)=>n+r.ex.length,0)>200)throw Error('Revise a divisão e os exercícios da ficha.')
 for(const r of draft.routines)for(const e of r.ex)validateImportedRow(e)
 const custom=[],routines=draft.routines.map(r=>({id:uid(),name:r.name.trim().slice(0,80),ex:r.ex.map(e=>{
  let id=e.exerciseId
  if(e.custom){id=uid();custom.push({id,n:e.name.trim(),bp:'full body',eq:'other',tg:'other',custom:true,sm:[]})}
  const out={id,sets:Number(e.sets),mode:e.mode,prog:'off',note:('Importado de PDF. Nome original: '+e.name+'\n'+e.note+(e.rest===''?'\nDescanso não informado: o aplicativo poderá mostrar o padrão do perfil; confira no editor.':'')).slice(0,4000)}
  if(e.mode==='reps'&&e.side)out.side=true
  if(e.mode==='reps'){if(e.reps.includes('/'))out.pyramid=e.reps.split('/').map(Number);else{const [min,max]=e.reps.split(/[-–]/).map(Number);out.reps=min;out.repsMin=min;out.repsMax=max||min}}
  else if(e.mode==='time')out.sec=Number(e.duration);else out.min=Number(e.duration)/60
  if(e.rest!=='')out.restSec=Number(e.rest)
  if(e.weight!=='')out.weight=convertWeight(Number(e.weight),e.unit,s.unit||'kg')
  return out
 })}))
 // Only append after every row passes validation; no inferred schedule and no history edits.
 s.customEx=[...(s.customEx||[]),...custom];s.routines=[...(s.routines||[]),...routines];s.forgeTitanLoaded=true
 return routines.map(r=>r.id)
}
