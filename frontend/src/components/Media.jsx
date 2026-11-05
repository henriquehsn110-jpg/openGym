import { useEffect, useRef, useState } from 'react'
import { imgSrc, gifSrc, isVideoSrc, isCustomEx, figureOf } from '../lib/exercises.js'
import { useStore } from '../store/useStore.js'
import { t, exerciseNameFor } from '../lib/i18n.js'
import Icon from './Icon.jsx'
import YouTubeDemo from './YouTubeDemo.jsx'
import {demoFor,thumbnailFor} from '../lib/forge-video.js'
import CustomMedia, { CustomThumb } from './CustomMedia.jsx'

// An exercise's picture, wherever one shows. A custom exercise goes to CustomMedia.jsx — its own
// photo, GIF, video or link, from the local media store — and never through imgSrc/gifSrc, which
// name files of the shipped dataset (a stray img/gif on a custom exercise, written by a fork, is
// ignored). The split is by component, not by branch, so each side keeps its own hooks in order.
export default function Media(p) {
  return isCustomEx(p.ex) ? <CustomMedia {...p} /> : <BuiltinVideo key={p.ex.id} {...p} />
}

function BuiltinVideo({ex,minimizable}) {
 const size=useStore(s=>s.S.gifSize),update=useStore(s=>s.update);
 const body=useStore(s=>figureOf(s.S));
 const [youtube,setYoutube]=useState(false);
 if(minimizable&&size==='off')return null;
 if(minimizable&&size==='mini')return <button className="forge-media-mini" onClick={()=>update(s=>{s.gifSize='full'})}><Thumb ex={ex}/><span>Ver demonstração <b>▶</b></span></button>;
 return <div className="forge-media-panel">
  {ex.gif ? <>
   <CatalogueAnimation key={body} ex={ex} body={body}/>
   <details className="forge-video-alternative" onToggle={e=>setYoutube(e.currentTarget.open)}>
    <summary>Vídeo explicativo no YouTube</summary>
    {youtube&&<YouTubeDemo ex={ex}/>}
   </details>
  </> : <YouTubeDemo ex={ex}/>}
  {minimizable&&<button className="forge-media-minimize" onClick={()=>update(s=>{s.gifSize='mini'})}>Recolher demonstração</button>}
 </div>
}

// Use the exact, unmodified 180 px drawing shipped by the non-commercial fork.
// Download only on an explicit tap; buffer the whole small clip once so loops do not seek
// across the network. The still stays underneath until playback actually starts.
function CatalogueAnimation({ex,body}) {
 const [requested,setRequested]=useState(false),[playing,setPlaying]=useState(false);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[stillFailed,setStillFailed]=useState(false);
 const [blocked,setBlocked]=useState(false);
 const videoRef=useRef(null);
 const animation=gifSrc(ex,body),isVideo=isVideoSrc(animation);
 const clipSrc=useClipInMemory(requested&&isVideo?animation:null);
 const name=exerciseNameFor(ex),meta=demoFor({},ex.id);
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)setPlaying(false)};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return ()=>document.removeEventListener('visibilitychange',pauseWhenHidden);
 },[]);
 useEffect(()=>{
  const video=videoRef.current;
  if(!video)return;
  if(!playing){video.pause();return;}
  video.muted=true;video.defaultMuted=true;video.setAttribute('muted','');
  const result=video.play();
  result?.catch(()=>{setPlaying(false);setBlocked(true)});
  return ()=>video.pause();
 },[playing,clipSrc,failed]);
 const toggle=()=>{
  setBlocked(false);
  if(failed){setFailed(false);setReady(false);setPlaying(true);setRequested(true);return;}
  setRequested(true);setPlaying(p=>!p);
 };
 const onError=()=>{setFailed(true);setReady(false);setPlaying(false)};
 const showMotion=!failed&&ready&&(isVideo||playing);
 const action=failed?'Tentar movimento novamente':playing?'Pausar movimento':'Ver movimento';
 return <section className="forge-demo forge-loop" aria-label={'Movimento: '+name}>
  <div className="forge-demo-heading"><strong>Como executar</strong><span>ANIMAÇÃO DO EXERCÍCIO</span></div>
  <button className="forge-loop-button" onClick={toggle} aria-label={action+': '+name} aria-pressed={playing}>
   <span className="forge-loop-stage">
    {!stillFailed?<img className="forge-loop-still" src={imgSrc(ex,body)} alt={name} onError={()=>setStillFailed(true)}/>:<Icon name="dumbbell"/>}
    {requested&&isVideo&&clipSrc&&!failed&&<video ref={videoRef} className={'forge-loop-motion'+(showMotion?' visible':'')} src={clipSrc}
     preload="auto" muted loop playsInline disablePictureInPicture aria-label={'Animação: '+name}
     onPlaying={()=>{setReady(true);setBlocked(false)}} onError={onError}/>}
    {requested&&!isVideo&&playing&&!failed&&<img className="forge-loop-motion visible" src={animation} alt={'Animação: '+name} onLoad={()=>setReady(true)} onError={onError}/>}
   </span>
   <span className="forge-loop-action"><Icon name={playing?'pause':'play'}/>{action}</span>
  </button>
  <p className="forge-loop-status" role="status">{failed?'Não foi possível carregar o movimento. A imagem continua disponível.':blocked?'Toque em Ver movimento para iniciar a reprodução.':playing&&!ready?'Carregando movimento…':playing?'Movimento em repetição · toque para pausar.':requested?'Movimento pausado.':'Toque para reproduzir aqui, sem sair do aplicativo.'}</p>
  {meta?.tips&&<div className="forge-technique"><strong>{meta.variant}</strong><ul>{meta.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></div>}
  <small>Siga as séries, cargas e a respiração da sua ficha.</small>
  <p className="forge-loop-credit">© Gym visual · openGym · <a href="./forge-sobre.html" target="_blank" rel="noopener noreferrer">Créditos e licença ↗</a></p>
 </section>
}

