// @vitest-environment happy-dom
import {it,expect,vi,beforeEach} from 'vitest'
const mock=vi.hoisted(()=>({getDocument:vi.fn(),createWorker:vi.fn()}))
vi.mock('pdfjs-dist',()=>({GlobalWorkerOptions:{},getDocument:mock.getDocument}))
vi.mock('tesseract.js',()=>({createWorker:mock.createWorker}))
import {readTrainingPdf} from './forge-pdf-read.js'
const file=(body='%PDF-1.7',size=body.length)=>({size,arrayBuffer:async()=>new TextEncoder().encode(body).buffer})
let page,doc,task,worker
beforeEach(()=>{
 page={getTextContent:vi.fn(async()=>({items:[{str:'Supino reto com halteres 3x10',width:100,transform:[1,0,0,1,20,700]}]})),cleanup:vi.fn(),getViewport:({scale})=>({width:700*scale,height:350*scale}),render:()=>({promise:Promise.resolve()})}
 doc={numPages:1,getPage:vi.fn(async()=>page)} // PDF.js 6 exposes destroy on the loading task, not on the document.
 task={promise:Promise.resolve(doc),destroy:vi.fn(async()=>{})};mock.getDocument.mockReturnValue(task)
 worker={recognize:vi.fn(async()=>({data:{text:'Supino reto com halteres 3x10'}})),terminate:vi.fn(async()=>{})};mock.createWorker.mockResolvedValue(worker)
})
it('reads text locally, uses only same-origin resource URLs and releases the loading task',async()=>{
 expect(await readTrainingPdf(file())).toBe('Supino reto com halteres 3x10');const args=mock.getDocument.mock.calls.at(-1)[0];expect(args.data).toBeInstanceOf(Uint8Array);for(const key of ['cMapUrl','standardFontDataUrl','wasmUrl'])expect(new URL(args[key]).origin).toBe(window.location.origin);expect(task.destroy).toHaveBeenCalledOnce();expect(page.cleanup).toHaveBeenCalledOnce()
})
it('rejects invalid files, page limits and cancellation and cleans failed loads',async()=>{
 await expect(readTrainingPdf(file('notPDF'))).rejects.toThrow(/válido/);await expect(readTrainingPdf(file('%PDF-',11*1024*1024))).rejects.toThrow(/10 MB/)
 doc.numPages=21;await expect(readTrainingPdf(file())).rejects.toThrow(/20 páginas/);expect(task.destroy).toHaveBeenCalledOnce()
 const abort=new AbortController();abort.abort();await expect(readTrainingPdf(file(),{signal:abort.signal})).rejects.toThrow(/cancelada/)
 task.promise=Promise.reject(Object.assign(new Error('password'),{name:'PasswordException'}));await expect(readTrainingPdf(file())).rejects.toThrow(/senha/);expect(task.destroy).toHaveBeenCalledTimes(2)
})
it('uses bundled Portuguese OCR resources and terminates the worker',async()=>{
 const spy=vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({})
 try{expect(await readTrainingPdf(file(),{ocr:true})).toContain('3x10');const [lang,oem,opts]=mock.createWorker.mock.calls.at(-1);expect(lang).toBe('por');expect(oem).toBe(1);for(const key of ['langPath','corePath','workerPath'])expect(new URL(opts[key],window.location.href).origin).toBe(window.location.origin);expect(worker.terminate).toHaveBeenCalledOnce();expect(task.destroy).toHaveBeenCalledOnce()}finally{spy.mockRestore()}
})
