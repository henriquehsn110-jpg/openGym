import React, { useEffect, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { exerciseNameFor } from '../lib/i18n.js'
import { FORGE_DEMOS } from '../lib/forge-demos.js'
import { youtubeId, demoFor, thumbnailFor } from '../lib/forge-video.js'
import './forge-media.css'
export { youtubeId } from '../lib/forge-video.js'
export default function YouTubeDemo({ex}) {
 const saved=useStore(s=>s.S.forgeYouTube?.[ex.id]||'');const update=useStore(s=>s.update);
 const [draft,setDraft]=useState(saved),[error,setError]=useState(''),[play,setPlay]=useState(false),[broken,setBroken]=useState(false);
 const demo=demoFor({forgeYouTube:{[ex.id]:saved}},ex.id);const meta=FORGE_DEMOS[ex.id];const name=meta?.name||exerciseNameFor(ex);
 useEffect(()=>{setDraft(saved);setPlay(false);setBroken(false);setError('')},[saved,ex.id]);
 return <section className="forge-demo" aria-label={'Demonstração: '+name}>
  <div className="forge-demo-heading"><strong>Como executar</strong><span>{demo?.custom?'SEU VÍDEO':demo?'VÍDEO DO EXERCÍCIO':'ESCOLHA UM VÍDEO'}</span></div>
  {demo ? <>
   {play ? <iframe title={'Vídeo: '+name} src={'https://www.youtube-nocookie.com/embed/'+demo.videoId+'?playsinline=1&autoplay=1&rel=0'} allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button className="forge-video-cover" onClick={()=>setPlay(true)} aria-label={'Assistir: '+name}>
    {!broken&&<img src={thumbnailFor(demo.videoId)} alt={'Capa do vídeo: '+name} loading="lazy" onError={()=>setBroken(true)}/>}<span className="forge-play-circle" aria-hidden="true">▶</span><span className="forge-video-caption">Assistir demonstração</span></button>}
   <p className="forge-video-credit">{demo.channel}{!demo.custom&&' · Áudio em inglês'} <a href={demo.source} target="_blank" rel="noopener noreferrer">Abrir no YouTube ↗</a></p>
   {play&&<small>Se a reprodução não estiver disponível aqui, toque em “Abrir no YouTube”.</small>}
  </> : <p>Este exercício ainda não tem um vídeo associado. <a href={'https://www.youtube.com/results?search_query='+encodeURIComponent(name+' execução exercício')} target="_blank" rel="noopener noreferrer">Buscar no YouTube ↗</a></p>}
  {meta&&<div className="forge-technique"><strong>{meta.variant}</strong><ul>{meta.tips.map(tip=><li key={tip}>{tip}</li>)}</ul><small>O vídeo ilustra o movimento. Siga as séries, cargas e a respiração da sua ficha.</small></div>}
  <details className="forge-video-editor"><summary>{saved?'Trocar meu vídeo':'Escolher outro vídeo'}</summary>
   <label>Link do YouTube<input type="url" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></label>
   <button className="btn" onClick={()=>{if(!youtubeId(draft)){setError('Use um link válido de vídeo do YouTube.');return}update(s=>{s.forgeYouTube={...s.forgeYouTube,[ex.id]:draft}});setError('')}}>Salvar no meu aparelho</button>
   {saved&&<button className="btn" onClick={()=>update(s=>{const m={...s.forgeYouTube};delete m[ex.id];s.forgeYouTube=m})}>Usar vídeo padrão</button>}
   {error&&<p role="alert">{error}</p>}
  </details>
 </section>
}