// Big autoplaying animation; tap toggles to the still frame. `compact` shrinks it (superset cards).
// `minimizable` (workout view) adds a persistent minimize/expand control so the animation stops
// eating the screen; the chosen size is saved to settings and carries across exercises and
// future workouts (issue #12). Settings can also turn workout media off entirely
// (gifSize 'off') — then nothing renders here and the exercise card closes up, exactly like
// an exercise without media. Any other/legacy value behaves as 'full'.
function BuiltinMedia({ ex, id, compact, minimizable }) {
  const [playing, setPlaying] = useState(true)
  // 'gif' → the animation failed, the still is showing; 'all' → the still failed too. Media is
  // fetched from wherever the build points (a mount, a CDN): a dropped connection, an expired
  // session on a gated instance or a CDN hiccup used to leave the browser's broken-image glyph
  // on a white block. Now the still stands in for the animation, a neutral tile stands in for
  // both, and a tap tries again — no text, so nothing new to translate.
  const [failed, setFailed] = useState(null)
  const gifSize = useStore(s => s.S.gifSize)
  const body = useStore(s => figureOf(s.S))
  const update = useStore(s => s.update)
  const clip = ex.gif && isVideoSrc(gifSrc(ex, body)) ? gifSrc(ex, body) : null
  const clipSrc = useClipInMemory(clip)
  if (!ex.gif) return null
  if (minimizable && gifSize === 'off') return null
  const mini = minimizable && gifSize === 'mini'
  const toggleSize = e => { e.stopPropagation(); update(s => { s.gifSize = mini ? 'full' : 'mini' }) }
  const showGif = playing && failed == null
  const onError = () => setFailed(showGif ? 'gif' : 'all')
  const onTap = () => {
    if (failed) { setFailed(null); setPlaying(true); return }
    setPlaying(p => !p)
  }
  return (
    <div className={'exmedia' + (compact ? ' compact' : '') + (mini ? ' mini' : '') + (failed === 'all' ? ' broken' : '')} id={id} onClick={onTap}>
      {failed === 'all'
        ? <div className="exmedia-x"><Icon name="dumbbell" /></div>
        : showGif && clip && clipSrc
          // No poster: Android's WebView went back to it at every loop and stalled there (the
          // still above stands in while the clip loads, so nothing is lost without it).
          ? <video ref={autoplayMuted} className="catvid" src={clipSrc} preload="auto" autoPlay muted loop playsInline disablePictureInPicture
              aria-label={exerciseNameFor(ex)} onError={onError} />
          : showGif && clip
            // the phone app is still reading the clip into memory: the still holds its place
            ? <img decoding="async" draggable={false} src={imgSrc(ex, body)} alt={exerciseNameFor(ex)} />
          : <img decoding="async" draggable={false} src={showGif ? gifSrc(ex, body) : imgSrc(ex, body)} alt={exerciseNameFor(ex)} onError={onError} />}
      {minimizable && (
        <button className="giftoggle" onClick={toggleSize}>
          <Icon name={mini ? 'expand' : 'minimize'} />{mini ? t('Expand') : t('Minimize')}
        </button>
      )}
      {!mini && !failed && (
        <span className="gifhint">
          <Icon name={playing ? 'pause' : 'play'} />{playing ? t('tap to pause') : t('tap to play')}
        </span>
      )}
    </div>
  )
}

