import {EXIDX} from './exercises.js'
import {uid,todayISO} from './format.js'

export const BUILDER_VERSION=3
export const BUILDER_GOALS={general:'Saúde e condicionamento',restart:'Retomar com constância',fatloss:'Reduzir gordura',muscle:'Ganhar massa muscular',strength:'Ganhar força'}
export const BUILDER_SOURCES=[{title:'ACSM · Diretriz de treinamento resistido 2026',url:'https://acsm.org/resistance-training-guidelines-update-2026/'},{title:'Posicionamento completo · Currier et al., 2026',url:'https://pubmed.ncbi.nlm.nih.gov/41843416/'},{title:'Musculação durante perda de peso · revisão de ensaios clínicos, 2025',url:'https://pubmed.ncbi.nlm.nih.gov/40909191/'}]
// Catalogue identity, actual equipment and movement patterns are curated together.
// Glute bridge 2471 is a hip extension; 0484 is an abdominal hip raise and must not be substituted.
const move=(id,label,group,requires,pattern,secondary=[],side=false)=>({id,label,group,requires,pattern,secondary,side})
const MOVES={
 squat:move('1760','Agachamento goblet','Quadríceps',['dumbbell'],'squat',['Glúteos']),
 squatBand:move('1004','Agachamento com elástico','Quadríceps',['band'],'squat',['Glúteos']),
 squatBody:move('1197','Agachamento livre','Quadríceps',[],'squat',['Glúteos']),
 legpress:move('8375','Leg press 45°','Quadríceps',['machines'],'squat',['Glúteos']),
 splitSquat:move('2960','Agachamento dividido com halteres','Quadríceps',['dumbbell'],'squat',['Glúteos'],true),
 splitBand:move('4135','Agachamento dividido com elástico','Quadríceps',['band'],'squat',['Glúteos'],true),
 splitBody:move('0781','Agachamento dividido sem carga','Quadríceps',[],'squat',['Glúteos'],true),
 hinge:move('1459','Levantamento romeno com halteres','Posterior de coxa',['dumbbell'],'posterior',['Glúteos']),
 legcurl:move('0599','Cadeira flexora','Posterior de coxa',['machines'],'posterior'),
 legcurlBand:move('0911','Flexão de joelhos com elástico deitado','Posterior de coxa',['band'],'posterior'),
 hamBridge:move('8358','Ponte com ênfase no posterior de coxa','Posterior de coxa',[],'posterior',['Glúteos']),
 bridge:move('2471','Ponte de glúteos no solo','Glúteos',[],'hip',['Posterior de coxa']),
 press:move('3668','Supino com halteres no solo','Peito',['dumbbell'],'push',['Tríceps','Ombros']),
 bench:move('0289','Supino reto com halteres','Peito',['dumbbell','bench'],'push',['Tríceps','Ombros']),
 knees:move('1182','Flexão de braços com joelhos apoiados','Peito',[],'push',['Tríceps','Ombros']),
 pushup:move('0662','Flexão de braços','Peito',[],'push',['Tríceps','Ombros']),
 row:move('0293','Remada curvada com halteres','Costas',['dumbbell'],'pull',['Bíceps','Ombros']),
 rowOne:move('4730','Remada unilateral com halter','Costas',['dumbbell'],'pull',['Bíceps','Ombros'],true),
 bandrow:move('3896','Remada sentada com elástico','Costas',['band'],'pull',['Bíceps','Ombros']),
 bandrowBent:move('3899','Remada curvada com elástico','Costas',['band'],'pull',['Bíceps','Ombros']),
 cablerow:move('0180','Remada baixa com triângulo','Costas',['cable'],'pull',['Bíceps','Ombros']),
 pulldown:move('1047','Puxada alta com triângulo','Costas',['cable'],'pull',['Bíceps','Ombros']),
 shoulder:move('0334','Elevação lateral com halteres','Ombros',['dumbbell'],'shoulder'),
 bandshoulder:move('0997','Desenvolvimento com elástico','Ombros',['band'],'shoulder',['Tríceps']),
 bandLateral:move('0907','Elevação lateral com elástico','Ombros',['band'],'shoulder'),
 cableShoulder:move('0162','Elevação frontal na polia','Ombros',['cable'],'shoulder'),
 curl:move('0294','Rosca com halteres','Bíceps',['dumbbell'],'curl'),
 hammer:move('0313','Rosca martelo com halteres','Bíceps',['dumbbell'],'curl'),
 curlBand:move('4063','Rosca com elástico','Bíceps',['band'],'curl'),
 curlCable:move('0868','Rosca na polia','Bíceps',['cable'],'curl'),
 triceps:move('0201','Tríceps na polia com barra','Tríceps',['cable'],'extension'),
 tricepsDb:move('0430','Extensão unilateral de tríceps com halter em pé','Tríceps',['dumbbell'],'extension',[],true),
 tricepsBand:move('3939','Extensão de tríceps com elástico','Tríceps',['band'],'extension'),
 calf:move('3018','Elevação de panturrilhas em pé','Panturrilhas',[],'calf'),
 core:move('0276','Dead bug','Tronco',[],'core',[],true)
}
const GROUPS=['Peito','Costas','Ombros','Bíceps','Tríceps','Quadríceps','Posterior de coxa','Glúteos','Panturrilhas','Tronco']
const adjacent=(a,b)=>(a+1)%7===b||(b+1)%7===a
const unique=xs=>[...new Set(xs.filter(Boolean))]
export function validateIntake(a){
 if(!a.adult)throw Error('Este gerador é destinado a adultos. Confirme que você tem 18 anos ou mais.')
 if(a.screen!=='none')throw Error('Dor, lesão, gestação, pós-parto ou recomendação de adaptação individual precisam de avaliação profissional. Não geramos automaticamente uma ficha nessas situações.')
 if(!BUILDER_GOALS[a.goal]||!['new','returning','regular'].includes(a.experience))throw Error('Escolha objetivo e experiência.')
 if(![30,45,60].includes(Number(a.minutes)))throw Error('Escolha 30, 45 ou 60 minutos.')
 if(!Array.isArray(a.days)||a.days.length<1||a.days.length>7||new Set(a.days).size!==a.days.length||a.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Selecione de 1 a 7 dias diferentes por semana.')
 if(a.strengthSessions!=null&&a.strengthSessions!=='auto'&&(!Number.isInteger(a.strengthSessions)||a.strengthSessions<1||a.strengthSessions>Math.min(a.days.length,6)))throw Error('Escolha até 6 sessões de musculação, dentro dos dias disponíveis. Reserve recuperação ao treinar todos os dias.')
 if(!Array.isArray(a.equipment)||!a.equipment.some(e=>['dumbbell','band','cable'].includes(e)))throw Error('Para incluir puxadas, informe ao menos halteres, elástico ou polia. Esta versão não gera uma ficha completa apenas com peso corporal.')
 if(a.equipment.some(e=>!['dumbbell','band','bench','cable','machines'].includes(e)))throw Error('Equipamento não reconhecido.')
 if(!Array.isArray(a.exclude)||a.exclude.some(k=>!MOVES[k]))throw Error('Exclusão de exercício inválida.')
}
function arrangeDays(a,days){
 let spaced=[]
 for(let mask=1;mask<(1<<days.length);mask++){
  const subset=days.filter((d,i)=>mask&(1<<i))
  if(subset.length<=3&&!subset.some((d,i)=>subset.slice(i+1).some(e=>adjacent(d,e)))&&subset.length>spaced.length)spaced=subset
 }
 const manual=Number.isInteger(a.strengthSessions)
 const autoSplit=days.length===2&&adjacent(...days)||a.experience==='regular'&&days.length>=4
 const count=manual?a.strengthSessions:autoSplit?days.length-days.length%2:spaced.length
 if(count<=3&&count<=spaced.length)return {strengthDays:spaced.slice(0,count),regions:spaced.slice(0,count).map(()=> 'full')}
 // Exhaust the tiny seven-day search space, including the Sunday/Monday boundary.
 let best=null
 for(let mask=1;mask<(1<<days.length);mask++){
  const ds=days.filter((d,i)=>mask&(1<<i));if(ds.length!==count)continue
  for(let colors=0;colors<(1<<count);colors++){
   const regions=ds.map((_,i)=>(colors&(1<<i))?'lower':'upper')
   if(ds.some((d,i)=>ds.some((e,j)=>j>i&&adjacent(d,e)&&regions[i]===regions[j])))continue
   const n=regions.filter(r=>r==='upper').length
   const score=Math.abs(n-(count-n))*100+regions.filter((r,i)=>r!==(i%2?'lower':'upper')).length
   if(!best||score<best.score)best={strengthDays:ds,regions,score}
  }
 }
 if(!best)throw Error('Não foi possível separar as regiões nos dias escolhidos. Reduza uma sessão de musculação ou altere os dias.')
 return best
}
export function generateProgram(raw){
 const a=structuredClone(raw);a.minutes=Number(a.minutes);validateIntake(a)
 const available=k=>!a.exclude.includes(k)&&MOVES[k].requires.every(e=>a.equipment.includes(e))
 const optional=(...keys)=>keys.find(available)
 const pick=(...keys)=>{const k=optional(...keys);if(!k)throw Error('Não há uma alternativa compatível para um dos movimentos. Revise equipamentos e exclusões ou monte a ficha com um profissional.');return k}
 const days=[1,2,3,4,5,6,0].filter(d=>a.days.includes(d))
 const {strengthDays,regions}=arrangeDays(a,days),strengthCount=strengthDays.length
 const experienced=a.experience==='regular',strong=a.goal==='strength'&&experienced
 const quadA=pick('legpress','squat','squatBand','squatBody'),quadB=pick('splitSquat','splitBand','splitBody','squatBody','legpress','squat','squatBand')
 const ham=pick('hinge','legcurl','legcurlBand','hamBridge'),hamB=pick('legcurl','legcurlBand','hinge','hamBridge'),glute=optional('bridge')
 const chest=pick('bench','press',...(experienced?['pushup','knees']:['knees','pushup']))
 const chestB=pick(...(chest==='bench'?['press','knees','pushup','bench']:chest==='press'?['knees','pushup','bench','press']:['press','bench',chest==='knees'?'pushup':'knees',chest]))
 const back=pick('cablerow','row','bandrow','pulldown','rowOne','bandrowBent'),backB=pick('pulldown','rowOne','bandrowBent','cablerow','row','bandrow')
 const shoulder=optional('shoulder','bandshoulder','cableShoulder','bandLateral'),shoulderB=optional('bandLateral','shoulder','cableShoulder','bandshoulder')
 const biceps=optional('curl','curlBand','curlCable','hammer'),bicepsB=optional('hammer','curlBand','curlCable','curl')
 const triceps=optional('triceps','tricepsDb','tricepsBand'),calf=optional('calf'),core=optional('core')
 const notes=[],plannedCoverage={}
 const counts={upper:regions.filter(r=>r==='upper').length,lower:regions.filter(r=>r==='lower').length,full:regions.filter(r=>r==='full').length}
 const make=(region,index,occurrence)=>{
  const b=occurrence%2===1
  const main=region==='upper'?[b?backB:chest,b?chestB:back]:region==='lower'?[b?glute:quadA,b?quadB:ham,b?hamB:glute]:[b?quadB:quadA,b?chestB:chest,b?hamB:ham,b?backB:back]
  const fullExtras=[[core,shoulder,triceps,biceps,calf,glute],[glute,triceps,biceps,shoulder,calf,core],[calf,triceps,shoulder,biceps,core,glute]][occurrence%3]
  fullExtras.sort((x,y)=>(plannedCoverage[MOVES[x]?.group]||0)-(plannedCoverage[MOVES[y]?.group]||0))
  const accessories=region==='upper'?[b?triceps:shoulder,b?shoulderB:triceps,b?bicepsB:biceps,optional('pulldown')?(b?back:backB):undefined,...(a.goal==='muscle'?[b?chest:chestB]:[])]:region==='lower'?[calf,core,optional('legcurl','legcurlBand'),...(a.goal==='muscle'?[b?quadA:quadB]:[])]:fullExtras
  const regionSessions=region==='full'?counts.full:counts[region]
  const baseSets=experienced&&a.goal!=='restart'&&regionSessions<=2&&a.minutes>=45&&(region!=='full'||a.minutes===60)?3:2
  const cfg=k=>{
   const m=MOVES[k];if(!EXIDX[m.id])throw Error('Exercício indisponível no catálogo: '+m.label)
   const compound=['squat','push','pull'].includes(m.pattern)||k==='hinge',isCore=m.pattern==='core'
   const repsMin=isCore?6:strong&&compound?6:compound?8:10,repsMax=isCore?10:strong&&compound?8:compound?12:15
   return {id:m.id,sets:baseSets,reps:repsMin,repsMin,repsMax,restSec:isCore?60:compound?(strong?180:120):75,prog:'off',...(m.side?{side:true}:{}),note:(m.side?'Repetições por lado; complete ambos os lados antes do descanso. ':'')+'Músculos principais: '+m.group+'. '+(m.secondary.length?'Participação secundária: '+m.secondary.join(', ')+'. ':'')+'Escolha carga/dificuldade com execução controlada e '+(experienced?'2–3':'3–4')+' repetições ainda possíveis. Não é necessário chegar à falha. Pare se surgir dor.',builder:{key:k,...m,region}}
  }
  const estimate=xs=>Math.ceil(7+xs.reduce((n,e)=>n+1+e.sets*(e.builder.side?1.1:0.65)+(e.sets-1)*e.restSec/60,0))
  const mainKeys=unique(main),ex=mainKeys.map(cfg)
  // Preserve two working sets and the required patterns before spending time on accessories.
  while(estimate(ex)>a.minutes&&ex.some(e=>e.sets>2)){const e=[...ex].reverse().find(e=>e.sets>2);e.sets--}
  if(estimate(ex)>a.minutes)throw Error('Os movimentos essenciais não cabem com descanso adequado. Escolha uma sessão mais longa.')
  const skipped=[]
  for(const k of unique(accessories).filter(k=>!mainKeys.includes(k))){const e=cfg(k);while(estimate([...ex,e])>a.minutes&&e.sets>2)e.sets--;if(estimate([...ex,e])<=a.minutes)ex.push(e);else skipped.push(MOVES[k].group)}
  const name=(region==='upper'?'Superiores ':region==='lower'?'Inferiores ':'Corpo inteiro ')+String.fromCharCode(65+occurrence)
  return {id:'preview-'+index,name,region,focus:region==='lower'?(b?'Glúteos e posterior, com quadríceps':'Quadríceps e posterior, com glúteos'):region==='upper'?(b?'Puxada e braços, com peito e ombros':'Peito e costas, com ombros e braços'):'Empurrar, puxar, agachar e cadeia posterior',ex,skipped:unique(skipped),estimatedMinutes:estimate(ex)}
 }
 const seen={upper:0,lower:0,full:0}
 const routines=days.map((d,i)=>{
  const ix=strengthDays.indexOf(d)
  if(ix<0){const duration=experienced?Math.min(30,a.minutes-7):Math.min(20,a.minutes-7);return {id:'preview-recovery-'+i,name:'Recuperação ativa',region:'recovery',recovery:true,estimatedMinutes:duration+7,ex:[{id:'2258',mode:'cardio',sets:1,min:duration,speed:0,restSec:0,prog:'off',note:'Caminhada leve, em ritmo que permita conversar. Ajuste a duração ou descanse conforme recuperação. Não é uma sessão de musculação nem substitui toda a atividade aeróbica da semana.',builder:{key:'walk',label:'Caminhada leve',group:'Recuperação ativa',requires:[]}}]}}
  const region=regions[ix],r=make(region,i,seen[region]++);for(const e of r.ex)for(const g of [e.builder.group,...e.builder.secondary])plannedCoverage[g]=(plannedCoverage[g]||0)+1;return r
 })
 const volume={},secondaryVolume={},frequency={},directDays={}
 for(const r of routines.filter(r=>!r.recovery)){
  const groups=new Set(),direct=new Set()
  for(const e of r.ex){const m=e.builder;volume[m.group]=(volume[m.group]||0)+e.sets;direct.add(m.group);groups.add(m.group);for(const g of m.secondary){secondaryVolume[g]=(secondaryVolume[g]||0)+e.sets;groups.add(g)}}
  for(const g of groups)frequency[g]=(frequency[g]||0)+1
  for(const g of direct)directDays[g]=(directDays[g]||0)+1
 }
 const coverage=GROUPS.map(group=>({group,directSets:volume[group]||0,secondarySets:secondaryVolume[group]||0,days:frequency[group]||0,directDays:directDays[group]||0}))
 const missing=coverage.filter(g=>!g.days).map(g=>g.group)
 if(days.length===1)notes.push('Uma sessão semanal é um começo possível, mas fica abaixo da recomendação de musculação pelo menos duas vezes por semana.')
 if(counts.upper&&Math.min(counts.upper,counts.lower)<2)notes.push('A divisão e os dias escolhidos deixam uma região com apenas uma sessão semanal. Dias espaçados permitem corpo inteiro; quatro sessões permitem superiores e inferiores duas vezes.')
 if(strengthCount<days.length)notes.push(`${strengthCount} sessões de musculação e ${days.length-strengthCount} de recuperação ativa. Você pode ajustar a quantidade no campo de sessões; caminhada não conta como séries de musculação.`)
 if(!experienced)notes.push('Para aprender ou retomar, duas séries por exercício e esforço controlado são um ponto de partida. Aumente gradualmente conforme execução, desempenho e recuperação; mais dias disponíveis não exigem mais sessões pesadas.')
 if(missing.length)notes.push('O tempo/equipamento/exclusões não permitiu trabalho para: '+missing.join(', ')+'. Aumente o tempo ou ajuste as escolhas para ampliar a cobertura.')
 const omitted=unique(routines.flatMap(r=>r.skipped||[]));if(omitted.length)notes.push('Para respeitar o tempo sem cortar descansos ou reduzir abaixo de duas séries, alguns acessórios não entraram em todas as sessões: '+omitted.join(', ')+'. Confira a cobertura semanal abaixo; participação secundária não equivale a séries diretas.')
 if(a.goal==='fatloss')notes.push('Redução de gordura: musculação para preservar força e massa muscular, junto de atividade aeróbica e alimentação compatíveis. Mais repetições não garantem maior perda de gordura. Usamos 8–12 nos principais exercícios compostos e 10–15 na maioria dos acessórios; a carga depende da execução e do esforço, não de uma promessa de emagrecimento.')
 if(a.goal==='muscle')notes.push('Hipertrofia: considere o volume semanal, não apenas peso e repetições. A ACSM encontra benefício de volumes maiores, frequentemente ≥10 séries por músculo/semana; este plano inicial pode ficar abaixo disso. Aumente gradualmente, sem tratar esse número como mínimo obrigatório nem somar séries indiretas como equivalentes às diretas.')
 if(strong)notes.push('Força: movimentos principais usam 6–8 repetições com descanso maior para praticantes regulares. Isso é uma faixa prática conservadora; a evidência favorece cargas maiores para força, sem exigir testes máximos no aplicativo.')
 notes.push('A/B alternam prioridade e alguns exercícios, mantendo movimentos estáveis para comparar desempenho. Repetir exercícios na semana pode ser válido; variação constante não é requisito de eficácia.')
 notes.push('As estimativas incluem 7 minutos de preparação, execução dos dois lados quando necessário, descansos e transições. Filas podem aumentar o tempo. As faixas de esforço, descansos e algoritmo de agenda são escolhas práticas do aplicativo, não uma prescrição individual validada.')
 return {strengthCount,recoveryCount:days.length-strengthCount,version:BUILDER_VERSION,createdAt:new Date().toISOString(),intake:a,routines,days,volume,secondaryVolume,coverage,notes,progression:'Registre as repetições e a carga. Quando completar todas as séries no topo da faixa, mantendo a técnica e a margem de repetições indicada por duas sessões, aumente a menor carga disponível e retorne ao início da faixa. Se não houver carga maior, avance nas repetições dentro da faixa. Reavalie esforço e volume se o desempenho ou a recuperação piorarem. Sem aumento automático de peso.',review:'Reveja a ficha após 4–6 semanas de registros, ou antes se necessário. Ajustes de séries e exercícios devem considerar recuperação e evolução; não há troca automática nem promessa de treino ideal.'}
}
export function applyGeneratedProgram(s,p,schedule=false){
 if(s.active)throw Error('Finalize a sessão em andamento antes de aplicar uma nova ficha.')
 if(p?.version!==BUILDER_VERSION)throw Error('Gere uma proposta atualizada.')
 // Recompute rather than accepting an edited preview as a trusted prescription.
 const checked=generateProgram(p.intake)
 if(s.forgeGeneratedPlans?.some(x=>x.createdAt===p.createdAt))throw Error('Esta proposta já foi aplicada.')
 if(schedule&&(s.scheduleMode==='rotation'||s.queue))throw Error('Sua agenda usa rotação. Salve sem agendar e organize a rotação no Plano.')
 const planId=uid(),prefix=String(p.intake.name||'Meu treino').trim().slice(0,40)||'Meu treino'
 const routines=checked.routines.map(r=>({...r,id:uid(),name:prefix+' · '+r.name,forgeGenerated:planId}))
 s.routines=[...(s.routines||[]),...routines];s.forgeTitanLoaded=true
 if(schedule){s.forgeScheduleBackups=[...(s.forgeScheduleBackups||[]),{at:new Date().toISOString(),week:structuredClone(s.week||{}),dayPlan:structuredClone(s.dayPlan||{})}];s.week=Object.fromEntries(checked.days.map((d,i)=>[d,[routines[i].id]]));s.dayPlan=Object.fromEntries(Object.entries(s.dayPlan||{}).filter(([date])=>date<todayISO()))}
 s.forgeGeneratedPlans=[...(s.forgeGeneratedPlans||[]),{id:planId,createdAt:p.createdAt,version:BUILDER_VERSION,intake:checked.intake,routineIds:routines.map(r=>r.id),progression:checked.progression,notes:checked.notes,coverage:checked.coverage}]
 return planId
}
export const BUILDER_EXERCISES=Object.entries(MOVES).map(([key,m])=>({key,label:m.label}))
