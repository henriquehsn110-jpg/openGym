import {it,expect} from 'vitest'
import {parseTrainingText,applyPdfPlan,validateImportedRow,exerciseSuggestions} from './forge-pdf-plan.js'
import {pdfTextRows} from './forge-pdf-rows.js'
const approved=text=>{const d=parseTrainingText(text);for(const r of d.routines)for(const e of r.ex){e.reviewed=true;if(!e.exerciseId)e.custom=true}return d}
it('groups routines, preserves notes and keeps ambiguous names for manual matching',()=>{
 const d=parseTrainingText('Treino A\n1. Supino reto com halteres 3x8–12 20kg descanso 90s\nSupino 3x10\nTreino B\nExercício especial 3x12/10/8\nOrientação: bi-set com descanso após o par')
 expect(d.routines).toHaveLength(2);const [a,b]=d.routines[0].ex
 expect(a).toMatchObject({name:'Supino reto com halteres',exerciseId:'0289',sets:'3',reps:'8–12',weight:'20',unit:'kg',rest:'90',reviewed:false})
 expect(b.exerciseId).toBe('');expect(b.source).toBe('Supino 3x10');expect(d.ignored).toEqual(['Orientação: bi-set com descanso após o par'])
})
it('reads units from column headings and distinguishes timed repetitions from rest',()=>{
 const d=parseTrainingText('Treino A\nExercício | Séries | Repetições | Carga (kg) | Descanso (s)\nPrancha especial | 3 | 30s | 0 | 60\nRemada especial | 3 | 8-12 | 12,5 | 90')
 expect(d.routines[0].ex[0]).toMatchObject({mode:'time',duration:'30',rest:'60',weight:'0',sets:'3',reps:''})
 expect(d.routines[0].ex[1]).toMatchObject({mode:'reps',reps:'8-12',weight:'12.5',rest:'90'})
 const e=parseTrainingText('Exercício | Séries | Reps | Carga (lb) | Descanso (min)\nRemada especial | 3 | 10 | 44 | 1,5').routines[0].ex[0]
 expect(e).toMatchObject({weight:'44',unit:'lb',rest:'90'})
})
it('does not invent omitted values or units; supports holds and pyramid prescriptions',()=>{
 const d=parseTrainingText('Exercício | Séries | Repetições | Carga | Descanso\nRemada especial | 3 | 12/10/8 | 20 | 60')
 expect(d.routines[0].ex[0]).toMatchObject({weight:'',rest:'',reps:'12/10/8'});expect(d.routines[0].ex[0].note).toContain('sem unidade')
 const hold=parseTrainingText('Prancha especial 3x1min descanso 30s').routines[0].ex[0];expect(hold).toMatchObject({mode:'time',duration:'60',reps:'',rest:'30'})
 expect(parseTrainingText('Supino reto com halteres').routines[0].ex[0]).toMatchObject({sets:'',reps:'',weight:'',rest:''})
})
it('appends atomically, registers custom exercises, converts loads and preserves unrelated data',()=>{
 const d=approved('Treino A\nSupino reto com halteres 3x8-12 44lb descanso 90s\nTreino B\nMovimento especial 3x12/10/8\nPrancha especial 3x30s')
 const s={unit:'kg',routines:[{id:'old',ex:[{weight:25}]}],customEx:[{id:'mine'}],week:{1:['old']},workouts:[{id:'history'}],forgeMeals:[{name:'meal'}],exWeights:{'0289':50}}
 const before=structuredClone(s);const ids=applyPdfPlan(s,d);expect(ids).toHaveLength(2);expect(s.routines[0]).toEqual(before.routines[0]);for(const k of ['week','workouts','forgeMeals','exWeights'])expect(s[k]).toEqual(before[k])
 expect(s.customEx).toHaveLength(3);expect(s.routines[1].ex[0]).toMatchObject({id:'0289',sets:3,repsMin:8,repsMax:12,weight:20,restSec:90,prog:'off'});expect(s.routines[2].ex[0].pyramid).toEqual([12,10,8]);expect(s.routines[2].ex[1]).toMatchObject({mode:'time',sec:30})
 const invalid=approved('Movimento especial 3x10\nOutro movimento 3x10');invalid.routines[0].ex[1].sets='';const untouched=structuredClone(s);expect(()=>applyPdfPlan(s,invalid)).toThrow(/séries/);expect(s).toEqual(untouched)
})
it('requires review and a mapping or explicit custom choice, validates values and blocks active sessions',()=>{
 const e=parseTrainingText('Movimento especial 3x10').routines[0].ex[0];expect(()=>validateImportedRow(e)).toThrow(/revisão/);e.reviewed=true;expect(()=>validateImportedRow(e)).toThrow(/correspondência/);e.custom=true
 for(const patch of [{sets:'0'},{sets:'1.5'},{reps:'12/10/8/6'},{reps:'12-8'},{rest:'NaN'},{weight:'-1'},{mode:'time',duration:'0'}])expect(()=>validateImportedRow({...e,...patch})).toThrow()
 expect(()=>applyPdfPlan({active:{}},approved('Movimento especial 3x10'))).toThrow(/sessão/)
 expect(()=>parseTrainingText('x'.repeat(150001))).toThrow(/grande/)
 expect(exerciseSuggestions('supino reto com halteres').exact).toBe(true)
})
it('restores table rows from unordered PDF text fragments without joining separate rows',()=>{
 const item=(str,x,y,width=70)=>({str,width,transform:[1,0,0,1,x,y]})
 const text=pdfTextRows([item('3',250,700,10),item('Treino A',20,730),item('10',350,700,15),item('Remada',20,700)])
 expect(text).toBe('Treino A\nRemada | 3 | 10')
})
