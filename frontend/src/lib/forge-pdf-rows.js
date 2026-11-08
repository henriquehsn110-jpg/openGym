// Recover rows by page coordinates. Wide gaps become cells, not guesses about values.
export function pdfTextRows(items){
 const rows=[]
 for(const item of items){if(!item.str?.trim())continue;const y=item.transform[5],x=item.transform[4];let row=rows.find(r=>Math.abs(r.y-y)<3);if(!row){row={y,items:[]};rows.push(row)}row.items.push({x,end:x+(item.width||0),text:item.str})}
 return rows.sort((a,b)=>b.y-a.y).map(row=>{let out='',end=null;for(const item of row.items.sort((a,b)=>a.x-b.x)){out+=(end===null?'':item.x-end>14?' | ':' ')+item.text;end=item.end}return out.trim()}).join('\n')
}
