import * as pdfjs from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker
import {pdfTextRows} from './forge-pdf-rows.js'
export async function readTrainingPdf(file,{ocr=false,signal,onProgress=()=>{}}={}){
 if(file.size>10*1024*1024)throw Error('O PDF deve ter até 10 MB.')
 if(signal?.aborted)throw Error('Leitura cancelada.')
 const bytes=new Uint8Array(await file.arrayBuffer());if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('Selecione um arquivo PDF válido.')
 const base=new URL('./pdf-assets/',window.location.href).href
 const task=pdfjs.getDocument({data:bytes,isEvalSupported:false,useSystemFonts:true,cMapUrl:base+'cmaps/',cMapPacked:true,standardFontDataUrl:base+'standard_fonts/',wasmUrl:base+'wasm/'})
 let doc,worker;const stop=()=>{task.destroy();worker?.terminate().catch(()=>{})};signal?.addEventListener('abort',stop,{once:true})
 try{
  doc=await task.promise;if(doc.numPages>(ocr?8:20))throw Error(ocr?'O reconhecimento de imagens aceita até 8 páginas por vez. Divida o PDF.':'Importe até 20 páginas por vez.')
  if(ocr){onProgress('Preparando reconhecimento de texto no aparelho…');const {createWorker}=await import('tesseract.js');const {default:workerPath}=await import('tesseract.js/dist/worker.min.js?url');const assets=new URL('./ocr/',window.location.href).href;worker=await createWorker('por',1,{workerPath:new URL(workerPath,window.location.href).href,corePath:assets,langPath:assets,workerBlobURL:false,cacheMethod:'none',logger:()=>{},errorHandler:()=>{}})}
  const pages=[]
  for(let n=1;n<=doc.numPages;n++){
   if(signal?.aborted)throw Error('Leitura cancelada.')
   onProgress((ocr?'Reconhecendo':'Lendo')+' página '+n+' de '+doc.numPages+'…')
   const page=await doc.getPage(n)
   if(ocr){const original=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(2,1600/original.width,2400/original.height)});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);try{await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;const result=await worker.recognize(canvas);pages.push(result.data.text)}finally{canvas.width=0;canvas.height=0}}
   else{const content=await page.getTextContent();pages.push(pdfTextRows(content.items))}
   page.cleanup()
  }
  const text=pages.join('\n\n');if(text.length>150000)throw Error('Texto muito grande. Divida o PDF.');if(text.trim().length<15)throw Error('Não foi possível extrair texto. Se a ficha for uma imagem, marque reconhecimento de texto e leia novamente.');return text
 }catch(error){if(signal?.aborted)throw Error('Leitura cancelada.');if(error.name==='PasswordException')throw Error('Este PDF tem senha. Exporte uma cópia desbloqueada antes de importar.');throw error}
 finally{signal?.removeEventListener('abort',stop);await worker?.terminate().catch(()=>{});await task.destroy()}
}
