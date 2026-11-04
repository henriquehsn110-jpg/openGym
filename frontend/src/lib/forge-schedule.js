// Resolve the next valid scheduled routine in the same order shown in the agenda.
// Shared by the dashboard and the personal training page to avoid inconsistent destinations.
export function nextForgeRoutine(s,now=new Date()) {
 for(let offset=0;offset<7;offset++) {
  const d=(now.getDay()+offset)%7;
  for(const id of [].concat(s.week?.[d]||[])) {
   const r=(s.routines||[]).find(r=>r.id===id);
   if(r)return {r,d,offset};
  }
 }
 return null;
}
export const forgeRoutineLink=id=>'/my-training'+(id?'?routine='+encodeURIComponent(id):'');
