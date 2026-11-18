import {EXIDX,isCustomEx} from './exercises.js'
import {mediaOf,cleanUrl} from './media-refs.js'

// Exact names reviewed against the movement and equipment in imported training sheets.
// An "or" prescription offers both demonstrations, without changing the saved exercise.
export const IMPORTED_DEMONSTRATIONS = {
 'terra romeno com halteres':['1459'],
 'cadeira abdutora':['0597'],
 'puxada frontal aberta ou neutra':['2291','4217'],
 'remada articulada com apoio':['2664'],
 'crucifixo inverso na maquina':['0602'],
 'triceps na corda':['0200'],
 'elevacao pelvica na maquina ou smith':['2146','3110'],
 'mesa flexora':['0586'],
 'extensao de quadril na polia':['0228'],
 'panturrilha sentada':['0594'],
}
const normalized=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ')
export function importedDemonstrations(ex){
 if(!isCustomEx(ex)||mediaOf(ex)||cleanUrl(ex?.url))return []
 return (IMPORTED_DEMONSTRATIONS[normalized(ex.n)]||[]).map(id=>EXIDX[id]).filter(Boolean)
}
