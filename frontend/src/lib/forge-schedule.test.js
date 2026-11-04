import {expect,it} from 'vitest'
import {nextForgeRoutine,forgeRoutineLink} from './forge-schedule.js'
const s={routines:[{id:'mon',name:'A'},{id:'thu',name:'B'},{id:'fri',name:'C'}],week:{1:['mon'],4:['thu'],5:['fri']}}
it('on a rest Wednesday opens the same Thursday routine announced on the dashboard',()=>{
 const next=nextForgeRoutine(s,new Date(2026,10,4,19));expect(next).toEqual({r:s.routines[1],d:4,offset:1});expect(forgeRoutineLink(next.r.id)).toBe('/my-training?routine=thu')
})
it('keeps agenda order, skips stale IDs and rolls into the next week',()=>{
 expect(nextForgeRoutine({...s,week:{4:['deleted','fri','thu']}},new Date(2026,10,4)).r.id).toBe('fri')
 expect(nextForgeRoutine(s,new Date(2026,10,7))).toMatchObject({d:1,offset:2,r:{id:'mon'}})
 expect(nextForgeRoutine({routines:[],week:{4:['deleted']}},new Date(2026,10,4))).toBe(null)
 expect(forgeRoutineLink('a&b')).toBe('/my-training?routine=a%26b')
})
