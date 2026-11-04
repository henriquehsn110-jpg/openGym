import { FORGE_DEMOS } from './forge-demos.js'
export function youtubeId(raw) {
 try { const u=new URL(raw); if(!['https:','http:'].includes(u.protocol)) return null; const h=u.hostname.toLowerCase();let id=null;
 if(h==='youtu.be') id=u.pathname.slice(1).split('/')[0];
 else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h)) id=u.searchParams.get('v')||u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
 return /^[\w-]{11}$/.test(id||'')?id:null } catch { return null }
}
export function demoFor(S,id) {
 const saved=S.forgeYouTube?.[id]; const custom=youtubeId(saved);
 // A private override always wins. Never claim its author/variant was checked by FORGE.
 if(custom) return {videoId:custom,source:'https://www.youtube.com/watch?v='+custom,custom:true,channel:'Vídeo escolhido por você'};
 return FORGE_DEMOS[id] || null;
}
export const thumbnailFor = id => 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg'
