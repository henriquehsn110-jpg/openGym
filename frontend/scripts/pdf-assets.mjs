import {readFileSync,readdirSync} from 'node:fs'
import {resolve} from 'node:path'
// All OCR code/language data is shipped with the app. Documents never leave the browser.
export const pdfAssets=()=>({name:'forge-local-pdf-assets',generateBundle(){
 const emit=(path,fileName)=>this.emitFile({type:'asset',fileName,source:readFileSync(path)})
 const core=resolve('node_modules/tesseract.js-core')
 for(const name of readdirSync(core).filter(n=>/\.wasm(?:\.js)?$/.test(n)&&n.includes('lstm')))emit(resolve(core,name),'ocr/'+name)
 emit(resolve('node_modules/@tesseract.js-data/por/4.0.0_best_int/por.traineddata.gz'),'ocr/por.traineddata.gz')
 for(const folder of ['standard_fonts','cmaps','wasm']){const dir=resolve('node_modules/pdfjs-dist',folder);for(const name of readdirSync(dir))if(!name.endsWith('.map'))emit(resolve(dir,name),'pdf-assets/'+folder+'/'+name)}
}})
