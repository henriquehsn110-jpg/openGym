import React, { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { exerciseNameFor } from '../lib/i18n.js'
export function youtubeId(raw){
 try{const u=new URL(raw);const h=u.hostname.toLowerCase();let id=null;if(h==='youtu.be')id=u.pathname.slice(1).split('/')[0];else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h))id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];return /^[\w-]{11}$/.test(id||'')?id:null}catch{return null}
}
export default function YouTubeDemo({ex}){
 const saved=useStore(s=>s.S.forgeYouTube?.[ex.id]||'');const update=useStore(s=>s.update);const [draft,setDraft]=useState(saved);const [error,setError]=useState('');const [play,setPlay]=useState(false);const id=youtubeId(saved);const name=exerciseNameFor(ex)
 return <section style={{padding:12,border:'1px solid var(--sep)',borderRadius:12,margin:'8px 0'}}><strong>Demonstração no YouTube</strong>
 {id&&(play?<iframe title={name} src={'https://www.youtube-nocookie.com/embed/'+id} style={{width:'100%',aspectRatio:'16 / 9',border:0}} allow="fullscreen; picture-in-picture" allowFullScreen/>:<p><button className="btn" onClick={()=>setPlay(true)}>Carregar vídeo</button></p>)}
 <p><a href={saved||'https://www.youtube.com/results?search_query='+encodeURIComponent(name+' execução exercício')} target="_blank" rel="noreferrer">{id?'Abrir no YouTube':'Buscar demonstração no YouTube'}</a></p>
 <details><summary>{id?'Trocar vídeo':'Salvar um link para este exercício'}</summary><label>Link do YouTube<input type="url" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" style={{width:'100%',display:'block',margin:'8px 0'}}/></label><button className="btn" onClick={()=>{if(!youtubeId(draft)){setError('Use um link válido de vídeo do YouTube.');return}update(s=>{s.forgeYouTube={...s.forgeYouTube,[ex.id]:draft}});setError('');setPlay(false)}}>Salvar no meu perfil</button>{id&&<button className="btn" onClick={()=>{update(s=>{const m={...s.forgeYouTube};delete m[ex.id];s.forgeYouTube=m});setDraft('');setPlay(false)}}>Remover link</button>}{error&&<p role="alert">{error}</p>}</details><small>O vídeo só é carregado quando você tocar. Alguns autores bloqueiam a reprodução incorporada; nesse caso, abra no YouTube. Escolha uma demonstração compatível com a variante do exercício.</small></section>
}
