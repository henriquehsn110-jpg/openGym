import {EXIDX} from './exercises.js'
import {uid,todayISO} from './format.js'

export const BUILDER_VERSION=2
export const BUILDER_GOALS={general:'Saúde e condicionamento',restart:'Retomar com constância',fatloss:'Reduzir gordura',muscle:'Ganhar massa muscular',strength:'Ganhar força'}
export const BUILDER_SOURCES=[{title:'ACSM · Diretriz de treinamento resistido 2026',url:'https://acsm.org/resistance-training-guidelines-update-2026/'},{title:'Posicionamento completo · Currier et al., 2026',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/'}]
// Curated movements. Never join external catalogues by reused IDs.
const MOVES={
 squat:['1760','Agachamento goblet','Quadríceps',['dumbbell']],
 squatBand:['1004','Agachamento com elástico','Quadríceps',['band']],
 squatBody:['1197','Agachamento livre','Quadríceps',[]],
 legpress:['8375','Leg press 45°','Quadríceps',['machines']],
 hinge:['1459','Levantamento romeno com halteres','Posterior de coxa / glúteos',['dumbbell']],
 bridge:['0484','Elevação de quadril no solo','Posterior de coxa / glúteos',[]],
 press:['3668','Supino com halteres no solo','Peito',['dumbbell']],
 bench:['0289','Supino reto com halteres','Peito',['dumbbell','bench']],
 knees:['1182','Flexão de braços com joelhos apoiados','Peito',[]],
 pushup:['0662','Flexão de braços','Peito',[]],
 row:['0293','Remada curvada com halteres','Costas',['dumbbell']],
 bandrow:['3896','Remada sentada com elástico','Costas',['band']],
 cablerow:['0180','Remada baixa com triângulo','Costas',['cable']],
 pulldown:['1047','Puxada alta com triângulo','Costas',['cable']],
 shoulder:['0334','Elevação lateral com halteres','Ombros',['dumbbell']],
 bandshoulder:['0997','Desenvolvimento com elástico','Ombros',['band']],
 curl:['0294','Rosca com halteres','Bíceps',['dumbbell']],
 triceps:['0201','Tríceps na polia com barra','Tríceps',['cable']],
 legcurl:['0599','Cadeira flexora','Posterior de coxa',['machines']],
 calf:['3018','Elevação de panturrilhas em pé','Panturrilhas',[]],
 core:['0276','Dead bug','Tronco',[]]
}
export function validateIntake(a){
 if(!a.adult)throw Error('Este gerador é destinado a adultos. Confirme que você tem 18 anos ou mais.')
 if(a.screen!=='none')throw Error('Dor, lesão, gestação, pós-parto ou recomendação de adaptação individual precisam de avaliação profissional. Não geramos automaticamente uma ficha nessas situações.')
 if(!BUILDER_GOALS[a.goal]||!['new','returning','regular'].includes(a.experience))throw Error('Escolha objetivo e experiência.')
 if(![30,45,60].includes(Number(a.minutes)))throw Error('Escolha 30, 45 ou 60 minutos.')
 if(!Array.isArray(a.days)||a.days.length<1||a.days.length>7||new Set(a.days).size!==a.days.length||a.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Selecione de 1 a 7 dias diferentes por semana.')
 if(!Array.isArray(a.equipment)||!a.equipment.some(e=>['dumbbell','band','cable'].includes(e)))throw Error('Para incluir puxadas, informe ao menos halteres, elástico ou polia. Esta versão não gera uma ficha completa apenas com peso corporal.')
 if(a.equipment.some(e=>!['dumbbell','band','bench','cable','machines'].includes(e)))throw Error('Equipamento não reconhecido.')
 if(!Array.isArray(a.exclude)||a.exclude.some(k=>!MOVES[k]))throw Error('Exclusão de exercício inválida.')
 return true
}
export function generateProgram(raw){
 const a=structuredClone(raw);a.minutes=Number(a.minutes);validateIntake(a)
 const available=k=>!a.exclude.includes(k)&&MOVES[k][3].every(e=>a.equipment.includes(e))
 const pick=(...keys)=>{const k=keys.find(available);if(!k)throw Error('Não há uma alternativa compatível para um dos movimentos. Revise equipamentos e exclusões ou monte a ficha com um profissional.');return k}
 const experienced=a.experience==='regular';const strong=a.goal==='strength'&&experienced
 const squat=pick('legpress','squat','squatBand','squatBody'),hinge=pick('hinge','bridge')
 const press=pick('bench','press',...(experienced?['pushup','knees']:['knees','pushup'])),row=pick('cablerow','row','bandrow')
 const optional=(...keys)=>keys.find(available)
 const extras=[optional('shoulder','bandshoulder'),optional('calf'),optional('core')].filter(Boolean)
 const upper=[press,row,optional('pulldown')||row,optional('shoulder','bandshoulder'),...(a.minutes>=45?[optional('curl'),optional('triceps')]:[])].filter(Boolean)
 // Avoid duplicate movements when no separate vertical pull is available.
 const unique=ks=>[...new Set(ks)]
 const lower=[squat,hinge,optional('legcurl'),optional('calf'),optional('core')].filter(Boolean)
 const full=unique([squat,press,hinge,row,...extras])
 const days=[1,2,3,4,5,6,0].filter(d=>a.days.includes(d))
 // Choose full-body sessions that are separated even across Sunday/Monday.
 const adjacent=(x,y)=>(x+1)%7===y||(y+1)%7===x
 let spaced=[]
 for(let mask=1;mask<(1<<days.length);mask++){
  const subset=days.filter((d,i)=>mask&(1<<i))
  if(subset.length>3||subset.some((d,i)=>subset.slice(i+1).some(e=>adjacent(d,e))))continue
  if(subset.length>spaced.length)spaced=subset
 }
 const split=days.length===2&&adjacent(...days)||experienced&&days.length>=4
 let strengthDays=split?days.slice():spaced
 if(split&&days.length%2===1)strengthDays=days.filter((d,i)=>i!==days.length-1)
 const strengthCount=strengthDays.length
 const notes=[]
 if(days.length===1)notes.push('Um dia disponível é um começo válido. Esta frequência não equivale à recomendação de trabalhar os grandes grupos ao menos duas vezes na semana; considere ampliar quando possível.')
 if(split&&strengthCount===2)notes.push('Os dois dias consecutivos foram divididos entre superiores e inferiores. Cada região recebe uma sessão nesta semana; quando possível, dias espaçados permitem duas sessões de corpo inteiro.')
 if(strengthCount<days.length)notes.push(`${strengthCount} sessões de musculação e ${days.length-strengthCount} de recuperação ativa. Dias selecionados são dias de atividade; recuperação ativa não conta como séries de musculação. A escolha evita repetir os mesmos grupos em dias seguidos, inclusive na virada da semana.`)
 if(!experienced&&days.length>=4)notes.push('Para quem começa ou retorna, mantemos até três sessões de corpo inteiro e usamos os outros dias para atividade leve. Mais dias disponíveis não exigem mais sessões pesadas.')
 if(a.experience!=='regular')notes.push('Comece com volume moderado e esforço confortável. Retome gradualmente; o objetivo força não exige cargas máximas nesta fase.')
 if(a.goal==='fatloss')notes.push('A musculação ajuda a preservar força e massa muscular. Este programa não calcula déficit energético nem promete perda de gordura; caminhada e alimentação podem complementar a rotina.')
 const make=(keys,index,splitSession=false)=>{
  let chosen=unique(keys)
  if(!splitSession&&a.minutes===30)chosen=[squat,press,hinge,row,extras[index%extras.length]].filter(Boolean)
  const initial=experienced&&a.goal==='muscle'&&strengthCount<6?3:2
  const ex=chosen.map(k=>{const [id,label,group,requires]=MOVES[k];if(!EXIDX[id])throw Error('Exercício indisponível no catálogo: '+label)
   const compound=[squat,hinge,press,row,'pulldown'].includes(k),core=k==='core'
   return {id,sets:initial,reps:core?6:strong&&compound?6:8,repsMin:core?6:strong&&compound?6:8,repsMax:core?10:strong&&compound?8:12,restSec:core?60:strong&&compound?180:compound?120:75,prog:'off',...(core?{side:true}:{}),note:(core?'Repetições por lado. ':'')+'Escolha uma carga ou dificuldade que permita execução controlada, respiração contínua e '+(experienced?'2–3':'3–4')+' repetições ainda possíveis. Pare se surgir dor.',builder:{key:k,label,group,requires}}
  })
  const estimate=()=>Math.ceil(7+ex.reduce((n,e)=>n+1+e.sets*(e.id==='0276'?1:0.65)+(e.sets-1)*e.restSec/60,0))
  // Keep every movement pattern; reduce sets before pretending a long session fits.
  while(estimate()>a.minutes&&ex.some(e=>e.sets>1)){
   const e=[...ex].reverse().find(e=>e.sets===Math.max(...ex.map(x=>x.sets)));e.sets--
  }
  if(estimate()>a.minutes)throw Error('Não foi possível incluir os movimentos no tempo informado. Escolha uma sessão mais longa.')
  return {id:'preview-'+index,name:splitSession?(index%2?'Inferiores ':'Superiores ')+String.fromCharCode(65+Math.floor(index/2)):'Corpo inteiro '+String.fromCharCode(65+index),ex,estimatedMinutes:estimate()}
 }
 const recovery=()=>{
  const duration=experienced?Math.min(30,a.minutes-7):Math.min(20,a.minutes-7)
  return {id:'preview-recovery',name:'Recuperação ativa',estimatedMinutes:duration+7,recovery:true,ex:[{id:'2258',mode:'cardio',sets:1,min:duration,speed:0,restSec:0,prog:'off',note:'Caminhada em local plano e seguro, em ritmo leve que permita conversar confortavelmente. Comece com menos minutos se necessário. Não é um dia de treino pesado. Se precisar de repouso ou sentir desconforto, descanse; não há obrigação de completar a duração.',builder:{key:'walk',label:'Caminhada leve',group:'Recuperação ativa',requires:[]}}]}
 }
 let strengthIndex=0
 const routines=days.map((d,i)=>{
  if(!strengthDays.includes(d))return {...recovery(),id:'preview-recovery-'+i}
  const index=strengthIndex++;return make(split?(index%2?lower:upper):full,index,split)
 })
 const volume={};for(const r of routines)for(const e of r.ex.filter(e=>e.mode!=='cardio'))volume[e.builder.group]=(volume[e.builder.group]||0)+e.sets
 if(routines.some(r=>r.ex.some(e=>e.sets<2)))notes.push('O limite de tempo reduziu alguns exercícios a uma série. Este é um ponto de partida de menor volume; sessões mais longas permitem mais séries.')
 if(a.goal==='muscle')notes.push('Estudos favorecem volumes maiores, frequentemente cerca de 10 séries por grupo por semana. O volume inicial mostrado pode ser menor; aumente gradualmente conforme recuperação e tempo, sem tratar 10 séries como mínimo obrigatório.')
 notes.push('A estimativa inclui 7 minutos para aquecimento e séries leves de aproximação, além de execução, descansos e trocas. Filas e montagem de equipamentos podem aumentar a duração.')
 return {strengthCount,recoveryCount:days.length-strengthCount,version:BUILDER_VERSION,createdAt:new Date().toISOString(),intake:a,routines,days,volume,notes,progression:'Quando completar todas as séries no topo da faixa, com execução consistente e repetições em reserva por duas sessões, aumente a menor carga disponível e retorne ao início da faixa. Se não houver carga maior, aumente repetições dentro da faixa. Sem aumento automático de peso. Se a recuperação cair, reduza esforço/volume e reavalie.',review:'Reavalie em 4–6 semanas, ou antes se houver desconforto ou recuperação insuficiente. Esses prazos e as faixas de esforço são escolhas conservadoras do aplicativo, não limites clínicos validados.'}
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
 s.forgeGeneratedPlans=[...(s.forgeGeneratedPlans||[]),{id:planId,createdAt:p.createdAt,version:BUILDER_VERSION,intake:checked.intake,routineIds:routines.map(r=>r.id),progression:checked.progression,notes:checked.notes}]
 return planId
}
export const BUILDER_EXERCISES=Object.entries(MOVES).map(([key,m])=>({key,label:m[1]}))