// FORGE: web and installed browsers also buffer the small clip once to avoid repeated
// network seeks on every loop. Media bytes are unmodified. Falls back to streaming on error.
// In the phone app the clips come out of the app package through Capacitor's local server, which
// answers every seek with a fresh, slow read: each loop jumped back to 0 and sat there for one to
// five seconds, and users saw "slow and buggy" animations (the web, with its HTTP cache, never
// did). So the app reads a clip into memory once (20-40 KB) and plays it from there; the last few
// stay, so reopening an exercise is instant. The web keeps its URL and the browser's cache.
const MEMORY_CLIPS = 30
const clipCache = new Map()          // src -> object URL, oldest first
const clipLoads = new Map()          // src -> pending promise
function loadClip(src) {
  if (clipCache.has(src)) {
    const url = clipCache.get(src)
    clipCache.delete(src); clipCache.set(src, url)   // most recently used last
    return Promise.resolve(url)
  }
  if (!clipLoads.has(src)) {
    clipLoads.set(src, fetch(src)
      .then(r => (r.ok ? r.blob() : Promise.reject(new Error('HTTP ' + r.status))))
      .then(blob => {
        const url = URL.createObjectURL(blob)
        clipCache.set(src, url)
        while (clipCache.size > MEMORY_CLIPS) {
          const [old, oldUrl] = clipCache.entries().next().value
          clipCache.delete(old); URL.revokeObjectURL(oldUrl)
        }
        return url
      })
      .finally(() => clipLoads.delete(src)))
  }
  return clipLoads.get(src)
}

export function useClipInMemory(src, inApp = true) {
  const [url, setUrl] = useState(() => (src && inApp ? clipCache.get(src) || null : src))
  useEffect(() => {
    if (!src || !inApp) { setUrl(src); return }
    let alive = true
    setUrl(clipCache.get(src) || null)
    // A read that fails falls back to the URL itself: playing slowly beats not playing.
    loadClip(src).then(u => { if (alive) setUrl(u) }, () => { if (alive) setUrl(src) })
    return () => { alive = false }
  }, [src, inApp])
  return url
}

// React sets `muted` as a property only, never as the attribute, and Android's WebView (the phone
// app) allows autoplay only for a video that carries the attribute: the loop sat on its first frame
// there while every desktop browser played it. Set it before the first frame and start playback
// ourselves; a refusal leaves the still showing, which a tap can still start.
export function autoplayMuted(el) {
  if (!el) return
  el.muted = true
  el.defaultMuted = true
  el.setAttribute('muted', '')
  const p = el.play?.()
  if (p && typeof p.catch === 'function') p.catch(() => {})
}

// A still that will not load (offline and never cached, a lapsed session on a gated instance, a
// CDN hiccup) gets the same neutral tile as an exercise without media, instead of the browser's
// broken-image glyph in a list of them (#281). The failure is remembered per image, so a list
// that re-renders does not ask again; a new exercise in the same slot tries its own.
export function Thumb(p) {
  return isCustomEx(p.ex) ? <CustomThumb {...p} /> : <BuiltinThumb {...p} />
}
function BuiltinThumb({ ex }) {
  const saved = useStore(s => s.S.forgeYouTube?.[ex.id])
  const body = useStore(s => figureOf(s.S))
  const demo = demoFor({ forgeYouTube: { [ex.id]: saved } }, ex.id)
  const [broken, setBroken] = useState(() => new Set())
  const cover = demo ? thumbnailFor(demo.videoId) : null
  // A video is optional. Every catalogue exercise keeps its own bundled illustration,
  // also used when an external YouTube cover cannot load (offline or unavailable).
  const still = ex.img || (body === 'female' ? ex.fv : ex.mv) ? imgSrc(ex, body) : null
  const useCover = cover && !broken.has(cover)
  const src = useCover ? cover : still && !broken.has(still) ? still : null
  if (!src) return <div className="thumb thumb-x" aria-label="Imagem indisponível"><Icon name="dumbbell" /></div>
  const image = <img key={src} className={'thumb' + (useCover ? ' forge-video-thumb' : '')}
    loading="lazy" decoding="async" draggable={false} src={src} alt=""
    onError={() => setBroken(prev => new Set([...prev, src]))} />
  return useCover ? <div className="forge-thumb-wrap">{image}<span aria-hidden="true">▶</span></div> : image
}
